"""Add scan report fields

Revision ID: 005_scan_reports
Revises: 004_optional_user_location
Create Date: 2026-05-31

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005_scan_reports"
down_revision: Union[str, None] = "004_optional_user_location"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("scan_sessions", sa.Column("classification_label", sa.String(length=255), nullable=True))
    op.add_column("scan_sessions", sa.Column("confidence_score", sa.Float(), nullable=True))
    op.add_column("scan_sessions", sa.Column("risk_level", sa.String(length=100), nullable=True))
    op.add_column("scan_sessions", sa.Column("report_summary", sa.Text(), nullable=True))
    op.add_column("scan_sessions", sa.Column("report_pdf_path", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("scan_sessions", "report_pdf_path")
    op.drop_column("scan_sessions", "report_summary")
    op.drop_column("scan_sessions", "risk_level")
    op.drop_column("scan_sessions", "confidence_score")
    op.drop_column("scan_sessions", "classification_label")
