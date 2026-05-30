import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from src.core.dependencies import get_current_user_id, get_dashboard_service
from src.core.responses import paginated_response, success_response
from src.models.enums import ScanStatus
from src.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/overview")
async def get_dashboard_overview(
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
):
    dashboard = await dashboard_service.get_overview(user_id)
    return success_response(data=dashboard, message="Dashboard overview retrieved")


@router.get("/recent-scans")
async def get_recent_scans(
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    status_filter: ScanStatus | None = Query(default=None, alias="status"),
):
    scans = await dashboard_service.get_recent_scans(
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
        message="Recent scans retrieved successfully",
    )
