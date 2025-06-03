from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Определите ВСЕ переменные, которые у вас есть в .env
    DATABASE_URL: str = "postgresql+asyncpg://postgres:123@localhost:5433/rosseti_db"
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    SMTP_SERVER: str = "smtp.example.com"
    SMTP_USERNAME: str = "email@example.com"
    SMTP_PASSWORD: str = "password"
    SMTP_PORT: int = 587

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        extra = 'ignore'  # Добавьте эту строку, чтобы игнорировать лишние переменные

settings = Settings()
