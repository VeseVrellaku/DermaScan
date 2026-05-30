import uuid

from src.core.exceptions import NotFoundException
from src.repositories.prediction_repository import PredictionRepository
from src.schemas.prediction import PredictionResponse


class PredictionService:
    def __init__(self, prediction_repository: PredictionRepository) -> None:
        self.prediction_repository = prediction_repository

    async def get_prediction(
        self,
        user_id: uuid.UUID,
        prediction_id: uuid.UUID,
    ) -> PredictionResponse:
        prediction = await self.prediction_repository.get_by_id(prediction_id, user_id)
        if not prediction or not prediction.scan_image:
            raise NotFoundException("Prediction not found")

        return PredictionResponse(
            id=prediction.id,
            scan_image_id=prediction.scan_image_id,
            image_url=prediction.scan_image.image_url,
            predicted_class=prediction.predicted_class.value,
            confidence_score=prediction.confidence_score,
            processing_date=prediction.processing_date,
            model_version=prediction.model_version,
            status=prediction.status,
            probabilities=prediction.probabilities,
        )
