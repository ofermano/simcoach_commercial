"""Whitelist application schemas."""
from datetime import datetime
from pydantic import BaseModel, EmailStr


class WhitelistApplyRequest(BaseModel):
    """Apply for whitelist: either email only, or email + Google id_token to link Google account."""
    email: EmailStr
    id_token: str | None = None  # If provided, we verify and store google_id


class WhitelistApplyResponse(BaseModel):
    message: str
    status: str = "pending"


class WhitelistApplicationResponse(BaseModel):
    id: int
    email: str
    status: str
    applied_at: datetime

    class Config:
        from_attributes = True


class WhitelistCheckResponse(BaseModel):
    isWhitelisted: bool
