import argparse
import os
import re
import sys
from pathlib import Path

import pandas as pd

DEFAULT_DIR = "clinic_dataset"
DEFAULT_OUTPUT = "merged.csv"
DUPLICATES_OUTPUT = "duplicates.csv"
SKIP_NAMES = {DEFAULT_OUTPUT, "merged.xlsx", DUPLICATES_OUTPUT, "merged_deduplicated.csv"}


def normalize_text(value) -> str:
    if pd.isna(value):
        return ""
    return " ".join(str(value).split()).strip()


def normalize_phone(value) -> str:
    text = normalize_text(value)
    return re.sub(r"\D", "", text)


def dedup_key(row: pd.Series) -> tuple[str, str, str]:
    return (
        normalize_text(row.get("name")).casefold(),
        normalize_text(row.get("address")).casefold(),
        normalize_phone(row.get("phone_number")),
    )


def load_dataset_files(input_dir: Path) -> list[Path]:
    by_stem: dict[str, Path] = {}
    for path in sorted(input_dir.iterdir()):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".csv", ".xlsx", ".xls"}:
            continue
        if path.name in SKIP_NAMES:
            continue

        stem = path.stem
        existing = by_stem.get(stem)
        if existing is None:
            by_stem[stem] = path
            continue

        # Prefer CSV when both CSV and XLSX exist for the same scrape output.
        if existing.suffix.lower() != ".csv" and path.suffix.lower() == ".csv":
            by_stem[stem] = path

    return sorted(by_stem.values())


def read_dataset_file(path: Path) -> pd.DataFrame:
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path)
    return pd.read_excel(path)


def merge_datasets(input_dir: Path) -> pd.DataFrame:
    files = load_dataset_files(input_dir)
    if not files:
        print(f"No dataset files found in '{input_dir}'.")
        sys.exit(1)

    frames = []
    for path in files:
        df = read_dataset_file(path)
        df = df.copy()
        df["source_file"] = path.name
        frames.append(df)
        print(f"Loaded {len(df):4d} rows from {path.name}")

    merged = pd.concat(frames, ignore_index=True, sort=False)
    return merged


def find_duplicates(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    working = df.copy()
    working["_dedup_key"] = working.apply(dedup_key, axis=1)

    duplicate_mask = working.duplicated(subset="_dedup_key", keep=False)
    duplicates = working.loc[duplicate_mask].sort_values(
        by=["name", "address", "phone_number", "source_file"],
        na_position="last",
    )

    deduplicated = working.drop_duplicates(subset="_dedup_key", keep="first").drop(
        columns="_dedup_key"
    )
    duplicates = duplicates.drop(columns="_dedup_key")
    return deduplicated, duplicates


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Merge clinic dataset files and report duplicates."
    )
    parser.add_argument(
        "-d",
        "--dir",
        type=str,
        default=DEFAULT_DIR,
        help="Directory containing CSV/XLSX dataset files",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        default=DEFAULT_OUTPUT,
        help="Output filename for the deduplicated merged dataset",
    )
    parser.add_argument(
        "--keep-duplicates",
        action="store_true",
        help="Also save all rows (including duplicates) to merged_all.csv",
    )
    args = parser.parse_args()

    input_dir = Path(args.dir)
    if not input_dir.is_dir():
        print(f"Directory not found: '{input_dir}'")
        sys.exit(1)

    merged = merge_datasets(input_dir)
    deduplicated, duplicates = find_duplicates(merged)

    output_path = input_dir / args.output
    deduplicated.to_csv(output_path, index=False)
    deduplicated.to_excel(output_path.with_suffix(".xlsx"), index=False)

    duplicates_path = input_dir / DUPLICATES_OUTPUT
    duplicates.to_csv(duplicates_path, index=False)

    if args.keep_duplicates:
        all_path = input_dir / "merged_all.csv"
        merged.to_csv(all_path, index=False)

    duplicate_groups = 0
    if not duplicates.empty:
        duplicate_groups = duplicates.groupby(
            duplicates.apply(dedup_key, axis=1), sort=False
        ).ngroups

    print()
    print(f"Total rows loaded:     {len(merged)}")
    print(f"Unique rows:           {len(deduplicated)}")
    print(f"Duplicate rows removed:{len(merged) - len(deduplicated)}")
    print(f"Duplicate groups:      {duplicate_groups}")
    print(f"Saved merged dataset:  {output_path}")
    print(f"Saved duplicate rows:  {duplicates_path}")


if __name__ == "__main__":
    main()
