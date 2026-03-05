"""Whitelist application and approval logic."""
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.whitelist import WhitelistApplication, WhitelistStatus
from app.config import get_settings

settings = get_settings()


async def apply_for_whitelist(
    db: AsyncSession,
    email: str,
    google_id: str | None = None,
) -> WhitelistApplication:
    """Create or return existing pending whitelist application."""
    existing = (
        await db.execute(
            select(WhitelistApplication)
            .where(WhitelistApplication.email == email)
            .where(WhitelistApplication.status == WhitelistStatus.PENDING.value)
        )
    ).scalar_one_or_none()
    if existing:
        if google_id and not existing.google_id:
            existing.google_id = google_id
            await db.flush()
        return existing

    app = WhitelistApplication(email=email, google_id=google_id, status=WhitelistStatus.PENDING.value)
    db.add(app)
    await db.flush()
    return app


async def get_application_by_email(db: AsyncSession, email: str) -> WhitelistApplication | None:
    """Get latest application for email."""
    result = (
        await db.execute(
            select(WhitelistApplication)
            .where(WhitelistApplication.email == email)
            .order_by(WhitelistApplication.applied_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    return result


async def approve_application(
    db: AsyncSession, application_id: int
) -> tuple[bool, str, str | None, str | None]:
    """
    Approve whitelist application: create User (whitelisted), generate signup token,
    send email with signup link. Returns (success, message).
    """
    result = await db.execute(
        select(WhitelistApplication).where(WhitelistApplication.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        return False, "Application not found", None, None
    if app.status != WhitelistStatus.PENDING.value:
        return False, f"Application already {app.status}", None, None

    app.status = WhitelistStatus.APPROVED.value
    app.reviewed_at = datetime.now(timezone.utc)
    app.signup_token = WhitelistApplication.generate_signup_token()
    app.signup_token_expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    # Ensure user exists and is whitelisted (for Google they may already exist)
    user_result = await db.execute(select(User).where(User.email == app.email))
    user = user_result.scalar_one_or_none()
    if not user:
        user = User(
            email=app.email,
            hashed_password=None,
            provider="email",
            google_id=app.google_id,
            is_whitelisted=True,
        )
        db.add(user)
    else:
        user.is_whitelisted = True
        if app.google_id and not user.google_id:
            user.google_id = app.google_id

    await db.flush()

    signup_link = f"{settings.frontend_signup_url}?token={app.signup_token}"
    return True, "Approved and signup email sent.", app.email, signup_link


async def deny_application(db: AsyncSession, application_id: int) -> tuple[bool, str]:
    """Deny whitelist application."""
    result = await db.execute(
        select(WhitelistApplication).where(WhitelistApplication.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        return False, "Application not found"
    if app.status != WhitelistStatus.PENDING.value:
        return False, f"Application already {app.status}"
    app.status = WhitelistStatus.DENIED.value
    app.reviewed_at = datetime.now(timezone.utc)
    return True, "Application denied."


async def get_pending_applications(db: AsyncSession) -> list[WhitelistApplication]:
    """List all pending whitelist applications."""
    result = await db.execute(
        select(WhitelistApplication)
        .where(WhitelistApplication.status == WhitelistStatus.PENDING.value)
        .order_by(WhitelistApplication.applied_at.desc())
    )
    return list(result.scalars().all())


async def resend_signup_link(
    db: AsyncSession, email: str
) -> tuple[bool, str, str | None, str | None]:
    """
    Resend signup email for an approved application that still has a valid token.
    Returns (success, message).
    """
    app = (
        await db.execute(
            select(WhitelistApplication)
            .where(WhitelistApplication.email == email.lower())
            .where(WhitelistApplication.status == WhitelistStatus.APPROVED.value)
            .where(WhitelistApplication.signup_token.isnot(None))
            .where(WhitelistApplication.signup_token_expires_at > datetime.now(timezone.utc))
            .order_by(WhitelistApplication.reviewed_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if not app:
        return False, "No valid signup link found for this email. Please contact support.", None, None
    signup_link = f"{settings.frontend_signup_url}?token={app.signup_token}"
    return True, "Signup link sent. Check your email.", app.email, signup_link


async def create_direct_invite(
    db: AsyncSession,
    email: str,
) -> tuple[bool, str, str | None, str | None]:
    """
    Create a direct whitelist invite for the given email:
      - Mark / create the user as whitelisted.
      - Create an approved WhitelistApplication with a fresh signup token.
      - Return (success, message, email, signup_link).

    This is used by the super admin to onboard drivers without a public
    "Join Beta" application.
    """
    normalized_email = email.strip().lower()
    if not normalized_email:
        return False, "Email is required", None, None

    # If the user already has a password-based account, don't create a new invite.
    user_result = await db.execute(select(User).where(User.email == normalized_email))
    user = user_result.scalar_one_or_none()
    if user and user.hashed_password:
        return False, "User already has an account", None, None

    now = datetime.now(timezone.utc)

    # Create an approved whitelist application with a new signup token.
    app = WhitelistApplication(
        email=normalized_email,
        status=WhitelistStatus.APPROVED.value,
        applied_at=now,
        reviewed_at=now,
        signup_token=WhitelistApplication.generate_signup_token(),
        signup_token_expires_at=now + timedelta(days=7),
    )
    db.add(app)

    # Ensure user exists and is marked whitelisted.
    if not user:
        user = User(
            email=normalized_email,
            hashed_password=None,
            provider="email",
            is_whitelisted=True,
        )
        db.add(user)
    else:
        user.is_whitelisted = True

    await db.flush()

    signup_link = f"{settings.frontend_signup_url}?token={app.signup_token}"
    return True, "Invite created and signup email sent.", app.email, signup_link
