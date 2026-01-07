"""
Application configuration using Pydantic Settings.
Loads from environment variables or .env file.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/feedback_db"
    
    # OpenAI
    openai_api_key: str = ""
    
    # Rate Limiting
    rate_limit_requests: int = 10
    rate_limit_window: int = 60  # seconds
    
    # LLM Settings
    llm_timeout_seconds: int = 30
    llm_model: str = "gpt-4o-mini"
    
    # App Settings
    debug: bool = False
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
