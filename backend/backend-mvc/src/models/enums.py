import enum


class ScanStatus(str, enum.Enum):
    PENDING = "Pending"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


# class PredictionClass(str, enum.Enum):
#     MELANOMA = "Melanoma"
#     BENIGN = "Benign"
