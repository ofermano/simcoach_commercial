"""Auth endpoints: login (email + Google), signup with token."""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.schemas.auth import (
    Token,
    LoginRequest,
    GoogleLoginRequest,
    SignupWithTokenRequest,
    SignupGoogleWithTokenRequest,
    UserResponse,
    CheckEmailRequest,
    CheckEmailResponse,
    ProvidersResponse,
    ResendSignupLinkRequest,
)
from app.services import auth_service
from app.services.whitelist_service import resend_signup_link
from app.core.email import send_whitelist_approved_email
from app.core.security import create_access_token
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])
_settings = get_settings()


@router.post("/login", response_model=Token)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login with email and password. Allowed only for whitelisted users."""
    user = await auth_service.login_email(db, body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials or not whitelisted")
    return Token(access_token=create_access_token(str(user.id), user.email))


@router.post("/google", response_model=Token)
async def login_google(
    body: GoogleLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login with Google ID token. Allowed only for whitelisted users."""
    user = await auth_service.login_google(db, body.id_token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid Google token or not whitelisted")
    return Token(access_token=create_access_token(str(user.id), user.email))


@router.post("/signup", response_model=Token)
async def signup_with_token(
    body: SignupWithTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Complete signup using the one-time token from the whitelist approval email.
    Sets password and returns access token.
    """
    user = await auth_service.signup_with_token(db, body.token, body.password)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired signup token")
    return Token(access_token=create_access_token(str(user.id), user.email))


@router.post("/signup-google-with-token", response_model=Token)
async def signup_google_with_token(
    body: SignupGoogleWithTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Complete signup with Google using the one-time token from the approval email.
    Validates token and Google id_token; Google email must match the approved application.
    """
    user = await auth_service.signup_with_token_google(db, body.token, body.id_token)
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired signup token, or Google email does not match approved application",
        )
    return Token(access_token=create_access_token(str(user.id), user.email))


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Return current authenticated user."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        provider=current_user.provider,
        is_whitelisted=current_user.is_whitelisted,
        is_active=current_user.is_active,
    )


@router.get("/providers", response_model=ProvidersResponse)
async def providers():
    """Return available auth providers (e.g. Google) for the frontend."""
    return ProvidersResponse(google=bool(_settings.google_client_id))


@router.post("/check-email", response_model=CheckEmailResponse)
async def check_email(
    body: CheckEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    """Check if email is whitelisted and whether the user already has an account (password or Google)."""
    is_whitelisted, has_account = await auth_service.check_email(db, body.email)
    return CheckEmailResponse(isWhitelisted=is_whitelisted, hasAccount=has_account)


@router.post("/logout", status_code=204)
async def logout():
    """Logout (client should discard token). No server-side session."""
    return None


@router.post("/resend-signup-link")
async def resend_signup(
    body: ResendSignupLinkRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Resend the signup link email for an approved whitelist application."""
    success, message, email, signup_link = await resend_signup_link(db, body.email)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    if email and signup_link:
        background_tasks.add_task(send_whitelist_approved_email, email, signup_link)
    return {"message": message}
