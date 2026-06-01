from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.activity_log import ActivityLog
from typing import List, Optional

class ActivityLogRepository:
    """Repository to create and query admin activity logs."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, log: ActivityLog) -> ActivityLog:
        self.session.add(log)
        await self.session.flush()
        await self.session.refresh(log)
        return log

    async def list(
        self,
        *,
        admin_id: Optional[str] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        offset: int = 0,
        limit: int = 100,
    ) -> List[ActivityLog]:
        stmt = select(ActivityLog)
        if admin_id:
            stmt = stmt.where(ActivityLog.admin_id == admin_id)
        if action:
            stmt = stmt.where(ActivityLog.action == action)
        if entity_type:
            stmt = stmt.where(ActivityLog.entity_type == entity_type)
        stmt = stmt.order_by(ActivityLog.timestamp.desc()).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count(self) -> int:
        stmt = select(ActivityLog)
        result = await self.session.execute(stmt)
        return result.scalars().count()
