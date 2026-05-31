from src.config import Config
from src.core.exceptions import ConflictException, UnauthorizedException
from src.core.security import create_access_token, hash_password, verify_password
from src.models.enums import UserRole
from src.models.user import User
from src.repositories.user_repository import UserRepository
from src.schemas.auth import LoginRequest, RegisterRequest, RegisterResponse, TokenResponse
from src.schemas.user import UserResponse
from src.services.clinic_service import ClinicService


class AuthService:
    def __init__(
        self,
        user_repository: UserRepository,
        clinic_service: ClinicService,
    ) -> None:
        self.user_repository = user_repository
        self.clinic_service = clinic_service

    async def register(self, payload: RegisterRequest) -> RegisterResponse:
        if await self.user_repository.email_exists(payload.email):
            raise ConflictException("Email is already registered")

        email = payload.email.lower()
        role = UserRole.ADMIN if email in Config.admin_emails else UserRole.USER

        user = User(
            email=email,
            password_hash=hash_password(payload.password),
            first_name=payload.first_name,
            last_name=payload.last_name,
            phone=payload.phone,
            city=payload.city.strip() if payload.city else None,
            latitude=payload.latitude,
            longitude=payload.longitude,
            role=role,
        )
        created = await self.user_repository.create(user)
        suggested_clinics = await self.clinic_service.suggest_clinics_for_location(
            city=created.city,
            latitude=created.latitude,
            longitude=created.longitude,
        )
        return RegisterResponse(
            user=UserResponse.model_validate(created),
            suggested_clinics=suggested_clinics,
        )

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
