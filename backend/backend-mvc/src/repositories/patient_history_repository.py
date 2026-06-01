from typing import List, Optional
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.patient_history import PatientHistory

class PatientHistoryRepository:
    """Async repository for patient history CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, history: PatientHistory) -> PatientHistory:
        self.session.add(history)
        await self.session.flush()
        await self.session.refresh(history)
        return history

    async def get_by_id(self, history_id: str) -> Optional[PatientHistory]:
        result = await self.session.execute(select(PatientHistory).where(PatientHistory.id == history_id))
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        user_id: Optional[str] = None,
        offset: int = 0,
        limit: int = 100,
    ) -> List[PatientHistory]:
        stmt = select(PatientHistory)
        if user_id:
            stmt = stmt.where(PatientHistory.user_id == user_id)
        stmt = stmt.offset(offset).limit(limit).order_by(PatientHistory.created_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, history_id: str, **kwargs) -> PatientHistory:
        stmt = (
            update(PatientHistory)
            .where(PatientHistory.id == history_id)
            .values(**kwargs)
            .execution_options(synchronize_session="fetch")
        )
        await self.session.execute(stmt)
        await self.session.commit()
        return await self.get_by_id(history_id)  # type: ignore

    async def delete(self, history_id: str) -> None:
        await self.session.execute(delete(PatientHistory).where(PatientHistory.id == history_id))
        await self.session.commit()
