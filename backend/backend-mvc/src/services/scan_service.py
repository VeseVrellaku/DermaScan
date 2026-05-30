import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import UploadFile

from src.config import Config
from src.core.exceptions import NotFoundException, ValidationException
from src.models.enums import PredictionClass, ScanStatus
from src.models.prediction import Prediction
from src.models.scan_image import ScanImage
from src.models.scan_session import ScanSession
from src.repositories.prediction_repository import PredictionRepository
from src.repositories.scan_repository import ScanRepository
from src.schemas.scan import (
    CreateScanRequest,
    PredictionSummaryResponse,
    ScanImageResponse,
    ScanListResponse,
    ScanResponse,
)
from src.services.ai_model_service import AIModelService
from src.utils.file_storage import FileStorageService


class ScanService:
    def __init__(
        self,
        scan_repository: ScanRepository,
        prediction_repository: PredictionRepository,
        file_storage: FileStorageService,
        ai_model_service: AIModelService,
    ) -> None:
        self.scan_repository = scan_repository
        self.prediction_repository = prediction_repository
        self.file_storage = file_storage
        self.ai_model_service = ai_model_service

    def _to_scan_response(self, scan: ScanSession) -> ScanResponse:
        images = [
            ScanImageResponse(
                id=image.id,
                original_filename=image.original_filename,
                image_url=image.image_url,
                mime_type=image.mime_type,
                file_size_bytes=image.file_size_bytes,
                uploaded_at=image.uploaded_at,
                prediction=(
                    PredictionSummaryResponse(
                        id=image.prediction.id,
                        predicted_class=image.prediction.predicted_class.value,
                        confidence_score=image.prediction.confidence_score,
                        model_version=image.prediction.model_version,
                        processing_date=image.prediction.processing_date,
                        status=image.prediction.status,
                    )
                    if image.prediction
                    else None
                ),
            )
            for image in scan.images
        ]
        return ScanResponse(
            id=scan.id,
            user_id=scan.user_id,
            scan_date=scan.scan_date,
            notes=scan.notes,
            status=scan.status,
            created_at=scan.created_at,
            updated_at=scan.updated_at,
            images=images,
            image_count=len(images),
        )

    async def create_scan(
        self,
        user_id: uuid.UUID,
        payload: CreateScanRequest,
    ) -> ScanResponse:
        scan = ScanSession(
            user_id=user_id,
            notes=payload.notes,
            status=ScanStatus.PENDING,
        )
        created = await self.scan_repository.create(scan)
        return self._to_scan_response(created)

    async def upload_images(
        self,
        user_id: uuid.UUID,
        scan_id: uuid.UUID,
        files: list[UploadFile],
    ) -> ScanResponse:
        if not files:
            raise ValidationException("At least one image file is required")

        scan = await self.scan_repository.get_by_id(
            scan_id,
            user_id,
            load_images=True,
        )
        if not scan:
            raise NotFoundException("Scan session not found")

        scan.status = ScanStatus.PROCESSING
        await self.scan_repository.update(scan)

        try:
            for upload in files:
                original_filename, stored_filename, relative_path, size = (
                    await self.file_storage.save_upload(upload, user_id, scan_id)
                )
                scan_image = ScanImage(
                    scan_session_id=scan.id,
                    original_filename=original_filename,
                    stored_filename=stored_filename,
                    file_path=relative_path,
                    image_url=f"/uploads/{relative_path}",
                    mime_type=upload.content_type or "application/octet-stream",
                    file_size_bytes=size,
                )
                saved_image = await self.scan_repository.add_image(scan_image)

                prediction = Prediction(
                    scan_image_id=saved_image.id,
                    predicted_class=PredictionClass.BENIGN,
                    confidence_score=0.0,
                    model_version=Config.AI_MODEL_VERSION,
                    status=ScanStatus.PROCESSING,
                )
                created_prediction = await self.prediction_repository.create(prediction)

                try:
                    image_path = Path(Config.UPLOAD_DIR) / relative_path
                    result = await self.ai_model_service.predict(image_path)
                    created_prediction.predicted_class = result.predicted_class
                    created_prediction.confidence_score = result.confidence_score
                    created_prediction.model_version = result.model_version
                    created_prediction.probabilities = result.probabilities
                    created_prediction.processing_date = datetime.now(timezone.utc)
                    created_prediction.status = ScanStatus.COMPLETED
                except Exception:
                    created_prediction.status = ScanStatus.FAILED
                await self.prediction_repository.update(created_prediction)

            refreshed = await self.scan_repository.get_by_id(
                scan_id,
                user_id,
                load_images=True,
            )
            assert refreshed is not None
            refreshed.status = self._resolve_scan_status(refreshed)
            await self.scan_repository.update(refreshed)
            return self._to_scan_response(refreshed)
        except Exception:
            scan.status = ScanStatus.FAILED
            await self.scan_repository.update(scan)
            raise

    def _resolve_scan_status(self, scan: ScanSession) -> ScanStatus:
        if not scan.images:
            return ScanStatus.PENDING

        statuses = {
            image.prediction.status if image.prediction else ScanStatus.PENDING
            for image in scan.images
        }
        if ScanStatus.FAILED in statuses:
            return ScanStatus.FAILED
        if ScanStatus.PROCESSING in statuses:
            return ScanStatus.PROCESSING
        if all(status == ScanStatus.COMPLETED for status in statuses):
            return ScanStatus.COMPLETED
        return ScanStatus.PENDING

    async def list_scans(
        self,
        user_id: uuid.UUID,
        *,
        page: int = 1,
        page_size: int = 10,
        status: ScanStatus | None = None,
    ) -> ScanListResponse:
        scans, total = await self.scan_repository.list_by_user(
            user_id,
            page=page,
            page_size=page_size,
            status=status,
        )
        return ScanListResponse(
            items=[self._to_scan_response(scan) for scan in scans],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_scan(self, user_id: uuid.UUID, scan_id: uuid.UUID) -> ScanResponse:
        scan = await self.scan_repository.get_by_id(
            scan_id,
            user_id,
            load_images=True,
        )
        if not scan:
            raise NotFoundException("Scan session not found")
        return self._to_scan_response(scan)

    async def delete_scan(self, user_id: uuid.UUID, scan_id: uuid.UUID) -> None:
        scan = await self.scan_repository.get_by_id(scan_id, user_id)
        if not scan:
            raise NotFoundException("Scan session not found")

        self.file_storage.delete_scan_directory(user_id, scan_id)
        await self.scan_repository.delete(scan)
