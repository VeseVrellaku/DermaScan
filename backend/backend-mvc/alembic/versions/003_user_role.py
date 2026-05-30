"""Add user role for admin clinic management

Revision ID: 003_user_role
Revises: 002_user_location_clinics
Create Date: 2026-05-30

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003_user_role"
down_revision: Union[str, None] = "002_user_location_clinics"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

user_role_enum = postgresql.ENUM("user", "admin", name="user_role", create_type=False)


def upgrade() -> None:
    op.execute("CREATE TYPE user_role AS ENUM ('user', 'admin')")
    op.add_column(
        "users",
        sa.Column("role", user_role_enum, nullable=False, server_default="user"),
    )
    op.create_index(op.f("ix_users_role"), "users", ["role"], unique=False)
    op.alter_column("users", "role", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_role"), table_name="users")
    op.drop_column("users", "role")
    op.execute("DROP TYPE IF EXISTS user_role")
