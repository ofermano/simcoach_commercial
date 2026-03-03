"""Update super admin email and password from env (optional).

Revision ID: 003
Revises: 002
Create Date: 2025-03-01

If SUPER_ADMIN_EMAIL and/or SUPER_ADMIN_PASSWORD are set in the environment,
updates the existing admin row (username=admin). Run after 002 to change
credentials without editing the DB by hand.
"""
import os
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from passlib.context import CryptContext

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    email = os.environ.get("SUPER_ADMIN_EMAIL", "").strip()
    raw_password = os.environ.get("SUPER_ADMIN_PASSWORD", "").strip()

    if not email and not raw_password:
        return  # nothing to update

    conn = op.get_bind()

    if email and raw_password:
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed = pwd_context.hash(raw_password)
        conn.execute(
            sa.text(
                "UPDATE super_admins SET email = :email, hashed_password = :hashed "
                "WHERE username = 'admin'"
            ),
            {"email": email, "hashed": hashed},
        )
    elif email:
        conn.execute(
            sa.text("UPDATE super_admins SET email = :email WHERE username = 'admin'"),
            {"email": email},
        )
    else:
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed = pwd_context.hash(raw_password)
        conn.execute(
            sa.text(
                "UPDATE super_admins SET hashed_password = :hashed WHERE username = 'admin'"
            ),
            {"hashed": hashed},
        )


def downgrade() -> None:
    # No automatic rollback of credentials
    pass
