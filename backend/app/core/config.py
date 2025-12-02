from pydantic_settings import BaseSettings
from typing import List, Optional
from pathlib import Path
from dotenv import load_dotenv

# Ensure .env is loaded once for all modules
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env", override=False)


class Settings(BaseSettings):
    PROJECT_NAME: str = "GTM Pattern Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "gtm_pattern_engine"
    DATABASE_URL: Optional[str] = None
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Google AI
    GOOGLE_API_KEY: str = ""
    GEN_ADVANCED_MODEL: str = "gemini-2.0-flash-exp"
    GEN_FAST_MODEL: str = "gemini-2.0-flash-exp"
    
    # External APIs
    CRUNCHBASE_API_KEY: Optional[str] = None
    LINKEDIN_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    USE_REAL_LLM: bool = False
    
    # Agent Settings
    MAX_COMPANIES_TO_ANALYZE: int = 15
    MAX_LEADS_TO_GENERATE: int = 50
    PATTERN_CONFIDENCE_THRESHOLD: float = 0.7
    LEAD_QUALITY_THRESHOLD: float = 0.6
    
    # Processing
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Parse BACKEND_CORS_ORIGINS from string if needed
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            self.BACKEND_CORS_ORIGINS = [
                origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")
            ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
