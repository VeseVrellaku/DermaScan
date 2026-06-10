from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd

FOUR_CLASS_MAPPING = {
    "dataset_a": {
        "BCC": "bcc",
        "NEV": "nv",
        "ACK": "akiec",
        "SEK": "bkl",
    },
    "dataset_b": {
        "bcc": "bcc",
        "nv": "nv",
        "akiec": "akiec",
        "bkl": "bkl",
    },
}

EXTRA_LABEL_MAPPING = {
    "dataset_a": {
        "SCC": "scc",
        "MEL": "mel",
    },
    "dataset_b": {
        "mel": "mel",
        "vasc": "vasc",
        "df": "df",
    },
}

DATASET_A_NAME = "dataset_a"
DATASET_B_NAME = "dataset_b"


def build_label_map(source: str) -> dict[str, str]:
    mapping = {}
    mapping.update(FOUR_CLASS_MAPPING[source])
    mapping.update(EXTRA_LABEL_MAPPING.get(source, {}))
    return mapping


def standardize_label(raw_label, label_map: dict[str, str]) -> str | float:
    if pd.isna(raw_label):
        return raw_label
    key = str(raw_label).strip()
    if key in label_map:
        return label_map[key]
    return key.lower()


def build_image_path_a(row: pd.Series, image_root: Path) -> str:
    diagnostic = row["diagnostic"]
    img_id = row["img_id"]
    if pd.isna(diagnostic) or pd.isna(img_id):
        return ""
    return str(image_root / str(diagnostic) / str(img_id)).replace("\\", "/")


def build_image_path_b(row: pd.Series, image_root: Path) -> str:
    dx = row["dx"]
    image_id = row["image_id"]
    if pd.isna(dx) or pd.isna(image_id):
        return ""
    return str(image_root / str(dx) / f"{image_id}.jpg").replace("\\", "/")


def distribution(series: pd.Series) -> dict[str, int]:
    counts = series.value_counts(dropna=False)
    result: dict[str, int] = {}
    for label, count in counts.items():
        key = "<missing>" if pd.isna(label) else str(label)
        result[key] = int(count)
    return dict(sorted(result.items(), key=lambda item: (-item[1], item[0])))


def load_dataset_a(csv_path: Path, image_root: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    label_map = build_label_map(DATASET_A_NAME)

    df["source_dataset"] = DATASET_A_NAME
    df["diagnosis"] = df["diagnostic"].map(
        lambda value: standardize_label(value, label_map)
    )
    df["image_path"] = df.apply(
        lambda row: build_image_path_a(row, image_root), axis=1
    )
    return df


def load_dataset_b(csv_path: Path, image_root: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    label_map = build_label_map(DATASET_B_NAME)

    df["source_dataset"] = DATASET_B_NAME
    df["diagnosis"] = df["dx"].map(lambda value: standardize_label(value, label_map))
    df["image_path"] = df.apply(
        lambda row: build_image_path_b(row, image_root), axis=1
    )
    return df


def merge_metadata(df_a: pd.DataFrame, df_b: pd.DataFrame) -> pd.DataFrame:
    merged = pd.concat([df_a, df_b], ignore_index=True, sort=False)

    front_columns = ["source_dataset", "diagnosis", "image_path"]
    other_columns = [col for col in merged.columns if col not in front_columns]
    return merged[front_columns + other_columns]


def build_summary(
    df_a: pd.DataFrame,
    df_b: pd.DataFrame,
    merged: pd.DataFrame,
    output_csv: Path,
) -> dict:
    four_class_a = FOUR_CLASS_MAPPING[DATASET_A_NAME]
    four_class_b = FOUR_CLASS_MAPPING[DATASET_B_NAME]

    summary = {
        "output_csv": str(output_csv),
        "sample_counts": {
            DATASET_A_NAME: int(len(df_a)),
            DATASET_B_NAME: int(len(df_b)),
            "merged_total": int(len(merged)),
        },
        "class_distribution_before_merge": {
            DATASET_A_NAME: {
                "column": "diagnostic",
                "counts": distribution(df_a["diagnostic"]),
            },
            DATASET_B_NAME: {
                "column": "dx",
                "counts": distribution(df_b["dx"]),
            },
        },
        "class_distribution_after_merge": {
            "column": "diagnosis",
            "counts": distribution(merged["diagnosis"]),
        },
        "class_label_mappings_applied": {
            "four_equivalent_classes": {
                "unified_label_scheme": "HAM10000-style lowercase codes",
                DATASET_A_NAME: {
                    "source_column": "diagnostic",
                    "mapping": four_class_a,
                },
                DATASET_B_NAME: {
                    "source_column": "dx",
                    "mapping": four_class_b,
                },
            },
            "additional_labels_standardized": {
                DATASET_A_NAME: EXTRA_LABEL_MAPPING.get(DATASET_A_NAME, {}),
                DATASET_B_NAME: EXTRA_LABEL_MAPPING.get(DATASET_B_NAME, {}),
            },
        },
        "image_roots": {
            DATASET_A_NAME: "organized_by_diagnostic",
            DATASET_B_NAME: "organized_by_dx",
        },
        "notes": [
            "All CSV rows are kept, including rows with missing labels or missing image files.",
            "Original label columns (diagnostic, dx) are preserved alongside diagnosis.",
            "No deduplication, filtering, or metadata cleaning was applied.",
        ],
    }
    return summary


def format_summary_text(summary: dict) -> str:
    lines: list[str] = []
    lines.append("=" * 72)
    lines.append("MERGED SKIN LESION DATASET SUMMARY")
    lines.append("=" * 72)
    lines.append("")
    lines.append(f"Output CSV: {summary['output_csv']}")
    lines.append("")

    lines.append("Sample counts")
    lines.append("-" * 72)
    for key, value in summary["sample_counts"].items():
        lines.append(f"  {key}: {value}")
    lines.append("")

    lines.append("Class distribution before merging")
    lines.append("-" * 72)
    for dataset_name, info in summary["class_distribution_before_merge"].items():
        lines.append(f"  {dataset_name} ({info['column']}):")
        for label, count in info["counts"].items():
            lines.append(f"    {label}: {count}")
        lines.append("")

    lines.append("Class distribution after merging")
    lines.append("-" * 72)
    merged_info = summary["class_distribution_after_merge"]
    lines.append(f"  unified column: {merged_info['column']}")
    for label, count in merged_info["counts"].items():
        lines.append(f"    {label}: {count}")
    lines.append("")

    lines.append("Class-label mappings applied")
    lines.append("-" * 72)
    four_classes = summary["class_label_mappings_applied"]["four_equivalent_classes"]
    lines.append(f"  Unified scheme: {four_classes['unified_label_scheme']}")
    lines.append("  Four equivalent classes:")
    for dataset_name in (DATASET_A_NAME, DATASET_B_NAME):
        info = four_classes[dataset_name]
        lines.append(f"    {dataset_name} ({info['source_column']}):")
        for source_label, unified_label in info["mapping"].items():
            lines.append(f"      {source_label} -> {unified_label}")

    extra = summary["class_label_mappings_applied"]["additional_labels_standardized"]
    lines.append("  Additional labels standardized:")
    for dataset_name, mapping in extra.items():
        if not mapping:
            continue
        lines.append(f"    {dataset_name}:")
        for source_label, unified_label in mapping.items():
            lines.append(f"      {source_label} -> {unified_label}")
    lines.append("")

    lines.append("Image folder references")
    lines.append("-" * 72)
    for dataset_name, folder in summary["image_roots"].items():
        lines.append(f"  {dataset_name}: {folder}/")
    lines.append("")

    lines.append("Notes")
    lines.append("-" * 72)
    for note in summary["notes"]:
        lines.append(f"  - {note}")
    lines.append("")
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    script_dir = Path(__file__).resolve().parent
    default_root = script_dir.parent

    parser = argparse.ArgumentParser(
        description="Merge two skin lesion dataset CSV files into one metadata file."
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=default_root,
        help="Workspace root containing both datasets (default: parent of scripts/)",
    )
    parser.add_argument(
        "--dataset-a-csv",
        type=Path,
        default=None,
        help="Dataset A metadata CSV (default: <root>/metadata.csv)",
    )
    parser.add_argument(
        "--dataset-b-csv",
        type=Path,
        default=None,
        help="Dataset B metadata CSV (default: <root>/HAM10000_metadata.csv)",
    )
    parser.add_argument(
        "--dataset-a-images",
        type=Path,
        default=None,
        help="Dataset A image root (default: <root>/organized_by_diagnostic)",
    )
    parser.add_argument(
        "--dataset-b-images",
        type=Path,
        default=None,
        help="Dataset B image root (default: <root>/organized_by_dx)",
    )
    parser.add_argument(
        "--output-csv",
        type=Path,
        default=None,
        help="Merged metadata output CSV (default: <root>/merged_metadata.csv)",
    )
    parser.add_argument(
        "--summary-json",
        type=Path,
        default=None,
        help="Summary JSON output (default: <root>/merge_summary.json)",
    )
    parser.add_argument(
        "--summary-txt",
        type=Path,
        default=None,
        help="Summary text output (default: <root>/merge_summary.txt)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = args.root.resolve()

    dataset_a_csv = (args.dataset_a_csv or root / "metadata.csv").resolve()
    dataset_b_csv = (args.dataset_b_csv or root / "HAM10000_metadata.csv").resolve()
    dataset_a_images = (
        args.dataset_a_images or root / "organized_by_diagnostic"
    ).resolve()
    dataset_b_images = (args.dataset_b_images or root / "organized_by_dx").resolve()
    output_csv = (args.output_csv or root / "merged_metadata.csv").resolve()
    summary_json = (args.summary_json or root / "merge_summary.json").resolve()
    summary_txt = (args.summary_txt or root / "merge_summary.txt").resolve()

    for path, label in [
        (dataset_a_csv, "Dataset A CSV"),
        (dataset_b_csv, "Dataset B CSV"),
        (dataset_a_images, "Dataset A image root"),
        (dataset_b_images, "Dataset B image root"),
    ]:
        if not path.exists():
            raise FileNotFoundError(f"{label} not found: {path}")

    print(f"Loading dataset A from: {dataset_a_csv}")
    df_a = load_dataset_a(dataset_a_csv, dataset_a_images)
    print(f"  rows: {len(df_a)}")

    print(f"Loading dataset B from: {dataset_b_csv}")
    df_b = load_dataset_b(dataset_b_csv, dataset_b_images)
    print(f"  rows: {len(df_b)}")

    merged = merge_metadata(df_a, df_b)
    merged.to_csv(output_csv, index=False)
    print(f"Wrote merged metadata: {output_csv}")
    print(f"  total rows: {len(merged)}")

    summary = build_summary(df_a, df_b, merged, output_csv)
    summary_json.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    summary_txt.write_text(format_summary_text(summary), encoding="utf-8")

    print(f"Wrote summary JSON: {summary_json}")
    print(f"Wrote summary text: {summary_txt}")
    print("")
    print(format_summary_text(summary))


if __name__ == "__main__":
    main()
