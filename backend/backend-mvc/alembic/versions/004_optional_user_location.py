"""Make user location fields optional

Revision ID: 004_optional_user_location
Revises: 003_user_role
Create Date: 2026-05-31

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004_optional_user_location"
down_revision: Union[str, None] = "003_user_role"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("users", "city", existing_type=sa.String(length=100), nullable=True)
    op.alter_column("users", "latitude", existing_type=sa.Float(), nullable=True)
    op.alter_column("users", "longitude", existing_type=sa.Float(), nullable=True)


def downgrade() -> None:
    op.execute(
        """
        UPDATE users
        SET city = 'Unknown',
            latitude = 0,
            longitude = 0
        WHERE city IS NULL
           OR latitude IS NULL
           OR longitude IS NULL
        """
    )
    op.alter_column("users", "longitude", existing_type=sa.Float(), nullable=False)
    op.alter_column("users", "latitude", existing_type=sa.Float(), nullable=False)
    op.alter_column("users", "city", existing_type=sa.String(length=100), nullable=False)
