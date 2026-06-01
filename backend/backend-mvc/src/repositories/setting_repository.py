from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.setting import Setting
from typing import List, Optional

class SettingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, key: str) -> Optional[Setting]:
        stmt = select(Setting).where(Setting.key == key)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(self) -> List[Setting]:
        stmt = select(Setting)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, setting: Setting) -> Setting:
        self.session.add(setting)
        await self.session.flush()
        await self.session.refresh(setting)
        return setting

    async def update(self, key: str, value: str, description: Optional[str] = None) -> Setting:
        setting = await self.get(key)
        if not setting:
            raise ValueError(f"Setting '{key}' not found")
        setting.value = value
        if description is not None:
            setting.description = description
        await self.session.flush()
        await self.session.refresh(setting)
        return setting

    async def delete(self, key: str) -> None:
        setting = await self.get(key)
        if setting:
            await self.session.delete(setting)
            await self.session.flush()
