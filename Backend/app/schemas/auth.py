"""Auth-related Pydantic schemas."""
from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str  # user id
    email: str
    exp: int | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    """Frontend sends the Google ID token from credential response."""
    id_token: str


class SignupRequest(BaseModel):
    """Used when admin creates account or optional flow."""
    email: EmailStr
    password: str


class SignupWithTokenRequest(BaseModel):
    """Signup using the one-time token from whitelist approval email."""
    token: str
    password: str


class SignupGoogleWithTokenRequest(BaseModel):
    """Complete signup with Google using the one-time token from approval email."""
    token: str
    id_token: str


class UserResponse(BaseModel):
    id: int
    email: str
    provider: str
    is_whitelisted: bool
    is_active: bool

    class Config:
        from_attributes = True


class CheckEmailRequest(BaseModel):
    email: EmailStr


class CheckEmailResponse(BaseModel):
    isWhitelisted: bool
    hasAccount: bool


class ProvidersResponse(BaseModel):
    google: bool


class ResendSignupLinkRequest(BaseModel):
    email: EmailStr


# Super admin (email code login)
class SuperAdminRequestCodeRequest(BaseModel):
    username: str
    password: str


class SuperAdminVerifyCodeRequest(BaseModel):
    username: str
    code: str


class SuperAdminRequestCodeResponse(BaseModel):
    message: str
