"""Super admin auth: request 6-digit code by email, verify code and return JWT."""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.auth import (
    SuperAdminRequestCodeRequest,
    SuperAdminRequestCodeResponse,
    SuperAdminVerifyCodeRequest,
    Token,
)
from app.services.super_admin_service import request_login_code, verify_login_code
from app.core.email import send_super_admin_code_email
from app.core.security import create_super_admin_token

router = APIRouter(prefix="/admin/super-admin", tags=["super-admin"])


@router.post("/request-code", response_model=SuperAdminRequestCodeResponse)
async def request_code(
    body: SuperAdminRequestCodeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Step 1: Send 6-digit login code to super admin email. Requires username and password."""
    success, message, email, code = await request_login_code(db, body.username, body.password)
    if not success:
        raise HTTPException(status_code=401, detail=message)
    if email and code:
        background_tasks.add_task(send_super_admin_code_email, email, code)
    return SuperAdminRequestCodeResponse(message=message)


@router.post("/verify-code", response_model=Token)
async def verify_code(
    body: SuperAdminVerifyCodeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Step 2: Verify 6-digit code and return admin JWT."""
    admin = await verify_login_code(db, body.username, body.code)
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid or expired code")
    return Token(access_token=create_super_admin_token(admin.username))
