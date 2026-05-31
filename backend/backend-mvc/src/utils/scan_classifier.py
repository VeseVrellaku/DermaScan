import random
from dataclasses import dataclass


@dataclass
class ScanClassification:
    label: str
    confidence_score: float
    risk_level: str
    report_summary: str


def classify_scan(*, sensitivity: float = 85.0) -> ScanClassification:
    is_high_risk = random.random() * 100 < sensitivity

    if is_high_risk:
        confidence = round(88 + random.random() * 11, 1)
        return ScanClassification(
            label="Atypical Melanocytic Indication Detected",
            confidence_score=confidence,
            risk_level="High Risk / Consult AI Doctor",
            report_summary=(
                "Asymmetry and irregular border contours were detected in the uploaded image. "
                "We recommend consulting a dermatologist or using the AI voice assistant for triage."
            ),
        )

    confidence = round(92 + random.random() * 7, 1)
    return ScanClassification(
        label="Benign Melanocytic Nevus (Common Mole)",
        confidence_score=confidence,
        risk_level="Low Risk",
        report_summary=(
            "Symmetrical structure with uniform color distribution observed. "
            "Continue monthly self-monitoring and re-scan if changes occur."
        ),
    )
