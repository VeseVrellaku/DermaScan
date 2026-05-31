import pytest
from pydantic import ValidationError

from src.schemas.auth import RegisterRequest
from src.services.clinic_service import ClinicService


def test_register_request_without_location():
    payload = RegisterRequest(
        email="patient@example.com",
        password="password123",
        first_name="Jane",
        last_name="Doe",
    )
    assert payload.latitude is None
    assert payload.longitude is None
    assert payload.city is None


def test_register_request_with_location():
    payload = RegisterRequest(
        email="patient@example.com",
        password="password123",
        first_name="Jane",
        last_name="Doe",
        latitude=41.3275,
        longitude=19.8187,
    )
    assert payload.latitude == 41.3275
    assert payload.longitude == 19.8187


def test_register_request_rejects_partial_location():
    with pytest.raises(ValidationError):
        RegisterRequest(
            email="patient@example.com",
            password="password123",
            first_name="Jane",
            last_name="Doe",
            latitude=41.3275,
        )


@pytest.mark.asyncio
async def test_suggest_clinics_without_location_returns_empty():
    service = ClinicService(clinic_repository=None, user_repository=None)

    result = await service.suggest_clinics_for_location(
        city=None,
        latitude=None,
        longitude=None,
    )

    assert result.clinics == []
    assert result.user_latitude is None
    assert result.user_longitude is None


@pytest.mark.asyncio
async def test_register_api_flows():
    import uuid

    import httpx
    from httpx import ASGITransport

    from main import app

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        suffix = uuid.uuid4().hex[:8]

        no_loc = await client.post(
            "/api/auth/register",
            json={
                "email": f"noloc-{suffix}@example.com",
                "password": "password123",
                "first_name": "No",
                "last_name": "Location",
            },
        )
        assert no_loc.status_code == 201
        body = no_loc.json()["data"]
        assert body["user"]["latitude"] is None
        assert body["user"]["longitude"] is None
        assert body["suggested_clinics"]["clinics"] == []

        with_loc = await client.post(
            "/api/auth/register",
            json={
                "email": f"withloc-{suffix}@example.com",
                "password": "password123",
                "first_name": "With",
                "last_name": "Location",
                "latitude": 41.3275,
                "longitude": 19.8187,
            },
        )
        assert with_loc.status_code == 201
        body2 = with_loc.json()["data"]
        assert body2["user"]["latitude"] == 41.3275
        assert body2["user"]["longitude"] == 19.8187

        partial = await client.post(
            "/api/auth/register",
            json={
                "email": f"partial-{suffix}@example.com",
                "password": "password123",
                "first_name": "Partial",
                "last_name": "Location",
                "latitude": 41.0,
            },
        )
        assert partial.status_code == 422
