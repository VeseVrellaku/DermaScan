from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from src.models.enums import ScanStatus
from src.schemas.scan import ScanResponse


class DashboardOverviewResponse(BaseModel):
    total_scans: int
    total_images_analyzed: int
    melanoma_detections: int
    benign_detections: int
    pending_scans: int
    processing_scans: int
    failed_scans: int


class RecentScanActivity(BaseModel):
    scan_id: UUID
    scan_date: datetime
    status: ScanStatus
    image_count: int
    melanoma_count: int
    benign_count: int


class DashboardResponse(BaseModel):
    overview: DashboardOverviewResponse
    recent_activity: list[RecentScanActivity]


class RecentScansResponse(BaseModel):
    items: list[ScanResponse]
    total: int
    page: int
    page_size: int
