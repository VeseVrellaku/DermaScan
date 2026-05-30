# Predictions disabled — not run at this stage.
#
# from datetime import datetime
# from uuid import UUID
#
# from pydantic import BaseModel, ConfigDict
#
# from src.models.enums import ScanStatus
#
#
# class PredictionResponse(BaseModel):
#     model_config = ConfigDict(from_attributes=True)
#
#     id: UUID
#     scan_image_id: UUID
#     image_url: str
#     predicted_class: str
#     confidence_score: float
#     processing_date: datetime
#     model_version: str
#     status: ScanStatus
#     probabilities: dict | None = None
