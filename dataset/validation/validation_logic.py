"""Stage 2 image validation logic used by image_validation.ipynb."""

from __future__ import annotations

from pathlib import Path

import pandas as pd
from PIL import Image, UnidentifiedImageError

from pipeline.config import IMAGE_SIZE, TARGET_CLASSES
from pipeline.utils.io import ensure_output_dir
from pipeline.utils.reports import class_distribution


def validate_and_process_image(source_path: Path, dest_path: Path) -> tuple[bool, str]:
    try:
        with Image.open(source_path) as img:
            img.load()
            rgb = img.convert("RGB")
            resized = rgb.resize(IMAGE_SIZE, Image.Resampling.LANCZOS)
            ensure_output_dir(dest_path.parent)
            resized.save(dest_path, format="JPEG", quality=95)
        return True, ""
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        return False, str(exc)


def run_image_validation(
    df: pd.DataFrame,
    processed_images_dir: Path,
) -> tuple[pd.DataFrame, dict]:
    stats = {
        "input_count": len(df),
        "corrupted_or_unreadable": 0,
        "converted_to_rgb": 0,
        "resized_to_224": 0,
        "errors": [],
    }
    kept_rows: list[dict] = []

    for _, row in df.iterrows():
        source_path = Path(str(row["image_path"]))
        diagnosis = str(row["diagnosis"])
        record_id = str(row["record_id"])
        dest_path = processed_images_dir / diagnosis / f"{record_id}.jpg"

        ok, error = validate_and_process_image(source_path, dest_path)
        if not ok:
            stats["corrupted_or_unreadable"] += 1
            stats["errors"].append({"record_id": record_id, "error": error})
            continue

        stats["converted_to_rgb"] += 1
        stats["resized_to_224"] += 1
        row_dict = row.to_dict()
        row_dict["processed_image_path"] = str(dest_path)
        row_dict["image_valid"] = True
        kept_rows.append(row_dict)

    result = pd.DataFrame(kept_rows)
    stats["output_count"] = len(result)
    stats["final_class_distribution"] = class_distribution(result) if len(result) else {}
    stats["output_structure"] = {
        label: str(processed_images_dir / label) for label in TARGET_CLASSES
    }
    return result.reset_index(drop=True), stats
