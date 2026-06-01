from uuid import UUID
from typing import List, Optional

from src.models.activity_log import ActivityLog
from src.repositories.activity_log_repository import ActivityLogRepository
from src.schemas.activity_log import ActivityLogListResponse, ActivityLogFilterParams

class ActivityLogService:
    """Service for retrieving and filtering activity logs.
    Provides pagination and optional filtering by user, action_type, and date range.
    """

    def __init__(self, repository: ActivityLogRepository) -> None:
        self.repository = repository

    async def get_logs(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        filters: Optional[ActivityLogFilterParams] = None,
    ) -> ActivityLogListResponse:
        """Return a paginated list of logs applying optional filters.
        ``filters`` can include ``user_id``, ``action_type`` and ``date_from``/``date_to``.
        """
        total, logs = await self.repository.paginated_list(
            page=page,
            page_size=page_size,
            filters=filters,
        )
        return ActivityLogListResponse(
            items=logs,
            total=total,
            page=page,
            page_size=page_size,
        )
