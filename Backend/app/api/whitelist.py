"""Whitelist application endpoint: apply for whitelisting and check status."""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.whitelist import (
    WhitelistApplyRequest,
    WhitelistApplyResponse,
    WhitelistCheckResponse,
)
from app.services.whitelist_service import apply_for_whitelist
from app.core.oauth import verify_google_id_token
from app.core.email import send_whitelist_applied_confirmation_email
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/whitelist", tags=["whitelist"])


@router.post("/apply", response_model=WhitelistApplyResponse)
async def apply(
    body: WhitelistApplyRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Apply for whitelisting. Provide email; optionally provide Google id_token to link
    your Google account (so you can later sign in with Google once approved).
    """
    google_id = None
    if body.id_token:
        payload = await verify_google_id_token(body.id_token)
        if payload and payload.get("email_verified"):
            # Optionally ensure email matches
            if payload.get("email") and payload["email"].lower() != body.email.lower():
                raise HTTPException(
                    status_code=400,
                    detail="Email does not match Google account",
                )
            google_id = payload.get("sub")

    application = await apply_for_whitelist(db, body.email.lower(), google_id=google_id)
    # Optional: confirm receipt by email in the background (does not fail if SMTP is down)
    background_tasks.add_task(
        send_whitelist_applied_confirmation_email,
        body.email.lower(),
    )
    return WhitelistApplyResponse(
        message="Application received. You will be notified by email once reviewed.",
        status=application.status,
    )


@router.get("/check", response_model=WhitelistCheckResponse)
async def check(
    current_user: User = Depends(get_current_user),
):
    """Check if the authenticated user is whitelisted (has approved access)."""
    return WhitelistCheckResponse(isWhitelisted=current_user.is_whitelisted)
