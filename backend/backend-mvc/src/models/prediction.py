# Predictions disabled — not run at this stage.
#
# import uuid
# from datetime import datetime, timezone
#
# from sqlalchemy import DateTime, Enum, Float, ForeignKey, String
# from sqlalchemy.dialects.postgresql import JSON, UUID
# from sqlalchemy.orm import Mapped, mapped_column, relationship
#
# from src.db.database import Base
# from src.models.enums import PredictionClass, ScanStatus
#
#
# class Prediction(Base):
#     __tablename__ = "predictions"
#
#     id: Mapped[uuid.UUID] = mapped_column(
#         UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
#     )
#     scan_image_id: Mapped[uuid.UUID] = mapped_column(
#         UUID(as_uuid=True),
#         ForeignKey("scan_images.id", ondelete="CASCADE"),
#         unique=True,
#         nullable=False,
#         index=True,
#     )
#     predicted_class: Mapped[PredictionClass] = mapped_column(
#         Enum(PredictionClass, name="prediction_class"),
#         nullable=False,
#     )
#     confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
#     model_version: Mapped[str] = mapped_column(String(50), nullable=False)
#     processing_date: Mapped[datetime] = mapped_column(
#         DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
#     )
#     status: Mapped[ScanStatus] = mapped_column(
#         Enum(ScanStatus, name="prediction_status"),
#         default=ScanStatus.COMPLETED,
#         nullable=False,
#     )
#     probabilities: Mapped[dict | None] = mapped_column(JSON, nullable=True)
#
#     scan_image: Mapped["ScanImage"] = relationship(
#         "ScanImage", back_populates="prediction"
#     )
