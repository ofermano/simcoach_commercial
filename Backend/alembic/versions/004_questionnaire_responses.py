"""add questionnaire_responses table and user.display_name

Revision ID: 004
Revises: 003
Create Date: 2026-03-01 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("display_name", sa.String(length=255), nullable=True))

    op.create_table(
        "questionnaire_responses",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("driving_level", sa.String(length=50), nullable=False),
        sa.Column("goal", sa.String(length=50), nullable=False),
        sa.Column("driving_style", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(
        "ix_questionnaire_responses_user_id_created_at",
        "questionnaire_responses",
        ["user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_questionnaire_responses_user_id_created_at", table_name="questionnaire_responses")
    op.drop_table("questionnaire_responses")
    op.drop_column("users", "display_name")

