import argparse
import datetime
import os
import re
import sys
from dataclasses import asdict, dataclass, field

import pandas as pd
from playwright.sync_api import sync_playwright

ICON_CHARS = re.compile(r"[\ue000-\uf8ff]")


@dataclass
class Business:
    name: str = None
    address: str = None
    website: str = None
    phone_number: str = None
    reviews_count: int = None
    reviews_average: float = None
    latitude: float = None
    longitude: float = None
    category: str = None
    location: str = None


@dataclass
class BusinessList:
    business_list: list[Business] = field(default_factory=list)
    _seen: set = field(default_factory=set, init=False)
    save_at: str = os.path.join("clinic_dataset")

    def __post_init__(self):
        os.makedirs(self.save_at, exist_ok=True)

    def add(self, b: Business):
        h = hash((b.name, b.address, b.phone_number))
        if h not in self._seen:
            self.business_list.append(b)
            self._seen.add(h)

    def df(self):
        return pd.json_normalize((asdict(b) for b in self.business_list))

    def save(self, name):
        self.df().to_excel(f"{self.save_at}/{name}.xlsx", index=False)
        self.df().to_csv(f"{self.save_at}/{name}.csv", index=False)


def clean_text(text: str) -> str:
    if not text:
        return ""
    text = ICON_CHARS.sub("", text)
    return " ".join(text.split())


def aria_value(aria_label: str, prefix: str) -> str:
    if not aria_label:
        return ""
    if aria_label.lower().startswith(prefix.lower()):
        return clean_text(aria_label[len(prefix) :])
    return clean_text(aria_label)


def load_searches(search_arg: str | None, input_file: str) -> list[str]:
    if search_arg:
        return [search_arg]

    if not os.path.exists(input_file):
        print(f"No search provided and '{input_file}' not found.")
        sys.exit(1)

    with open(input_file, encoding="utf-8") as f:
        searches = [line.strip() for line in f if line.strip()]

    if not searches:
        print(f"'{input_file}' is empty. Add one search query per line.")
        sys.exit(1)

    return searches


def accept_cookies(page) -> None:
    for label in ("Accept all", "Reject all", "Accept"):
        try:
            page.get_by_role("button", name=label).click(timeout=3000)
            page.wait_for_timeout(1000)
            return
        except Exception:
            pass


def scroll_results(page, target_count: int, max_scrolls: int = 30) -> None:
    feed = page.locator('div[role="feed"]')
    if not feed.count():
        return

    for _ in range(max_scrolls):
        links = page.locator('a[href*="/maps/place"]')
        if links.count() >= target_count:
            break

        prev_scroll = feed.evaluate("(el) => el.scrollTop")
        feed.evaluate("(el) => { el.scrollTop += 1000 }")
        page.wait_for_timeout(2000)
        new_scroll = feed.evaluate("(el) => el.scrollTop")
        if new_scroll <= prev_scroll:
            break


def extract_coordinates(url: str) -> tuple[float | None, float | None]:
    if not url:
        return None, None

    patterns = [
        r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)",
        r"@(-?\d+\.\d+),(-?\d+\.\d+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return float(match.group(1)), float(match.group(2))

    return None, None


def collect_place_urls(page, total: int) -> list[str]:
    links = page.locator('a[href*="/maps/place"]')
    urls = []
    seen = set()

    for i in range(links.count()):
        href = links.nth(i).get_attribute("href")
        if not href or href in seen:
            continue
        seen.add(href)
        urls.append(href)
        if len(urls) >= total:
            break

    return urls


def extract_business(page, search_for: str) -> Business:
    b = Business()
    page.wait_for_timeout(3000)

    try:
        b.name = clean_text(page.locator("h1").first.inner_text(timeout=10000))
    except Exception:
        pass

    try:
        addr_btn = page.locator('[data-item-id="address"]').first
        aria = addr_btn.get_attribute("aria-label")
        if aria:
            b.address = aria_value(aria, "Address:")
        else:
            b.address = clean_text(addr_btn.inner_text())
    except Exception:
        pass

    try:
        phone_btn = page.locator('[data-item-id^="phone"]').first
        aria = phone_btn.get_attribute("aria-label")
        if aria:
            b.phone_number = aria_value(aria, "Phone:")
        else:
            b.phone_number = clean_text(phone_btn.inner_text())
    except Exception:
        pass

    try:
        website = page.locator('[data-item-id="authority"]').first
        href = website.get_attribute("href")
        if href:
            b.website = href
        else:
            b.website = clean_text(website.inner_text())
    except Exception:
        pass

    if not b.website:
        try:
            link = page.locator('a[aria-label*="Website"], a[data-tooltip="Open website"]').first
            href = link.get_attribute("href")
            if href and "google.com" not in href:
                b.website = href
        except Exception:
            pass

    try:
        rating_el = page.locator('span[aria-label*="stars"]').first
        aria = rating_el.get_attribute("aria-label")
        if aria:
            match = re.search(r"([\d.]+)", aria)
            if match:
                b.reviews_average = float(match.group(1))
    except Exception:
        pass

    if b.reviews_average is None:
        try:
            rating_text = page.locator("div.F7nice").first.inner_text()
            match = re.search(r"([\d.]+)", rating_text)
            if match:
                b.reviews_average = float(match.group(1))
        except Exception:
            pass

    try:
        for el in page.locator("button, span").all():
            text = el.inner_text() or ""
            aria = el.get_attribute("aria-label") or ""
            combined = f"{text} {aria}"
            match = re.search(r"([\d,]+)\s+reviews?", combined, re.I)
            if match:
                b.reviews_count = int(match.group(1).replace(",", ""))
                break
    except Exception:
        pass

    lat, lng = extract_coordinates(page.url)
    b.latitude = lat
    b.longitude = lng

    b.category = search_for.split(" in ")[0] if " in " in search_for else search_for
    b.location = search_for.split(" in ")[-1] if " in " in search_for else ""

    return b


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-s", "--search", type=str, help="Search query, e.g. 'dentist in London'")
    parser.add_argument("-t", "--total", type=int, default=20, help="Number of businesses to scrape")
    parser.add_argument("-i", "--input", type=str, default="input.txt", help="File with one search per line")
    parser.add_argument("--headless", action="store_true", help="Run browser in headless mode")
    args = parser.parse_args()

    search_list = load_searches(args.search, args.input)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=args.headless)
        context = browser.new_context(
            viewport={"width": 1366, "height": 768},
            locale="en-US",
        )
        context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });"
        )
        page = context.new_page()
        page.set_default_timeout(60000)

        page.goto("https://www.google.com/maps", wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
        accept_cookies(page)

        for search_for in search_list:
            print(f"Searching: {search_for}")

            search_box = page.locator('input[name="q"]')
            search_box.wait_for(state="visible", timeout=30000)
            search_box.fill(search_for)
            page.keyboard.press("Enter")

            page.wait_for_selector('div[role="feed"]', timeout=30000)
            page.wait_for_timeout(2000)

            scroll_results(page, args.total)
            urls = collect_place_urls(page, args.total)
            print(f"Found {len(urls)} places")

            business_list = BusinessList()

            for idx, url in enumerate(urls, start=1):
                print(f"  [{idx}/{len(urls)}] Scraping place...")
                detail_page = context.new_page()
                try:
                    detail_page.goto(url, wait_until="domcontentloaded")
                    business = extract_business(detail_page, search_for)
                    business_list.add(business)
                    print(f"       -> {business.name or 'Unknown'}")
                except Exception as exc:
                    print(f"       -> failed: {exc}")
                finally:
                    detail_page.close()

            name_file = re.sub(r"[^\w\-]+", "_", search_for).strip("_")
            business_list.save(name_file)
            print(f"Saved {len(business_list.business_list)} businesses to '{business_list.save_at}/{name_file}.xlsx'")

        context.close()
        browser.close()


if __name__ == "__main__":
    main()
