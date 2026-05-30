from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ClinicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    address: str
    city: str
    latitude: float
    longitude: float
    phone: str | None
    distance_km: float = Field(description="Distance from the user's location in kilometers")


class ClinicAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    address: str
    city: str
    latitude: float
    longitude: float
    phone: str | None
    is_active: bool


class CreateClinicRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    address: str = Field(min_length=1, max_length=500)
    city: str = Field(min_length=1, max_length=100)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    phone: str | None = Field(default=None, max_length=30)
    is_active: bool = True


class UpdateClinicRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    address: str | None = Field(default=None, min_length=1, max_length=500)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    phone: str | None = Field(default=None, max_length=30)
    is_active: bool | None = None


class NearestClinicsResponse(BaseModel):
    user_city: str
    user_latitude: float
    user_longitude: float
    clinics: list[ClinicResponse]


class ClinicListResponse(BaseModel):
    items: list[ClinicAdminResponse]
    total: int
    page: int
    page_size: int
