import uuid

from src.core.exceptions import NotFoundException
from src.repositories.user_repository import UserRepository
from src.schemas.user import UpdateUserRequest, UserResponse


class UserService:
    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repository = user_repository

    async def get_profile(self, user_id: uuid.UUID) -> UserResponse:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return UserResponse.model_validate(user)

    async def update_profile(
        self,
        user_id: uuid.UUID,
        payload: UpdateUserRequest,
    ) -> UserResponse:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        if payload.first_name is not None:
            user.first_name = payload.first_name
        if payload.last_name is not None:
            user.last_name = payload.last_name
        if payload.phone is not None:
            user.phone = payload.phone

        updated = await self.user_repository.update(user)
        return UserResponse.model_validate(updated)
