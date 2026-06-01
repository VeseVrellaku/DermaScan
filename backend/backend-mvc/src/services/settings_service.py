import uuid
from typing import List, Optional

from src.models.setting import Setting
from src.repositories.setting_repository import SettingRepository
from src.schemas.settings import SettingCreate, SettingUpdate, SettingResponse, SettingsListResponse

class SettingsService:
    """Service layer for system settings CRUD operations."""

    def __init__(self, repository: SettingRepository) -> None:
        self.repository = repository

    async def get_setting(self, key: str) -> Optional[SettingResponse]:
        setting = await self.repository.get(key)
        if setting is None:
            return None
        return SettingResponse(
            key=setting.key,
            value=setting.value,
            description=setting.description,
            updated_at=setting.updated_at,
        )

    async def list_settings(self) -> SettingsListResponse:
        settings = await self.repository.list()
        items = [
            SettingResponse(
                key=s.key,
                value=s.value,
                description=s.description,
                updated_at=s.updated_at,
            )
            for s in settings
        ]
        return SettingsListResponse(items=items)

    async def create_setting(self, payload: SettingCreate) -> SettingResponse:
        setting = Setting(
            key=payload.key,
            value=payload.value,
            description=payload.description,
        )
        created = await self.repository.create(setting)
        return SettingResponse(
            key=created.key,
            value=created.value,
            description=created.description,
            updated_at=created.updated_at,
        )

    async def update_setting(self, key: str, payload: SettingUpdate) -> SettingResponse:
        updated = await self.repository.update(
            key=key,
            value=payload.value,
            description=payload.description,
        )
        return SettingResponse(
            key=updated.key,
            value=updated.value,
            description=updated.description,
            updated_at=updated.updated_at,
        )

    async def delete_setting(self, key: str) -> None:
        await self.repository.delete(key)
