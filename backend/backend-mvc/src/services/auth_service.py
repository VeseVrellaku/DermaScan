from src.config import Config
from src.core.exceptions import ConflictException, UnauthorizedException
from src.core.security import create_access_token, hash_password, verify_password
from src.models.user import User
from src.repositories.user_repository import UserRepository
from src.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from src.schemas.user import UserResponse


class AuthService:
    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repository = user_repository

    async def register(self, payload: RegisterRequest) -> UserResponse:
        if await self.user_repository.email_exists(payload.email):
            raise ConflictException("Email is already registered")

        user = User(
            email=payload.email.lower(),
            password_hash=hash_password(payload.password),
            first_name=payload.first_name,
            last_name=payload.last_name,
            phone=payload.phone,
        )
        created = await self.user_repository.create(user)
        return UserResponse.model_validate(created)

    async def login(self, payload: LoginRequest) -> TokenResponse:
        user = await self.user_repository.get_by_email(payload.email.lower())
        if not user or not verify_password(payload.password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")

        token = create_access_token(str(user.id))
        return TokenResponse(
            access_token=token,
            expires_in=Config.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def get_current_user(self, user_id: str) -> UserResponse:
        from uuid import UUID

        user = await self.user_repository.get_by_id(UUID(user_id))
        if not user:
            raise UnauthorizedException("User not found")
        return UserResponse.model_validate(user)
