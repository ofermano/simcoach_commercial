"""Super admin: request 6-digit code, verify code and issue JWT."""
import random
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.concurrency import run_in_threadpool

from app.models.super_admin import SuperAdmin
from app.core.security import verify_password, hash_password


def _generate_code() -> str:
    return "".join(str(random.randint(0, 9)) for _ in range(6))


async def get_super_admin_by_username(db: AsyncSession, username: str) -> SuperAdmin | None:
    result = await db.execute(
        select(SuperAdmin).where(SuperAdmin.username == username)
    )
    return result.scalar_one_or_none()


async def request_login_code(
    db: AsyncSession, username: str, password: str
) -> tuple[bool, str, str | None, str | None]:
    """
    Verify username/password, generate 6-digit code, send email, save code with expiry.
    Returns (success, message).
    """
    admin = await get_super_admin_by_username(db, username.strip())
    if not admin:
        return False, "Invalid username or password", None, None
    if not await run_in_threadpool(verify_password, password, admin.hashed_password):
        return False, "Invalid username or password", None, None

    code = _generate_code()
    admin.login_code = code
    admin.login_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    await db.flush()

    return True, "Login code sent to your email.", admin.email, code


async def verify_login_code(db: AsyncSession, username: str, code: str) -> SuperAdmin | None:
    """If code matches and not expired, clear code and return super admin."""
    admin = await get_super_admin_by_username(db, username.strip())
    if not admin or not admin.login_code or not admin.login_code_expires_at:
        return None
    if admin.login_code != code.strip():
        return None
    if admin.login_code_expires_at < datetime.now(timezone.utc):
        return None

    admin.login_code = None
    admin.login_code_expires_at = None
    await db.flush()
    return admin
