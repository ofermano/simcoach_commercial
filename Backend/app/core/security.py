"""JWT and password hashing."""
import logging
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def _base_payload() -> dict:
    """Common claims so tokens cannot be reused by another app or modified."""
    now = datetime.now(timezone.utc)
    return {
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "iat": int(now.timestamp()),
    }


def create_access_token(sub: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        **_base_payload(),
        "sub": str(sub),
        "email": email,
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_super_admin_token(username: str) -> str:
    """JWT for super admin; includes role so admin routes can require it."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        **_base_payload(),
        "sub": username,
        "role": "super_admin",
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def _audience_matches(payload_aud, expected: str) -> bool:
    """JWT aud can be string or list of strings."""
    if payload_aud is None:
        return False
    if isinstance(payload_aud, str):
        return payload_aud == expected
    return expected in payload_aud


def decode_access_token(token: str) -> dict | None:
    """Decode and verify signature and expiry. If iss/aud present, validate them ourselves."""
    try:
        # Let the library verify signature and exp only; we check iss/aud ourselves (handles string or list aud)
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
            options={"verify_aud": False},
        )
        # Enforce authority only when claims are present (old tokens without them still work)
        if "iss" in payload and payload["iss"] != settings.jwt_issuer:
            return None
        if "aud" in payload and not _audience_matches(payload["aud"], settings.jwt_audience):
            return None
        return payload
    except JWTError as e:
        logger.debug("JWT decode failed: %s", e)
        return None
    except Exception as e:
        # e.g. wrong key type, algorithm issues; log so you can see why decode fails vs jwt.io
        logger.warning("Token decode error: %s", e, exc_info=True)
        return None
