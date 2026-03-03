"""Add super_admins table and seed default admin from .env.

Revision ID: 002
Revises: 001
Create Date: 2025-03-01

SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are loaded from Backend/.env
via alembic/env.py. Username is set equal to the email, so super admin
logs in using their email as the username.
"""
import os
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from passlib.context import CryptContext

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "super_admins",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(64), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("login_code", sa.String(6), nullable=True),
        sa.Column("login_code_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_super_admins_username", "super_admins", ["username"], unique=True)

    # Seed super admin strictly from environment (.env loaded in env.py)
    email = os.environ.get("SUPER_ADMIN_EMAIL", "").strip()
    raw_password = os.environ.get("SUPER_ADMIN_PASSWORD", "").strip()
    if not email or not raw_password:
        raise RuntimeError(
            "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in Backend/.env "
            "before running migrations."
        )

    username = email  # login uses email as username
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed = pwd_context.hash(raw_password)
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "INSERT INTO super_admins (username, email, hashed_password) "
            "VALUES (:username, :email, :hashed_password)"
        ),
        {"username": username, "email": email, "hashed_password": hashed},
    )


def downgrade() -> None:
    op.drop_index("ix_super_admins_username", table_name="super_admins")
    op.drop_table("super_admins")
