"""Application configuration from environment variables."""
from pydantic import field_validator
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """App settings loaded from env."""

    # App
    app_name: str = "Flow Simulation API"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/flow_simulation"
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_timeout: int = 30  # seconds
    db_pool_recycle: int = 1800  # seconds

    @field_validator("database_url", mode="before")
    @classmethod
    def strip_database_url_key(cls, v: str) -> str:
        """If .env or env var was pasted as 'DATABASE_URL=postgresql+...', use only the URL."""
        if isinstance(v, str) and v.strip().upper().startswith("DATABASE_URL="):
            return v.split("=", 1)[1].strip()
        return v

    # JWT (iss/aud bind token to this app; signature prevents modification)
    secret_key: str = "change-me-in-production-use-long-random-string"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    jwt_issuer: str = "flow-simulation-api-beta"   # iss claim – must match tokens you issue
    jwt_audience: str = "flow-simulation"           # aud claim – who the token is for

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""

    # Email (SMTP) - for sending whitelist approval / signup emails
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    mail_from: str = "noreply@flowsimulation.com"
    frontend_signup_url: str = "http://localhost:3000/signup"  # link in email: {frontend_signup_url}?token=...

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
