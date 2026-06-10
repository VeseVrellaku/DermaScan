from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from pipeline.config import LOWERCASE_TO_CANONICAL, TARGET_CLASSES
from pipeline.utils.reports import class_distribution


def find_repo_root(start: Path | None = None) -> Path:
    start = start or Path.cwd()
    for candidate in [start, *start.parents]:
        if (candidate / "merged_metadata.csv").exists():
            return candidate
    raise FileNotFoundError(
        "Could not locate repository root containing merged_metadata.csv"
    )


def image_exists(path_value) -> bool:
    if pd.isna(path_value) or str(path_value).strip() == "":
        return False
    return Path(str(path_value)).exists()


def canonicalize_diagnosis(value) -> str | float:
    if pd.isna(value):
        return np.nan
    text = str(value).strip()
    upper = text.upper()
    if upper in TARGET_CLASSES:
        return upper
    lower = text.lower()
    return LOWERCASE_TO_CANONICAL.get(lower, upper)


def standardize_bool(value):
    if pd.isna(value):
        return np.nan
    if isinstance(value, bool):
        return value
    text = str(value).strip().upper()
    if text in {"TRUE", "T", "1", "YES", "Y"}:
        return True
    if text in {"FALSE", "F", "0", "NO", "N"}:
        return False
    if text == "UNK":
        return np.nan
    return np.nan


def standardize_sex(row: pd.Series) -> str | float:
    raw = row.get("gender")
    if pd.isna(raw) or str(raw).strip() == "":
        raw = row.get("sex")
    if pd.isna(raw) or str(raw).strip() == "":
        return np.nan
    text = str(raw).strip().lower()
    if text in {"male", "m"}:
        return "male"
    if text in {"female", "f"}:
        return "female"
    return text


def standardize_localization(row: pd.Series) -> str | float:
    raw = row.get("region")
    if pd.isna(raw) or str(raw).strip() == "":
        raw = row.get("localization")
    if pd.isna(raw) or str(raw).strip() == "":
        return np.nan
    return str(raw).strip().lower().replace("_", " ")


def clean_metadata(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()
    result["sex"] = result.apply(standardize_sex, axis=1)
    result["localization_clean"] = result.apply(standardize_localization, axis=1)

    bool_cols = [
        "smoke",
        "drink",
        "pesticide",
        "skin_cancer_history",
        "cancer_history",
        "has_piped_water",
        "has_sewage_system",
        "itch",
        "grew",
        "hurt",
        "changed",
        "bleed",
        "elevation",
        "biopsed",
    ]
    for col in bool_cols:
        if col in result.columns:
            result[col] = result[col].map(standardize_bool)

    if "age" in result.columns:
        result["age"] = pd.to_numeric(result["age"], errors="coerce")
    if "fitspatrick" in result.columns:
        result["fitspatrick"] = pd.to_numeric(result["fitspatrick"], errors="coerce")
    if "diameter_1" in result.columns:
        result["diameter_1"] = pd.to_numeric(result["diameter_1"], errors="coerce")
    if "diameter_2" in result.columns:
        result["diameter_2"] = pd.to_numeric(result["diameter_2"], errors="coerce")

    return result


def remove_invalid_records(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    valid = df.copy()
    before = len(valid)
    if "age" in valid.columns:
        valid = valid[valid["age"].isna() | ((valid["age"] >= 0) & (valid["age"] <= 120))]
    if "fitspatrick" in valid.columns:
        valid = valid[
            valid["fitspatrick"].isna()
            | ((valid["fitspatrick"] >= 1) & (valid["fitspatrick"] <= 6))
        ]
    return valid.reset_index(drop=True), before - len(valid)


def run_cleaning(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    stats: dict = {"initial_count": len(df), "removed_by_reason": {}}

    working = df.copy()
    working["record_id"] = working.apply(
        lambda row: f"{row['source_dataset']}_{row.name:06d}", axis=1
    )

    missing_image_mask = ~working["image_path"].map(image_exists)
    stats["removed_by_reason"]["missing_image_file"] = int(missing_image_mask.sum())
    working = working[~missing_image_mask].copy()

    missing_diagnosis_mask = working["diagnosis"].isna() | (
        working["diagnosis"].astype(str).str.strip() == ""
    )
    stats["removed_by_reason"]["missing_diagnosis"] = int(missing_diagnosis_mask.sum())
    working = working[~missing_diagnosis_mask].copy()

    working["diagnosis"] = working["diagnosis"].map(canonicalize_diagnosis)
    non_target_mask = ~working["diagnosis"].isin(TARGET_CLASSES)
    stats["removed_by_reason"]["non_target_class"] = int(non_target_mask.sum())
    working = working[~non_target_mask].copy()

    working = clean_metadata(working)
    working, invalid_removed = remove_invalid_records(working)
    stats["removed_by_reason"]["invalid_metadata"] = invalid_removed

    stats["final_count"] = len(working)
    stats["final_class_distribution"] = class_distribution(working)
    return working.reset_index(drop=True), stats
