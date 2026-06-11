## Overview

Stage 3 encodes diagnosis labels and creates stratified train/validation/test splits using random seed `42`.

## Input

- Rows loaded: **10530**
- Source: `C:\Users\Dren\Desktop\merged_datasets\pipeline\stage2_validation\outputs\validated_dataset.csv`

## Label encoding

- `NEV` -> `0`
- `MEL` -> `1`
- `BCC` -> `2`
- `AKIEC` -> `3`

## Split sizes

- Train: **7370** (70%)
- Validation: **1580** (15%)
- Test: **1580** (15%)

## Train class distribution

### Train

| Class | Count |
| --- | ---: |
| NEV | 4864 |
| BCC | 951 |
| MEL | 815 |
| AKIEC | 740 |

## Validation class distribution

### Validation

| Class | Count |
| --- | ---: |
| NEV | 1043 |
| BCC | 204 |
| MEL | 175 |
| AKIEC | 158 |

## Test class distribution

### Test

| Class | Count |
| --- | ---: |
| NEV | 1042 |
| BCC | 204 |
| MEL | 175 |
| AKIEC | 159 |

## Normalization

Pixel normalization parameters exported to `normalization_stats.json`.

- Scale to [0, 1]: `True`
- Mean: `[0.485, 0.456, 0.406]`
- Std: `[0.229, 0.224, 0.225]`

## Outputs

- `\train.csv`
- `\validation.csv`
- `\test.csv`
- `\label_mapping.json`
- `\normalization_stats.json`
