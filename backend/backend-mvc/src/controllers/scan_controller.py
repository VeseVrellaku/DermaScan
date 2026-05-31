import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from fastapi.responses import FileResponse

from src.core.dependencies import get_current_user_id, get_scan_service
from src.core.responses import paginated_response, success_response
from src.models.enums import ScanStatus
from src.schemas.scan import CreateScanRequest
from src.services.scan_service import ScanService

router = APIRouter(prefix="/scans", tags=["Scans"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_scan(
    payload: CreateScanRequest,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    scan_service: Annotated[ScanService, Depends(get_scan_service)],
):
    scan = await scan_service.create_scan(user_id, payload)
    return success_response(data=scan, message="Scan session created successfully")


@router.post("/{scan_id}/images")
async def upload_scan_images(
    scan_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    scan_service: Annotated[ScanService, Depends(get_scan_service)],
    files: list[UploadFile] = File(...),
):
    scan = await scan_service.upload_images(user_id, scan_id, files)
    return success_response(data=scan, message="Images uploaded successfully")


@router.get("")
async def list_scans(
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
        message="Scans retrieved successfully",
    )


@router.get("/{scan_id}/report")
async def download_scan_report(
    scan_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    scan_service: Annotated[ScanService, Depends(get_scan_service)],
):
    report_path = await scan_service.get_report_path(user_id, scan_id)
    return FileResponse(
        path=report_path,
        media_type="application/pdf",
        filename=f"dermascan-report-{scan_id}.pdf",
    )


@router.get("/{scan_id}")
async def get_scan(
    scan_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    scan_service: Annotated[ScanService, Depends(get_scan_service)],
):
    scan = await scan_service.get_scan(user_id, scan_id)
    return success_response(data=scan, message="Scan retrieved successfully")


@router.delete("/{scan_id}")
async def delete_scan(
    scan_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    scan_service: Annotated[ScanService, Depends(get_scan_service)],
):
    await scan_service.delete_scan(user_id, scan_id)
    return success_response(message="Scan deleted successfully")
