from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.models.enums import ScanStatus


class CreateScanRequest(BaseModel):
    notes: str | None = Field(default=None, max_length=2000)


class PredictionSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    predicted_class: str
    confidence_score: float
    model_version: str
    processing_date: datetime
    status: ScanStatus


class ScanImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    original_filename: str
    image_url: str
    mime_type: str
    file_size_bytes: int
    uploaded_at: datetime
    prediction: PredictionSummaryResponse | None = None


class ScanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    scan_date: datetime
    notes: str | None
    status: ScanStatus
    created_at: datetime
    updated_at: datetime
    images: list[ScanImageResponse] = Field(default_factory=list)
    image_count: int = 0


class ScanListResponse(BaseModel):
    items: list[ScanResponse]
    total: int
    page: int
    page_size: int
