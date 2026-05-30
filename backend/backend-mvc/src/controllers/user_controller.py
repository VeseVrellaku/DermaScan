import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from src.core.dependencies import get_current_user_id, get_scan_service, get_user_service
from src.core.responses import paginated_response, success_response
from src.models.enums import ScanStatus
from src.schemas.scan import CreateScanRequest
from src.schemas.user import UpdateUserRequest
from src.services.scan_service import ScanService
from src.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_profile(
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    user_service: Annotated[UserService, Depends(get_user_service)],
):
    profile = await user_service.get_profile(user_id)
    return success_response(data=profile, message="Profile retrieved successfully")


@router.put("/me")
async def update_profile(
    payload: UpdateUserRequest,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    user_service: Annotated[UserService, Depends(get_user_service)],
):
    profile = await user_service.update_profile(user_id, payload)
    return success_response(data=profile, message="Profile updated successfully")


@router.get("/me/scans")
async def get_scan_history(
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    scan_service: Annotated[ScanService, Depends(get_scan_service)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    status_filter: ScanStatus | None = Query(default=None, alias="status"),
):
    scans = await scan_service.list_scans(
        user_id,
        page=page,
        page_size=page_size,
        status=status_filter,
    )
    return paginated_response(
        items=scans.items,
        total=scans.total,
        page=scans.page,
        page_size=scans.page_size,
        message="Scan history retrieved successfully",
    )
