from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from . import models
# Создаём базовый класс для всех моделей
Base = declarative_base()

# Настроим строку подключения
DATABASE_URL = "postgresql://postgres:password@localhost:5433/rosseti_db"

# Создание движка для базы данных
engine = create_engine(DATABASE_URL, echo=True)

# Создание сессии для работы с БД
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Функция для получения сессии
def get_db() -> Session: # type: ignore
# database.py
    from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()