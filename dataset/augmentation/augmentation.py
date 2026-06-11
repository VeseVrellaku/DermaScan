#!/usr/bin/env python3
"""
Stage 4 — Augmentation & class balancing (Person 4).

Analyzes training-set imbalance, computes class weights, evaluates oversampling
options, and generates augmented training samples with Albumentations.

Augmentation is applied to the training split only.

Prerequisite: Stage 3 outputs must exist.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

import albumentations as A
import numpy as np
import pandas as pd
from PIL import Image
from sklearn.utils.class_weight import compute_class_weight
from tqdm import tqdm

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from pipeline.config import (  # noqa: E402
    AUGMENTATION_RANDOM_SEED,
    AUGMENTED_IMAGES_DIR,
    AUGMENTED_TRAIN_CSV,
    AUGMENTATION_REPORT_MD,
    CANONICAL_TO_LABEL_CODE,
    RANDOM_SEED,
    STAGE4_OUTPUT_DIR,
    TARGET_CLASSES,
    TRAIN_CSV,
)
from pipeline.utils.io import ensure_output_dir, load_csv, save_csv  # noqa: E402
from pipeline.utils.reports import (  # noqa: E402
    class_distribution,
    distribution_markdown,
    write_markdown_report,
)


def build_train_augmentation_pipeline() -> A.Compose:
    return A.Compose(
        [
            A.HorizontalFlip(p=0.5),
            A.VerticalFlip(p=0.2),
            A.Rotate(limit=20, p=0.5),
            A.RandomScale(scale_limit=0.15, p=0.5),
            A.RandomBrightnessContrast(
                brightness_limit=0.2,
                contrast_limit=0.2,
                p=0.5,
            ),
            A.RandomResizedCrop(
                size=(224, 224),
                scale=(0.85, 1.0),
                ratio=(0.95, 1.05),
                p=0.3,
            ),
        ],
        seed=AUGMENTATION_RANDOM_SEED,
    )


def compute_weights(train_df: pd.DataFrame) -> dict[str, float]:
    classes = TARGET_CLASSES
    codes = train_df["label_code"].to_numpy()
    weights = compute_class_weight(
        class_weight="balanced",
        classes=np.array(sorted(set(codes))),
        y=codes,
    )
    code_to_weight = {
        int(code): float(weight) for code, weight in zip(sorted(set(codes)), weights)
    }
    return {
        label: code_to_weight[CANONICAL_TO_LABEL_CODE[label]] for label in TARGET_CLASSES
    }


def evaluate_oversampling(train_df: pd.DataFrame) -> dict[str, dict[str, float | int]]:
    counts = class_distribution(train_df)
    max_count = max(counts[label] for label in TARGET_CLASSES if label in counts)
    min_count = min(counts[label] for label in TARGET_CLASSES if label in counts)
    return {
        "original_counts": counts,
        "max_class_count": max_count,
        "min_class_count": min_count,
        "imbalance_ratio_max_over_min": round(max_count / min_count, 3) if min_count else 0,
        "recommended_target_per_class_for_full_balance": max_count,
        "strategies": {
            "class_weighting": "Use exported inverse-frequency weights during training.",
            "random_oversampling": (
                "Duplicate minority-class samples until each class reaches the "
                "majority count."
            ),
            "augmentation_oversampling": (
                "Generate synthetic variants for minority classes using the "
                "augmentation pipeline (implemented in this script)."
            ),
        },
    }


def augment_training_data(
    train_df: pd.DataFrame,
    output_images_dir: Path,
    target_per_class: int | None = None,
) -> tuple[pd.DataFrame, dict[str, int]]:
    ensure_output_dir(output_images_dir)
    transform = build_train_augmentation_pipeline()
    rng = np.random.default_rng(AUGMENTATION_RANDOM_SEED)

    rows: list[dict] = []
    generated_by_class: Counter[str] = Counter()

    for _, row in train_df.iterrows():
        rows.append(row.to_dict())

    counts = class_distribution(train_df)
    if target_per_class is None:
        target_per_class = max(counts[label] for label in TARGET_CLASSES)

    for label in TARGET_CLASSES:
        class_rows = train_df[train_df["diagnosis"] == label]
        current = len(class_rows)
        needed = max(0, target_per_class - current)

        if needed == 0:
            continue

        source_rows = class_rows.sample(
            n=needed,
            replace=True,
            random_state=RANDOM_SEED + CANONICAL_TO_LABEL_CODE[label],
        )

        for aug_idx, (_, source_row) in enumerate(
            tqdm(source_rows.iterrows(), total=needed, desc=f"Augment {label}")
        ):
            image_path = Path(str(source_row["processed_image_path"]))
            image = np.array(Image.open(image_path).convert("RGB"))
            augmented = transform(image=image)["image"]
            aug_name = f"{source_row['record_id']}_aug_{aug_idx:04d}.jpg"
            save_path = output_images_dir / label / aug_name
            ensure_output_dir(save_path.parent)
            Image.fromarray(augmented).save(save_path, format="JPEG", quality=95)

            new_row = source_row.to_dict()
            new_row["record_id"] = f"{source_row['record_id']}_aug_{aug_idx:04d}"
            new_row["processed_image_path"] = str(save_path)
            new_row["is_augmented"] = True
            new_row["augmentation_source_record_id"] = source_row["record_id"]
            rows.append(new_row)
            generated_by_class[label] += 1

    result = pd.DataFrame(rows)
    if "is_augmented" not in result.columns:
        result["is_augmented"] = False
    else:
        result["is_augmented"] = result["is_augmented"].fillna(False)
    return result, dict(generated_by_class)


def build_report(
    train_df: pd.DataFrame,
    augmented_df: pd.DataFrame,
    class_weights: dict[str, float],
    oversampling_eval: dict,
    generated_by_class: dict[str, int],
) -> None:
    after_counts = class_distribution(augmented_df)
    sections = {
        "Overview": (
            "Stage 4 analyzes class imbalance on the training split, exports class "
            "weights, evaluates oversampling strategies, and generates augmented "
            "training samples. Validation and test splits are not modified."
        ),
        "Original train distribution": distribution_markdown(
            class_distribution(train_df), title="Before augmentation"
        ),
        "Imbalance analysis": "\n".join(
            [
                f"- Max class count: **{oversampling_eval['max_class_count']}**",
                f"- Min class count: **{oversampling_eval['min_class_count']}**",
                "- Imbalance ratio (max/min): "
                f"**{oversampling_eval['imbalance_ratio_max_over_min']}**",
            ]
        ),
        "Oversampling strategy evaluation": "\n".join(
            f"- **{name}:** {details}"
            for name, details in oversampling_eval["strategies"].items()
        ),
        "Class weights": "\n".join(
            f"- `{label}`: **{weight:.4f}**" for label, weight in class_weights.items()
        ),
        "Augmentation operations": "\n".join(
            [
                "- Horizontal flip",
                "- Vertical flip",
                "- Rotation (+/- 20 degrees)",
                "- Zoom / random scale",
                "- Brightness adjustment",
                "- Contrast adjustment",
                "- Random resized crop (224x224)",
            ]
        ),
        "Augmented samples generated": "\n".join(
            [
                f"- Total generated: **{sum(generated_by_class.values())}**",
                *[
                    f"- `{label}`: **{generated_by_class.get(label, 0)}**"
                    for label in TARGET_CLASSES
                ],
            ]
        ),
        "Distribution after balancing": distribution_markdown(
            after_counts, title="Augmented training set"
        ),
        "Outputs": "\n".join(
            [
                f"- `{AUGMENTED_TRAIN_CSV}`",
                f"- `{AUGMENTED_IMAGES_DIR}`",
                f"- `{STAGE4_OUTPUT_DIR / 'class_weights.json'}`",
            ]
        ),
    }
    write_markdown_report(AUGMENTATION_REPORT_MD, sections)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Stage 4 augmentation pipeline")
    parser.add_argument(
        "--train-csv",
        type=Path,
        default=TRAIN_CSV,
        help="Training split CSV from Stage 3",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=STAGE4_OUTPUT_DIR,
        help="Directory for Stage 4 outputs",
    )
    parser.add_argument(
        "--target-per-class",
        type=int,
        default=None,
        help="Target samples per class after augmentation (default: majority count)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    ensure_output_dir(args.output_dir)

    print(f"Loading training split: {args.train_csv}")
    train_df = load_csv(args.train_csv)

    class_weights = compute_weights(train_df)
    oversampling_eval = evaluate_oversampling(train_df)

    weights_path = args.output_dir / "class_weights.json"
    weights_path.write_text(
        json.dumps(
            {
                "random_seed": AUGMENTATION_RANDOM_SEED,
                "class_weights_by_diagnosis": class_weights,
                "class_weights_by_label_code": {
                    str(CANONICAL_TO_LABEL_CODE[label]): weight
                    for label, weight in class_weights.items()
                },
                "oversampling_evaluation": oversampling_eval,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    augmented_df, generated_by_class = augment_training_data(
        train_df,
        args.output_dir / AUGMENTED_IMAGES_DIR.name,
        target_per_class=args.target_per_class,
    )
    save_csv(augmented_df, args.output_dir / AUGMENTED_TRAIN_CSV.name)
    build_report(
        train_df,
        augmented_df,
        class_weights,
        oversampling_eval,
        generated_by_class,
    )

    print(f"Wrote augmented train CSV: {args.output_dir / AUGMENTED_TRAIN_CSV.name}")
    print(f"Wrote class weights: {weights_path}")
    print(f"Wrote report: {args.output_dir / AUGMENTATION_REPORT_MD.name}")


if __name__ == "__main__":
    main()
