import uuid
from typing import List

from src.models.user import User
from src.models.scan_session import ScanSession
from src.models.activity_log import ActivityLog
from src.repositories.user_repository import UserRepository
from src.repositories.scan_repository import ScanRepository
from src.repositories.activity_log_repository import ActivityLogRepository
from src.schemas.admin_dashboard import DashboardStats

class AdminDashboardService:
    def __init__(
        self,
        user_repository: UserRepository,
        scan_repository: ScanRepository,
        activity_log_repository: ActivityLogRepository,
    ) -> None:
        self.user_repository = user_repository
        self.scan_repository = scan_repository
        self.activity_log_repository = activity_log_repository

    async def get_stats(self) -> DashboardStats:
        """Collect high‑level statistics for the admin overview page.
        Returns a ``DashboardStats`` DTO containing totals and recent activity.
        """
        total_users = await self.user_repository.count()
        total_scans = await self.scan_repository.count()
        recent_scans, _ = await self.scan_repository.list(
            page=1,
            page_size=5,
            order_by_desc=True,
        )
        recent_logs, _ = await self.activity_log_repository.list(
            offset=0,
            limit=5,
        )
        return DashboardStats(
            total_users=total_users,
            total_scans=total_scans,
            recent_scans=[self._to_scan_summary(s) for s in recent_scans],
            recent_activity=[self._to_log_entry(l) for l in recent_logs],
        )

    def _to_scan_summary(self, scan: ScanSession):
        return {
            "id": scan.id,
            "user_id": scan.user_id,
            "status": scan.status,
            "created_at": scan.created_at,
        }

    def _to_log_entry(self, log: ActivityLog):
        return {
            "id": log.id,
            "admin_id": log.admin_id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "timestamp": log.timestamp,
        }
