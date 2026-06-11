from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from pipeline.config import (  # noqa: E402
    CANONICAL_TO_LABEL_CODE,
    LABEL_MAPPING_JSON,
    NORMALIZATION_MEAN,
    NORMALIZATION_STATS_JSON,
    NORMALIZATION_STD,
    NORMALIZE_TO_UNIT_INTERVAL,
    PREPROCESSING_REPORT_MD,
    RANDOM_SEED,
    STAGE3_OUTPUT_DIR,
    TARGET_CLASSES,
    TEST_CSV,
    TEST_SPLIT,
    TRAIN_CSV,
    TRAIN_SPLIT,
    VALIDATED_DATASET_CSV,
    VALIDATION_CSV,
    VAL_SPLIT,
)
from pipeline.utils.io import ensure_output_dir, load_csv, save_csv  # noqa: E402
from pipeline.utils.reports import (  # noqa: E402
    class_distribution,
    distribution_markdown,
    write_markdown_report,
)


def encode_labels(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()
    unknown = sorted(set(result["diagnosis"].dropna()) - set(TARGET_CLASSES))
    if unknown:
        raise ValueError(
            "Unexpected diagnosis labels found. Stage 1 should have filtered to "
            f"{TARGET_CLASSES}. Found: {unknown}"
        )
    result["label_code"] = result["diagnosis"].map(CANONICAL_TO_LABEL_CODE)
    if result["label_code"].isna().any():
        missing = result[result["label_code"].isna()]["diagnosis"].tolist()
        raise ValueError(f"Failed to encode labels for rows: {missing[:5]}")
    result["label_code"] = result["label_code"].astype(int)
    return result


def create_splits(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    train_df, temp_df = train_test_split(
        df,
        test_size=(1.0 - TRAIN_SPLIT),
        random_state=RANDOM_SEED,
        stratify=df["diagnosis"],
    )
    relative_val_size = VAL_SPLIT / (VAL_SPLIT + TEST_SPLIT)
    val_df, test_df = train_test_split(
        temp_df,
        test_size=(1.0 - relative_val_size),
        random_state=RANDOM_SEED,
        stratify=temp_df["diagnosis"],
    )
    train_df = train_df.copy()
    val_df = val_df.copy()
    test_df = test_df.copy()
    train_df["split"] = "train"
    val_df["split"] = "validation"
    test_df["split"] = "test"
    return train_df, val_df, test_df


def export_label_mapping(path: Path) -> None:
    payload = {
        "random_seed": RANDOM_SEED,
        "target_classes": TARGET_CLASSES,
        "diagnosis_to_label_code": CANONICAL_TO_LABEL_CODE,
        "label_code_to_diagnosis": {
            str(code): label for label, code in CANONICAL_TO_LABEL_CODE.items()
        },
    }
    ensure_output_dir(path.parent)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def export_normalization_stats(path: Path) -> None:
    payload = {
        "normalize_to_unit_interval": NORMALIZE_TO_UNIT_INTERVAL,
        "mean": NORMALIZATION_MEAN,
        "std": NORMALIZATION_STD,
        "formula": "((pixel / 255.0) - mean) / std per RGB channel",
        "note": (
            "Apply normalization at training/inference time using these statistics. "
            "Stage 2 stores uint8 JPEG images on disk."
        ),
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def build_report(
    df: pd.DataFrame,
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    test_df: pd.DataFrame,
) -> None:
    sections = {
        "Overview": (
            "Stage 3 encodes diagnosis labels and creates stratified train/validation/test "
            f"splits using random seed `{RANDOM_SEED}`."
        ),
        "Input": f"- Rows loaded: **{len(df)}**\n- Source: `{VALIDATED_DATASET_CSV}`",
        "Label encoding": "\n".join(
            f"- `{label}` -> `{CANONICAL_TO_LABEL_CODE[label]}`"
            for label in TARGET_CLASSES
        ),
        "Split sizes": "\n".join(
            [
                f"- Train: **{len(train_df)}** ({TRAIN_SPLIT:.0%})",
                f"- Validation: **{len(val_df)}** ({VAL_SPLIT:.0%})",
                f"- Test: **{len(test_df)}** ({TEST_SPLIT:.0%})",
            ]
        ),
        "Train class distribution": distribution_markdown(
            class_distribution(train_df), title="Train"
        ),
        "Validation class distribution": distribution_markdown(
            class_distribution(val_df), title="Validation"
        ),
        "Test class distribution": distribution_markdown(
            class_distribution(test_df), title="Test"
        ),
        "Normalization": (
            "Pixel normalization parameters exported to "
            f"`{NORMALIZATION_STATS_JSON.name}`.\n\n"
            f"- Scale to [0, 1]: `{NORMALIZE_TO_UNIT_INTERVAL}`\n"
            f"- Mean: `{NORMALIZATION_MEAN}`\n"
            f"- Std: `{NORMALIZATION_STD}`"
        ),
        "Outputs": "\n".join(
            [
                f"- `{TRAIN_CSV}`",
                f"- `{VALIDATION_CSV}`",
                f"- `{TEST_CSV}`",
                f"- `{LABEL_MAPPING_JSON}`",
                f"- `{NORMALIZATION_STATS_JSON}`",
            ]
        ),
    }
    write_markdown_report(PREPROCESSING_REPORT_MD, sections)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Stage 3 preprocessing pipeline")
    parser.add_argument(
        "--input-csv",
        type=Path,
        default=VALIDATED_DATASET_CSV,
        help="Validated dataset CSV from Stage 2",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=STAGE3_OUTPUT_DIR,
        help="Directory for Stage 3 outputs",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    ensure_output_dir(args.output_dir)

    print(f"Loading validated dataset: {args.input_csv}")
    df = load_csv(args.input_csv)
    if "processed_image_path" not in df.columns:
        raise ValueError("Expected column `processed_image_path` from Stage 2.")

    df = encode_labels(df)
    train_df, val_df, test_df = create_splits(df)

    save_csv(train_df, args.output_dir / TRAIN_CSV.name)
    save_csv(val_df, args.output_dir / VALIDATION_CSV.name)
    save_csv(test_df, args.output_dir / TEST_CSV.name)
    export_label_mapping(args.output_dir / LABEL_MAPPING_JSON.name)
    export_normalization_stats(args.output_dir / NORMALIZATION_STATS_JSON.name)
    build_report(df, train_df, val_df, test_df)

    print(f"Wrote train split: {args.output_dir / TRAIN_CSV.name} ({len(train_df)} rows)")
    print(f"Wrote validation split: {args.output_dir / VALIDATION_CSV.name} ({len(val_df)} rows)")
    print(f"Wrote test split: {args.output_dir / TEST_CSV.name} ({len(test_df)} rows)")
    print(f"Wrote report: {args.output_dir / PREPROCESSING_REPORT_MD.name}")


if __name__ == "__main__":
    main()
