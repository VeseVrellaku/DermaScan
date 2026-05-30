import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.clinic import Clinic


class ClinicRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_active(self) -> list[Clinic]:
        result = await self.session.execute(
            select(Clinic)
            .where(Clinic.is_active.is_(True))
            .order_by(Clinic.city, Clinic.name)
        )
        return list(result.scalars().all())

    async def list_all(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        include_inactive: bool = True,
    ) -> tuple[list[Clinic], int]:
        filters = []
        if not include_inactive:
            filters.append(Clinic.is_active.is_(True))

        count_stmt = select(func.count()).select_from(Clinic)
        if filters:
            count_stmt = count_stmt.where(*filters)
        total = (await self.session.execute(count_stmt)).scalar_one() or 0

        offset = (page - 1) * page_size
        stmt = select(Clinic).order_by(Clinic.city, Clinic.name).offset(offset).limit(page_size)
        if filters:
            stmt = stmt.where(*filters)

        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def get_by_id(self, clinic_id: uuid.UUID) -> Clinic | None:
        result = await self.session.execute(
            select(Clinic).where(Clinic.id == clinic_id)
        )
        return result.scalar_one_or_none()

    async def create(self, clinic: Clinic) -> Clinic:
        self.session.add(clinic)
        await self.session.flush()
        await self.session.refresh(clinic)
        return clinic

    async def update(self, clinic: Clinic) -> Clinic:
        await self.session.flush()
        await self.session.refresh(clinic)
        return clinic

    async def delete(self, clinic: Clinic) -> None:
        await self.session.delete(clinic)
        await self.session.flush()
