import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.enums import ScanStatus
# from src.models.prediction import Prediction
from src.models.scan_image import ScanImage
from src.models.scan_session import ScanSession


class ScanRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, scan_session: ScanSession) -> ScanSession:
        self.session.add(scan_session)
        await self.session.flush()
        await self.session.refresh(scan_session)
        return scan_session

    async def get_by_id(
        self,
        scan_id: uuid.UUID,
        user_id: uuid.UUID | None = None,
        *,
        load_images: bool = False,
    ) -> ScanSession | None:
        stmt = select(ScanSession).where(ScanSession.id == scan_id)
        if user_id is not None:
            stmt = stmt.where(ScanSession.user_id == user_id)
        if load_images:
            stmt = stmt.options(selectinload(ScanSession.images))
            # stmt = stmt.options(
            #     selectinload(ScanSession.images).selectinload(ScanImage.prediction)
            # )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_user(
        self,
        user_id: uuid.UUID,
        *,
        page: int = 1,
        page_size: int = 10,
        status: ScanStatus | None = None,
    ) -> tuple[list[ScanSession], int]:
        filters = [ScanSession.user_id == user_id]
        if status is not None:
            filters.append(ScanSession.status == status)

        count_stmt = select(func.count()).select_from(ScanSession).where(*filters)
        total = (await self.session.execute(count_stmt)).scalar_one() or 0

        offset = (page - 1) * page_size
        stmt = (
            select(ScanSession)
            .where(*filters)
            .options(selectinload(ScanSession.images))
            # .options(
            #     selectinload(ScanSession.images).selectinload(ScanImage.prediction)
            # )
            .order_by(ScanSession.scan_date.desc())
            .offset(offset)
            .limit(page_size)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def update(self, scan_session: ScanSession) -> ScanSession:
        await self.session.flush()
        await self.session.refresh(scan_session)
        return scan_session

    async def delete(self, scan_session: ScanSession) -> None:
        await self.session.delete(scan_session)
        await self.session.flush()

    async def add_image(self, scan_image: ScanImage) -> ScanImage:
        self.session.add(scan_image)
        await self.session.flush()
        await self.session.refresh(scan_image)
        return scan_image

    async def get_image_by_id(
        self,
        image_id: uuid.UUID,
        scan_id: uuid.UUID | None = None,
    ) -> ScanImage | None:
        stmt = select(ScanImage).where(ScanImage.id == image_id)
        if scan_id is not None:
            stmt = stmt.where(ScanImage.scan_session_id == scan_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def count_user_scans(self, user_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(ScanSession)
            .where(ScanSession.user_id == user_id)
        )
        return (await self.session.execute(stmt)).scalar_one() or 0

    async def count_user_images(self, user_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(ScanImage)
            .join(ScanSession)
            .where(ScanSession.user_id == user_id)
        )
        return (await self.session.execute(stmt)).scalar_one() or 0

    async def count_scans_by_status(self, user_id: uuid.UUID, status: ScanStatus) -> int:
        stmt = (
            select(func.count())
            .select_from(ScanSession)
            .where(ScanSession.user_id == user_id, ScanSession.status == status)
        )
        return (await self.session.execute(stmt)).scalar_one() or 0

    # async def count_predictions_by_class(
    #     self,
    #     user_id: uuid.UUID,
    #     predicted_class: str,
    # ) -> int:
    #     stmt = (
    #         select(func.count())
    #         .select_from(Prediction)
    #         .join(ScanImage)
    #         .join(ScanSession)
    #         .where(
    #             ScanSession.user_id == user_id,
    #             Prediction.predicted_class == predicted_class,
    #         )
    #     )
    #     return (await self.session.execute(stmt)).scalar_one() or 0

    async def get_recent_scans(
        self,
        user_id: uuid.UUID,
        *,
        limit: int = 5,
    ) -> list[ScanSession]:
        stmt = (
            select(ScanSession)
            .where(ScanSession.user_id == user_id)
            .options(selectinload(ScanSession.images))
            # .options(
            #     selectinload(ScanSession.images).selectinload(ScanImage.prediction)
            # )
            .order_by(ScanSession.scan_date.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_scans_since(
        self,
        user_id: uuid.UUID,
        since: datetime | None,
        *,
        page: int,
        page_size: int,
    ) -> tuple[list[ScanSession], int]:
        filters = [ScanSession.user_id == user_id]
        if since is not None:
            filters.append(ScanSession.scan_date >= since)

        count_stmt = select(func.count()).select_from(ScanSession).where(*filters)
        total = (await self.session.execute(count_stmt)).scalar_one() or 0

        offset = (page - 1) * page_size
        stmt = (
            select(ScanSession)
            .where(*filters)
            .options(selectinload(ScanSession.images))
            # .options(
            #     selectinload(ScanSession.images).selectinload(ScanImage.prediction)
            # )
            .order_by(ScanSession.scan_date.desc())
            .offset(offset)
            .limit(page_size)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total
