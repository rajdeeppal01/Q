"""
Q Backend Configuration
Loads environment variables and provides typed settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Q"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://neondb_owner:npg_DU8jW0ErJNli@ep-polished-unit-axyqhvt0-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"

    # Auth
    SECRET_KEY: str = "change-me-in-production-use-a-real-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # AI
    GEMINI_API_KEY: Optional[str] = None

    # Rate Limiting
    RATE_LIMIT_DEFAULT: str = "60/minute"
    RATE_LIMIT_AUTH: str = "10/minute"
    RATE_LIMIT_EVENTS: str = "500/minute"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
