import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status

from src.core.dependencies import get_auth_service, get_current_user_id
from src.core.responses import success_response
from src.schemas.auth import LoginRequest, RegisterRequest
from src.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    user = await auth_service.register(payload)
    return success_response(
        data=user,
        message="User registered successfully. Nearest clinics have been suggested based on your location.",
    )


@router.post("/login")
async def login(
    payload: LoginRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    token = await auth_service.login(payload)
    return success_response(data=token, message="Login successful")


@router.get("/me")
async def get_me(
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    user = await auth_service.get_current_user(str(user_id))
    return success_response(data=user, message="Authenticated user retrieved")
