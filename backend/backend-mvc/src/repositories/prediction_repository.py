import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.prediction import Prediction
from src.models.scan_image import ScanImage
from src.models.scan_session import ScanSession


class PredictionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, prediction: Prediction) -> Prediction:
        self.session.add(prediction)
        await self.session.flush()
        await self.session.refresh(prediction)
        return prediction

    async def get_by_id(
        self,
        prediction_id: uuid.UUID,
        user_id: uuid.UUID | None = None,
    ) -> Prediction | None:
        stmt = (
            select(Prediction)
            .options(selectinload(Prediction.scan_image))
            .where(Prediction.id == prediction_id)
        )
        if user_id is not None:
            stmt = (
                stmt.join(Prediction.scan_image)
                .join(ScanImage.scan_session)
                .where(ScanSession.user_id == user_id)
            )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_image_id(self, scan_image_id: uuid.UUID) -> Prediction | None:
        result = await self.session.execute(
            select(Prediction).where(Prediction.scan_image_id == scan_image_id)
        )
        return result.scalar_one_or_none()

    async def update(self, prediction: Prediction) -> Prediction:
        await self.session.flush()
        await self.session.refresh(prediction)
        return prediction
