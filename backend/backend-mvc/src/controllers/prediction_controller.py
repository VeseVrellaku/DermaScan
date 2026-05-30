# Predictions disabled — not run at this stage.
#
# import uuid
# from typing import Annotated
#
# from fastapi import APIRouter, Depends
#
# from src.core.dependencies import get_current_user_id, get_prediction_service
# from src.core.responses import success_response
# from src.services.prediction_service import PredictionService
#
# router = APIRouter(prefix="/predictions", tags=["Predictions"])
#
#
# @router.get("/{prediction_id}")
# async def get_prediction(
#     prediction_id: uuid.UUID,
#     user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
#     prediction_service: Annotated[PredictionService, Depends(get_prediction_service)],
# ):
#     prediction = await prediction_service.get_prediction(user_id, prediction_id)
#     return success_response(data=prediction, message="Prediction retrieved successfully")
