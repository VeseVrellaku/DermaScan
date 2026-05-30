# AI model / predictions disabled — not run at this stage.
#
# from abc import ABC, abstractmethod
# from dataclasses import dataclass
# from pathlib import Path
#
# import httpx
#
# from src.config import Config
# from src.core.exceptions import AppException
# from src.models.enums import PredictionClass
#
#
# @dataclass
# class ModelPredictionResult:
#     predicted_class: PredictionClass
#     confidence_score: float
#     model_version: str
#     probabilities: dict[str, float]
#
#
# class AIModelService(ABC):
#     @abstractmethod
#     async def predict(self, image_path: Path) -> ModelPredictionResult:
#         raise NotImplementedError
#
#
# class LocalHeuristicAIModelService(AIModelService):
#     """Default pluggable model used for development and testing."""
#
#     async def predict(self, image_path: Path) -> ModelPredictionResult:
#         _ = image_path
#         return ModelPredictionResult(
#             predicted_class=PredictionClass.BENIGN,
#             confidence_score=0.82,
#             model_version=Config.AI_MODEL_VERSION,
#             probabilities={
#                 PredictionClass.BENIGN.value: 0.82,
#                 PredictionClass.MELANOMA.value: 0.18,
#             },
#         )
#
#
# class RemoteAIModelService(AIModelService):
#     """Calls an external inference endpoint when AI_MODEL_ENDPOINT is configured."""
#
#     def __init__(self, endpoint: str) -> None:
#         self.endpoint = endpoint
#
#     async def predict(self, image_path: Path) -> ModelPredictionResult:
#         if not image_path.exists():
#             raise AppException("Image file not found for prediction")
#
#         async with httpx.AsyncClient(timeout=60.0) as client:
#             with image_path.open("rb") as image_file:
#                 response = await client.post(
#                     self.endpoint,
#                     files={"file": (image_path.name, image_file, "application/octet-stream")},
#                 )
#             response.raise_for_status()
#             payload = response.json()
#
#         predicted = payload.get("predicted_class", PredictionClass.BENIGN.value)
#         predicted_class = (
#             PredictionClass.MELANOMA
#             if str(predicted).lower() == PredictionClass.MELANOMA.value.lower()
#             else PredictionClass.BENIGN
#         )
#         return ModelPredictionResult(
#             predicted_class=predicted_class,
#             confidence_score=float(payload.get("confidence_score", 0.0)),
#             model_version=str(payload.get("model_version", Config.AI_MODEL_VERSION)),
#             probabilities=payload.get("probabilities"),
#         )
#
#
# def get_ai_model_service() -> AIModelService:
#     if Config.AI_MODEL_ENDPOINT:
#         return RemoteAIModelService(Config.AI_MODEL_ENDPOINT)
#     return LocalHeuristicAIModelService()
