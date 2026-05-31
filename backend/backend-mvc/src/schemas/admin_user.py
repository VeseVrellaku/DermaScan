from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from src.models.enums import UserRole
from src.schemas.scan import ScanListResponse, ScanResponse
from src.schemas.user import UserResponse


class AdminUserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    city: str | None
    latitude: float | None
    longitude: float | None
    created_at: datetime
    scan_count: int = 0


class AdminUserDetail(AdminUserSummary):
    phone: str | None
    updated_at: datetime


class AdminUserListResponse(BaseModel):
    items: list[AdminUserSummary]
    total: int
    page: int
    page_size: int


class AdminUserDetailResponse(BaseModel):
    user: AdminUserDetail
    scans: ScanListResponse
