Generated: 2026-06-10 13:32:37 UTC

## Overview

Stage 4 analyzes class imbalance on the training split, exports class weights, evaluates oversampling strategies, and generates augmented training samples. Validation and test splits are not modified.

## Original train distribution

### Before augmentation

| Class | Count |
| --- | ---: |
| NEV | 4864 |
| BCC | 951 |
| MEL | 815 |
| AKIEC | 740 |

## Imbalance analysis

- Max class count: **4864**
- Min class count: **740**
- Imbalance ratio (max/min): **6.573**

## Oversampling strategy evaluation

- **class_weighting:** Use exported inverse-frequency weights during training.
- **random_oversampling:** Duplicate minority-class samples until each class reaches the majority count.
- **augmentation_oversampling:** Generate synthetic variants for minority classes using the augmentation pipeline (implemented in this script).

## Class weights

- `NEV`: **0.3788**
- `MEL`: **2.2607**
- `BCC`: **1.9374**
- `AKIEC`: **2.4899**

## Augmentation operations

- Horizontal flip
- Vertical flip
- Rotation (+/- 20 degrees)
- Zoom / random scale
- Brightness adjustment
- Contrast adjustment
- Random resized crop (224x224)

## Augmented samples generated

- Total generated: **12086**
- `NEV`: **0**
- `MEL`: **4049**
- `BCC`: **3913**
- `AKIEC`: **4124**

## Distribution after balancing

### Augmented training set

| Class | Count |
| --- | ---: |
| AKIEC | 4864 |
| BCC | 4864 |
| MEL | 4864 |
| NEV | 4864 |

## Outputs

- `C:\Users\Dren\Desktop\merged_datasets\pipeline\stage4_augmentation\outputs\augmented_train.csv`
- `C:\Users\Dren\Desktop\merged_datasets\pipeline\stage4_augmentation\outputs\augmented_train_images`
- `C:\Users\Dren\Desktop\merged_datasets\pipeline\stage4_augmentation\outputs\class_weights.json`
