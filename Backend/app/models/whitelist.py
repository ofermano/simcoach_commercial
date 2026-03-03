"""Whitelist application and signup token storage."""
from sqlalchemy import String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum
import secrets

from app.database import Base


class WhitelistStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"


class WhitelistApplication(Base):
    __tablename__ = "whitelist_applications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    google_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)  # if applied with Google
    status: Mapped[str] = mapped_column(String(20), default=WhitelistStatus.PENDING.value, nullable=False)
    applied_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # One-time token for email signup link (set when approved, consumed when user sets password)
    signup_token: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True, index=True)
    signup_token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<WhitelistApplication {self.email} {self.status}>"

    @staticmethod
    def generate_signup_token() -> str:
        return secrets.token_urlsafe(32)
