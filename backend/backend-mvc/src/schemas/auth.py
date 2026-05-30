from pydantic import BaseModel, EmailStr, Field

from src.schemas.clinic import NearestClinicsResponse
from src.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    city: str = Field(min_length=1, max_length=100, description="User's city or area")
    latitude: float = Field(ge=-90, le=90, description="User location latitude")
    longitude: float = Field(ge=-180, le=180, description="User location longitude")


class RegisterResponse(BaseModel):
    user: UserResponse
    suggested_clinics: NearestClinicsResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
