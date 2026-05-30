import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.config import Config
from src.controllers import (
    auth_router,
    dashboard_router,
    prediction_router,
    scan_router,
    user_router,
)
from src.core.exceptions import (
    AppException,
    app_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from src.core.middleware import LoggingMiddleware
from src.core.responses import success_response
from src.db.database import init_db

logging.basicConfig(
    level=logging.DEBUG if Config.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Path(Config.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    await init_db()
    yield


app = FastAPI(
    title=Config.APP_NAME,
    version=Config.APP_VERSION,
    description="Melanoma detection platform API with JWT authentication and scan management.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)

app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(auth_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(scan_router, prefix="/api")
app.include_router(prediction_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")

Path(Config.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=Config.UPLOAD_DIR), name="uploads")


@app.get("/health", tags=["Health"])
async def health_check():
    return success_response(
        data={"status": "healthy", "version": Config.APP_VERSION},
        message="Service is running",
    )
