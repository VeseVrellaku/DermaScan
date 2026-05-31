import uuid

from src.repositories.scan_repository import ScanRepository
from src.repositories.user_repository import UserRepository
from src.schemas.admin_user import (
    AdminUserDetail,
    AdminUserDetailResponse,
    AdminUserListResponse,
    AdminUserSummary,
)
from src.schemas.scan import ScanListResponse
from src.services.scan_service import ScanService


class AdminUserService:
    def __init__(
        self,
        user_repository: UserRepository,
        scan_repository: ScanRepository,
        scan_service: ScanService,
    ) -> None:
        self.user_repository = user_repository
        self.scan_repository = scan_repository
        self.scan_service = scan_service

    async def list_users(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
    ) -> AdminUserListResponse:
        users, total = await self.user_repository.list_all(page=page, page_size=page_size)
        items: list[AdminUserSummary] = []
        for user in users:
            scan_count = await self.scan_repository.count_user_scans(user.id)
            items.append(
                AdminUserSummary(
                    id=user.id,
                    email=user.email,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    role=user.role,
                    city=user.city,
                    latitude=user.latitude,
                    longitude=user.longitude,
                    created_at=user.created_at,
                    scan_count=scan_count,
                )
            )
        return AdminUserListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_user_detail(
        self,
        user_id: uuid.UUID,
        *,
        scan_page: int = 1,
        scan_page_size: int = 20,
    ) -> AdminUserDetailResponse:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            from src.core.exceptions import NotFoundException

            raise NotFoundException("User not found")

        scans, total = await self.scan_repository.list_by_user(
            user_id,
            page=scan_page,
            page_size=scan_page_size,
        )
        scan_count = await self.scan_repository.count_user_scans(user_id)
        user_detail = AdminUserDetail(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            city=user.city,
            latitude=user.latitude,
            longitude=user.longitude,
            created_at=user.created_at,
            updated_at=user.updated_at,
            phone=user.phone,
            scan_count=scan_count,
        )
        return AdminUserDetailResponse(
            user=user_detail,
            scans=ScanListResponse(
                items=[self.scan_service._to_scan_response(scan) for scan in scans],
                total=total,
                page=scan_page,
                page_size=scan_page_size,
            ),
        )
