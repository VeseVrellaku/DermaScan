import uuid

from src.config import Config
from src.core.exceptions import NotFoundException, ValidationException
from src.models.clinic import Clinic
from src.repositories.clinic_repository import ClinicRepository
from src.repositories.user_repository import UserRepository
from src.schemas.clinic import (
    ClinicAdminResponse,
    ClinicListResponse,
    ClinicResponse,
    CreateClinicRequest,
    NearestClinicsResponse,
    UpdateClinicRequest,
)
from src.utils.geo import haversine_km


class ClinicService:
    def __init__(
        self,
        clinic_repository: ClinicRepository,
        user_repository: UserRepository,
    ) -> None:
        self.clinic_repository = clinic_repository
        self.user_repository = user_repository

    def _rank_clinics(
        self,
        clinics: list[Clinic],
        *,
        city: str | None,
        latitude: float,
        longitude: float,
        limit: int,
        max_distance_km: float | None = None,
    ) -> NearestClinicsResponse:
        ranked: list[ClinicResponse] = []

        for clinic in clinics:
            distance = haversine_km(
                latitude,
                longitude,
                clinic.latitude,
                clinic.longitude,
            )
            if max_distance_km is not None and distance > max_distance_km:
                continue
            ranked.append(
                ClinicResponse(
                    id=clinic.id,
                    name=clinic.name,
                    address=clinic.address,
                    city=clinic.city,
                    latitude=clinic.latitude,
                    longitude=clinic.longitude,
                    phone=clinic.phone,
                    distance_km=round(distance, 2),
                )
            )

        ranked.sort(key=lambda clinic: clinic.distance_km)
        if limit < 1:
            raise ValidationException("Limit must be at least 1")

        return NearestClinicsResponse(
            user_city=city,
            user_latitude=latitude,
            user_longitude=longitude,
            clinics=ranked[:limit],
        )

    async def suggest_clinics_for_location(
        self,
        *,
        city: str | None,
        latitude: float | None,
        longitude: float | None,
        limit: int | None = None,
        max_distance_km: float | None = None,
    ) -> NearestClinicsResponse:
        if latitude is None or longitude is None:
            return NearestClinicsResponse(
                user_city=city,
                user_latitude=latitude,
                user_longitude=longitude,
                clinics=[],
            )

        clinics = await self.clinic_repository.list_active()
        return self._rank_clinics(
            clinics,
            city=city,
            latitude=latitude,
            longitude=longitude,
            limit=limit or Config.CLINIC_SUGGESTION_LIMIT,
            max_distance_km=max_distance_km,
        )

    async def get_nearest_clinics(
        self,
        user_id: uuid.UUID,
        *,
        limit: int = 10,
        max_distance_km: float | None = None,
    ) -> NearestClinicsResponse:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        if user.latitude is None or user.longitude is None:
            return NearestClinicsResponse(
                user_city=user.city,
                user_latitude=user.latitude,
                user_longitude=user.longitude,
                clinics=[],
            )

        return await self.suggest_clinics_for_location(
            city=user.city,
            latitude=user.latitude,
            longitude=user.longitude,
            limit=limit,
            max_distance_km=max_distance_km,
        )

    def _to_admin_response(self, clinic: Clinic) -> ClinicAdminResponse:
        return ClinicAdminResponse.model_validate(clinic)

    async def list_clinics_admin(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        include_inactive: bool = True,
    ) -> ClinicListResponse:
        clinics, total = await self.clinic_repository.list_all(
            page=page,
            page_size=page_size,
            include_inactive=include_inactive,
        )
        return ClinicListResponse(
            items=[self._to_admin_response(clinic) for clinic in clinics],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_clinic_admin(self, clinic_id: uuid.UUID) -> ClinicAdminResponse:
        clinic = await self.clinic_repository.get_by_id(clinic_id)
        if not clinic:
            raise NotFoundException("Clinic not found")
        return self._to_admin_response(clinic)

    async def create_clinic_admin(self, payload: CreateClinicRequest) -> ClinicAdminResponse:
        clinic = Clinic(
            name=payload.name.strip(),
            address=payload.address.strip(),
            city=payload.city.strip(),
            latitude=payload.latitude,
            longitude=payload.longitude,
            phone=payload.phone,
            is_active=payload.is_active,
        )
        created = await self.clinic_repository.create(clinic)
        return self._to_admin_response(created)

    async def update_clinic_admin(
        self,
        clinic_id: uuid.UUID,
        payload: UpdateClinicRequest,
    ) -> ClinicAdminResponse:
        clinic = await self.clinic_repository.get_by_id(clinic_id)
        if not clinic:
            raise NotFoundException("Clinic not found")

        if payload.name is not None:
            clinic.name = payload.name.strip()
        if payload.address is not None:
            clinic.address = payload.address.strip()
        if payload.city is not None:
            clinic.city = payload.city.strip()
        if (payload.latitude is None) != (payload.longitude is None):
            raise ValidationException("Both latitude and longitude must be provided together")
        if payload.latitude is not None:
            clinic.latitude = payload.latitude
        if payload.longitude is not None:
            clinic.longitude = payload.longitude
        if payload.phone is not None:
            clinic.phone = payload.phone
        if payload.is_active is not None:
            clinic.is_active = payload.is_active

        updated = await self.clinic_repository.update(clinic)
        return self._to_admin_response(updated)

    async def delete_clinic_admin(self, clinic_id: uuid.UUID) -> None:
        clinic = await self.clinic_repository.get_by_id(clinic_id)
        if not clinic:
            raise NotFoundException("Clinic not found")
        await self.clinic_repository.delete(clinic)
