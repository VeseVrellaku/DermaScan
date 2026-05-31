import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse

from src.core.dependencies import get_current_admin, get_scan_service
from src.core.dependencies import get_admin_user_service
from src.core.responses import paginated_response, success_response
from src.models.user import User
from src.services.admin_user_service import AdminUserService
from src.services.scan_service import ScanService

router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


@router.get("")
async def list_users(
    _: Annotated[User, Depends(get_current_admin)],
    admin_user_service: Annotated[AdminUserService, Depends(get_admin_user_service)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    users = await admin_user_service.list_users(page=page, page_size=page_size)
    return paginated_response(
        items=users.items,
        total=users.total,
        page=users.page,
        page_size=users.page_size,
        message="Users retrieved successfully",
    )


@router.get("/{user_id}")
async def get_user_detail(
    user_id: uuid.UUID,
    _: Annotated[User, Depends(get_current_admin)],
    admin_user_service: Annotated[AdminUserService, Depends(get_admin_user_service)],
    scan_page: int = Query(default=1, ge=1),
    scan_page_size: int = Query(default=20, ge=1, le=100),
):
    detail = await admin_user_service.get_user_detail(
        user_id,
        scan_page=scan_page,
        scan_page_size=scan_page_size,
    )
    return success_response(data=detail, message="User details retrieved successfully")


@router.get("/{user_id}/scans/{scan_id}/report")
async def download_user_scan_report(
    user_id: uuid.UUID,
    scan_id: uuid.UUID,
    _: Annotated[User, Depends(get_current_admin)],
    scan_service: Annotated[ScanService, Depends(get_scan_service)],
):
    report_path = await scan_service.get_report_path(user_id, scan_id)
    return FileResponse(
        path=report_path,
        media_type="application/pdf",
        filename=f"dermascan-report-{scan_id}.pdf",
    )
