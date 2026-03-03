"""Google OAuth token verification."""
import time
from typing import Any

import httpx

from app.config import get_settings

settings = get_settings()
GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v3/userinfo"
GOOGLE_TOKEN_INFO = "https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"

# Simple in-process cache for recent verifications to avoid repeated HTTP calls
_token_cache: dict[str, tuple[float, dict[str, Any] | None]] = {}
_TOKEN_CACHE_TTL_SECONDS = 30.0
_http_client: httpx.AsyncClient | None = None


def _get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient()
    return _http_client


async def verify_google_id_token(id_token: str) -> dict | None:
    """
    Verify Google ID token and return payload with email, sub (google id).
    Returns None if invalid.
    """
    if not settings.google_client_id:
        return None

    now = time.time()
    cached = _token_cache.get(id_token)
    if cached:
        ts, payload = cached
        if now - ts < _TOKEN_CACHE_TTL_SECONDS:
            return payload

    client = _get_http_client()
    try:
        r = await client.get(GOOGLE_TOKEN_INFO.format(id_token=id_token))
        r.raise_for_status()
        data = r.json()
        if data.get("aud") != settings.google_client_id:
            payload: dict[str, Any] | None = None
        else:
            payload = {
                "email": data.get("email"),
                "sub": data.get("sub"),  # Google user id
                "email_verified": data.get("email_verified") == "true",
            }
        _token_cache[id_token] = (now, payload)
        return payload
    except (httpx.HTTPError, KeyError):
        _token_cache[id_token] = (now, None)
        return None
