"""Application configuration via environment variables."""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "AI Service"
    VERSION: str = "0.1.0"
    DEBUG: bool = True

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:5000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
