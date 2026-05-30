"""Add user location and clinics table

Revision ID: 002_user_location_clinics
Revises: 001_initial_schema
Create Date: 2026-05-30

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002_user_location_clinics"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("city", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("longitude", sa.Float(), nullable=True))

    op.execute(
        """
        UPDATE users
        SET city = 'Unknown',
            latitude = 0,
            longitude = 0
        WHERE city IS NULL
        """
    )

    op.alter_column("users", "city", nullable=False)
    op.alter_column("users", "latitude", nullable=False)
    op.alter_column("users", "longitude", nullable=False)

    op.create_table(
        "clinics",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("address", sa.String(length=500), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_clinics_city"), "clinics", ["city"], unique=False)
    op.create_index(op.f("ix_clinics_is_active"), "clinics", ["is_active"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_clinics_is_active"), table_name="clinics")
    op.drop_index(op.f("ix_clinics_city"), table_name="clinics")
    op.drop_table("clinics")
    op.drop_column("users", "longitude")
    op.drop_column("users", "latitude")
    op.drop_column("users", "city")
