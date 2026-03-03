"""Initial schema: users and whitelist_applications.

Revision ID: 001
Revises:
Create Date: 2025-03-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=True),
        sa.Column("provider", sa.String(20), nullable=True, server_default="email"),
        sa.Column("google_id", sa.String(255), nullable=True),
        sa.Column("is_whitelisted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)

    op.create_table(
        "whitelist_applications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("google_id", sa.String(255), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("applied_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("signup_token", sa.String(64), nullable=True),
        sa.Column("signup_token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_whitelist_applications_email", "whitelist_applications", ["email"], unique=False)
    op.create_index("ix_whitelist_applications_google_id", "whitelist_applications", ["google_id"], unique=False)
    op.create_index("ix_whitelist_applications_signup_token", "whitelist_applications", ["signup_token"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_whitelist_applications_signup_token", table_name="whitelist_applications")
    op.drop_index("ix_whitelist_applications_google_id", table_name="whitelist_applications")
    op.drop_index("ix_whitelist_applications_email", table_name="whitelist_applications")
    op.drop_table("whitelist_applications")
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
