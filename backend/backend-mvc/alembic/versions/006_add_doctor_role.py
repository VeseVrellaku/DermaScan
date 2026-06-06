"""Add doctor role to user_role enum

Revision ID: 006_add_doctor_role
Revises: 005_scan_reports
Create Date: 2026-05-30

"""

from typing import Sequence, Union

from alembic import op

revision: str = "006_add_doctor_role"
down_revision: Union[str, None] = "005_scan_reports"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'doctor'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values safely.
    pass
