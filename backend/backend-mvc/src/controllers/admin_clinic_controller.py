import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from src.core.dependencies import get_clinic_service, get_current_admin
from src.core.responses import paginated_response, success_response
from src.models.user import User
from src.schemas.clinic import CreateClinicRequest, UpdateClinicRequest
from src.services.clinic_service import ClinicService

router = APIRouter(prefix="/admin/clinics", tags=["Admin Clinics"])


@router.get("")
async def list_clinics(
    _: Annotated[User, Depends(get_current_admin)],
    clinic_service: Annotated[ClinicService, Depends(get_clinic_service)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    include_inactive: bool = Query(default=True),
):
    clinics = await clinic_service.list_clinics_admin(
        page=page,
        page_size=page_size,
        include_inactive=include_inactive,
    )
    return paginated_response(
        items=clinics.items,
        total=clinics.total,
        page=clinics.page,
        page_size=clinics.page_size,
        message="Clinics retrieved successfully",
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_clinic(
    payload: CreateClinicRequest,
    _: Annotated[User, Depends(get_current_admin)],
    clinic_service: Annotated[ClinicService, Depends(get_clinic_service)],
):
    clinic = await clinic_service.create_clinic_admin(payload)
    return success_response(data=clinic, message="Clinic created successfully")


@router.get("/{clinic_id}")
async def get_clinic(
    clinic_id: uuid.UUID,
    _: Annotated[User, Depends(get_current_admin)],
    clinic_service: Annotated[ClinicService, Depends(get_clinic_service)],
):
    clinic = await clinic_service.get_clinic_admin(clinic_id)
    return success_response(data=clinic, message="Clinic retrieved successfully")


@router.put("/{clinic_id}")
async def update_clinic(
    clinic_id: uuid.UUID,
    payload: UpdateClinicRequest,
    _: Annotated[User, Depends(get_current_admin)],
    clinic_service: Annotated[ClinicService, Depends(get_clinic_service)],
):
    clinic = await clinic_service.update_clinic_admin(clinic_id, payload)
    return success_response(data=clinic, message="Clinic updated successfully")


@router.delete("/{clinic_id}")
async def delete_clinic(
    clinic_id: uuid.UUID,
    _: Annotated[User, Depends(get_current_admin)],
    clinic_service: Annotated[ClinicService, Depends(get_clinic_service)],
):
    await clinic_service.delete_clinic_admin(clinic_id)
    return success_response(message="Clinic deleted successfully")
