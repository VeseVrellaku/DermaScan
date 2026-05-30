"""Initial schema

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-05-30

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

scan_status_enum = postgresql.ENUM(
    "Pending",
    "Processing",
    "Completed",
    "Failed",
    name="scan_status",
    create_type=False,
)
prediction_class_enum = postgresql.ENUM(
    "Melanoma",
    "Benign",
    name="prediction_class",
    create_type=False,
)
prediction_status_enum = postgresql.ENUM(
    "Pending",
    "Processing",
    "Completed",
    "Failed",
    name="prediction_status",
    create_type=False,
)


def upgrade() -> None:
    op.execute(
        "CREATE TYPE scan_status AS ENUM ('Pending', 'Processing', 'Completed', 'Failed')"
    )
    op.execute("CREATE TYPE prediction_class AS ENUM ('Melanoma', 'Benign')")
    op.execute(
        "CREATE TYPE prediction_status AS ENUM ('Pending', 'Processing', 'Completed', 'Failed')"
    )

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "scan_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("scan_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", scan_status_enum, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_scan_sessions_user_id"), "scan_sessions", ["user_id"], unique=False
    )
    op.create_index(
        op.f("ix_scan_sessions_status"), "scan_sessions", ["status"], unique=False
    )

    op.create_table(
        "scan_images",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("scan_session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("stored_filename", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["scan_session_id"], ["scan_sessions.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_scan_images_scan_session_id"),
        "scan_images",
        ["scan_session_id"],
        unique=False,
    )

    op.create_table(
        "predictions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("scan_image_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("predicted_class", prediction_class_enum, nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("model_version", sa.String(length=50), nullable=False),
        sa.Column("processing_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", prediction_status_enum, nullable=False),
        sa.Column("probabilities", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(
            ["scan_image_id"], ["scan_images.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("scan_image_id"),
    )
    op.create_index(
        op.f("ix_predictions_scan_image_id"),
        "predictions",
        ["scan_image_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_predictions_scan_image_id"), table_name="predictions")
    op.drop_table("predictions")
    op.drop_index(op.f("ix_scan_images_scan_session_id"), table_name="scan_images")
    op.drop_table("scan_images")
    op.drop_index(op.f("ix_scan_sessions_status"), table_name="scan_sessions")
    op.drop_index(op.f("ix_scan_sessions_user_id"), table_name="scan_sessions")
    op.drop_table("scan_sessions")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS prediction_status")
    op.execute("DROP TYPE IF EXISTS prediction_class")
    op.execute("DROP TYPE IF EXISTS scan_status")
