import enum


class ScanStatus(str, enum.Enum):
    PENDING = "Pending"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"


class PredictionClass(str, enum.Enum):
    MELANOMA = "Melanoma"
    BENIGN = "Benign"
