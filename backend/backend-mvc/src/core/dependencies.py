import uuid
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import ForbiddenException, UnauthorizedException
from src.core.security import decode_access_token
from src.db.database import get_db
from src.models.enums import UserRole
from src.models.user import User
# from src.repositories.prediction_repository import PredictionRepository
from src.repositories.clinic_repository import ClinicRepository
from src.repositories.scan_repository import ScanRepository
from src.repositories.user_repository import UserRepository
# from src.services.ai_model_service import AIModelService, get_ai_model_service
from src.services.admin_user_service import AdminUserService
from src.services.auth_service import AuthService
from src.services.clinic_service import ClinicService
from src.services.dashboard_service import DashboardService
# from src.services.prediction_service import PredictionService
from src.services.scan_service import ScanService
from src.services.user_service import UserService
from src.utils.file_storage import FileStorageService

security = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> uuid.UUID:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise UnauthorizedException("Authentication credentials were not provided")
    user_id = decode_access_token(credentials.credentials)
    return uuid.UUID(user_id)


async def get_current_user(
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    user = await UserRepository(db).get_by_id(user_id)
    if not user:
        raise UnauthorizedException("User not found")
    return user


async def get_current_admin(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if user.role != UserRole.ADMIN:
        raise ForbiddenException("Admin access required")
    return user


def get_user_repository(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserRepository:
    return UserRepository(db)


def get_scan_repository(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ScanRepository:
    return ScanRepository(db)


def get_clinic_repository(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ClinicRepository:
    return ClinicRepository(db)


# def get_prediction_repository(
#     db: Annotated[AsyncSession, Depends(get_db)],
# ) -> PredictionRepository:
#     return PredictionRepository(db)


def get_file_storage_service() -> FileStorageService:
    return FileStorageService()


def get_clinic_service(
    clinic_repository: Annotated[ClinicRepository, Depends(get_clinic_repository)],
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> ClinicService:
    return ClinicService(clinic_repository, user_repository)


def get_auth_service(
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
    clinic_service: Annotated[ClinicService, Depends(get_clinic_service)],
) -> AuthService:
    return AuthService(user_repository, clinic_service)


def get_user_service(
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> UserService:
    return UserService(user_repository)


def get_scan_service(
    scan_repository: Annotated[ScanRepository, Depends(get_scan_repository)],
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
    # prediction_repository: Annotated[
    #     PredictionRepository, Depends(get_prediction_repository)
    # ],
    file_storage: Annotated[FileStorageService, Depends(get_file_storage_service)],
    # ai_model_service: Annotated[AIModelService, Depends(get_ai_model_service)],
) -> ScanService:
    return ScanService(
        scan_repository,
        user_repository,
        # prediction_repository,
        file_storage,
        # ai_model_service,
    )


# def get_prediction_service(
#     prediction_repository: Annotated[
#         PredictionRepository, Depends(get_prediction_repository)
#     ],
# ) -> PredictionService:
#     return PredictionService(prediction_repository)


def get_admin_user_service(
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
    scan_repository: Annotated[ScanRepository, Depends(get_scan_repository)],
    scan_service: Annotated[ScanService, Depends(get_scan_service)],
) -> AdminUserService:
    return AdminUserService(user_repository, scan_repository, scan_service)


def get_dashboard_service(
    scan_repository: Annotated[ScanRepository, Depends(get_scan_repository)],
    scan_service: Annotated[ScanService, Depends(get_scan_service)],
    clinic_service: Annotated[ClinicService, Depends(get_clinic_service)],
) -> DashboardService:
    return DashboardService(scan_repository, scan_service, clinic_service)
