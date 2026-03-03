"""Auth: login, signup, and current user resolution."""
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.concurrency import run_in_threadpool

from app.models.user import User
from app.models.whitelist import WhitelistApplication, WhitelistStatus
from app.core.security import verify_password, hash_password, create_access_token
from app.core.oauth import verify_google_id_token


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_google_id(db: AsyncSession, google_id: str) -> User | None:
    result = await db.execute(select(User).where(User.google_id == google_id))
    return result.scalar_one_or_none()


async def check_email(db: AsyncSession, email: str) -> tuple[bool, bool]:
    """
    Return (is_whitelisted, has_account).
    has_account = user exists and has set password or has google_id.
    """
    user = await get_user_by_email(db, email.lower())
    if not user:
        return False, False
    is_whitelisted = user.is_whitelisted
    has_account = bool(user.hashed_password or user.google_id)
    return is_whitelisted, has_account


async def login_email(db: AsyncSession, email: str, password: str) -> User | None:
    """Verify email/password and whitelist; return user or None."""
    user = await get_user_by_email(db, email)
    if not user or not user.hashed_password:
        return None
    if not await run_in_threadpool(verify_password, password, user.hashed_password):
        return None
    if not user.is_whitelisted or not user.is_active:
        return None
    return user


async def login_google(db: AsyncSession, id_token: str) -> User | None:
    """Verify Google id_token, ensure user exists and is whitelisted; return user or None."""
    payload = await verify_google_id_token(id_token)
    if not payload or not payload.get("email_verified"):
        return None
    email = payload.get("email")
    google_id = payload.get("sub")
    if not email or not google_id:
        return None

    user = await get_user_by_google_id(db, google_id)
    if not user:
        user = await get_user_by_email(db, email)
    if not user:
        return None
    if not user.is_whitelisted or not user.is_active:
        return None
    # Optionally link google_id if missing
    if not user.google_id:
        user.google_id = google_id
    return user


async def signup_with_token(db: AsyncSession, token: str, password: str) -> User | None:
    """
    Complete signup using one-time token from approval email.
    Creates/updates password for the user and invalidates token.
    """
    result = await db.execute(
        select(WhitelistApplication).where(
            WhitelistApplication.signup_token == token,
            WhitelistApplication.status == WhitelistStatus.APPROVED.value,
            WhitelistApplication.signup_token_expires_at > datetime.now(timezone.utc),
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        return None

    user = await get_user_by_email(db, app.email)
    if not user:
        return None
    user.hashed_password = await run_in_threadpool(hash_password, password)
    user.provider = "email"
    app.signup_token = None
    app.signup_token_expires_at = None
    await db.flush()
    return user


async def signup_with_token_google(db: AsyncSession, token: str, id_token: str) -> User | None:
    """
    Complete signup using one-time token + Google id_token.
    Verifies token, verifies Google id_token, ensures Google email matches approved application,
    links user with google_id, invalidates signup token, returns user.
    """
    result = await db.execute(
        select(WhitelistApplication).where(
            WhitelistApplication.signup_token == token,
            WhitelistApplication.status == WhitelistStatus.APPROVED.value,
            WhitelistApplication.signup_token_expires_at > datetime.now(timezone.utc),
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        return None

    payload = await verify_google_id_token(id_token)
    if not payload or not payload.get("email_verified"):
        return None
    google_email = (payload.get("email") or "").strip().lower()
    google_id = payload.get("sub")
    if not google_email or not google_id:
        return None
    if google_email != app.email.strip().lower():
        return None

    user = await get_user_by_email(db, app.email)
    if not user:
        return None
    user.google_id = google_id
    user.provider = "google"
    app.signup_token = None
    app.signup_token_expires_at = None
    await db.flush()
    return user
