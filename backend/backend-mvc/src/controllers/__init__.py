from src.controllers.admin_clinic_controller import router as admin_clinic_router
from src.controllers.auth_controller import router as auth_router
from src.controllers.clinic_controller import router as clinic_router
from src.controllers.dashboard_controller import router as dashboard_router
# from src.controllers.prediction_controller import router as prediction_router
from src.controllers.scan_controller import router as scan_router
from src.controllers.user_controller import router as user_router

__all__ = [
    "auth_router",
    "user_router",
    "scan_router",
    # "prediction_router",
    "dashboard_router",
    "clinic_router",
    "admin_clinic_router",
]
