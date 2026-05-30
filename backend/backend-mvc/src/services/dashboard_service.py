import uuid

from src.models.enums import ScanStatus
from src.repositories.scan_repository import ScanRepository
from src.schemas.dashboard import (
    DashboardOverviewResponse,
    DashboardResponse,
    RecentScanActivity,
    RecentScansResponse,
)
from src.services.scan_service import ScanService


class DashboardService:
    def __init__(
        self,
        scan_repository: ScanRepository,
        scan_service: ScanService,
    ) -> None:
        self.scan_repository = scan_repository
        self.scan_service = scan_service

    async def get_overview(self, user_id: uuid.UUID) -> DashboardResponse:
        total_scans = await self.scan_repository.count_user_scans(user_id)
        total_images = await self.scan_repository.count_user_images(user_id)
        # melanoma_count = await self.scan_repository.count_predictions_by_class(
        #     user_id,
        #     PredictionClass.MELANOMA,
        # )
        # benign_count = await self.scan_repository.count_predictions_by_class(
        #     user_id,
        #     PredictionClass.BENIGN,
        # )
        melanoma_count = 0
        benign_count = 0
        pending_scans = await self.scan_repository.count_scans_by_status(
            user_id,
            ScanStatus.PENDING,
        )
        processing_scans = await self.scan_repository.count_scans_by_status(
            user_id,
            ScanStatus.PROCESSING,
        )
        failed_scans = await self.scan_repository.count_scans_by_status(
            user_id,
            ScanStatus.FAILED,
        )

        recent_scans = await self.scan_repository.get_recent_scans(user_id, limit=5)
        recent_activity = []
        for scan in recent_scans:
            # melanoma_in_scan = sum(
            #     1
            #     for image in scan.images
            #     if image.prediction
            #     and image.prediction.predicted_class == PredictionClass.MELANOMA
            # )
            # benign_in_scan = sum(
            #     1
            #     for image in scan.images
            #     if image.prediction
            #     and image.prediction.predicted_class == PredictionClass.BENIGN
            # )
            melanoma_in_scan = 0
            benign_in_scan = 0
            recent_activity.append(
                RecentScanActivity(
                    scan_id=scan.id,
                    scan_date=scan.scan_date,
                    status=scan.status,
                    image_count=len(scan.images),
                    melanoma_count=melanoma_in_scan,
                    benign_count=benign_in_scan,
                )
            )

        return DashboardResponse(
            overview=DashboardOverviewResponse(
                total_scans=total_scans,
                total_images_analyzed=total_images,
                melanoma_detections=melanoma_count,
                benign_detections=benign_count,
                pending_scans=pending_scans,
                processing_scans=processing_scans,
                failed_scans=failed_scans,
            ),
            recent_activity=recent_activity,
        )

    async def get_recent_scans(
        self,
        user_id: uuid.UUID,
        *,
        page: int = 1,
        page_size: int = 10,
        status: ScanStatus | None = None,
    ) -> RecentScansResponse:
        scans, total = await self.scan_repository.list_by_user(
            user_id,
            page=page,
            page_size=page_size,
            status=status,
        )
        return RecentScansResponse(
            items=[self.scan_service._to_scan_response(scan) for scan in scans],
            total=total,
            page=page,
            page_size=page_size,
        )
