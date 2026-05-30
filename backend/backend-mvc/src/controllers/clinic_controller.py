import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from src.core.dependencies import get_clinic_service, get_current_user_id
from src.core.responses import success_response
from src.services.clinic_service import ClinicService

router = APIRouter(prefix="/clinics", tags=["Clinics"])


@router.get("/nearest")
async def get_nearest_clinics(
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    clinic_service: Annotated[ClinicService, Depends(get_clinic_service)],
    limit: int = Query(default=10, ge=1, le=50),
    max_distance_km: float | None = Query(default=None, gt=0),
):
    clinics = await clinic_service.get_nearest_clinics(
        user_id,
        limit=limit,
        max_distance_km=max_distance_km,
    )
    return success_response(data=clinics, message="Nearest clinic recommendations retrieved successfully")
