import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "f""postgresql://postgres:123@localhost:5433/rosseti_db"
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    RESET_PASSWORD_TOKEN_EXPIRE_MINUTES: int = 30
    SMTP_SERVER: str = "smtp.example.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = "email@example.com"
    SMTP_PASSWORD: str = "password"

    class Config:
        env_file = ".env"

settings = Settings()
