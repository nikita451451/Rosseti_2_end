# app/auth.py
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User
from app.database import get_db

# Настройки безопасности
SECRET_KEY = "your-secret-key"  # Замените на реальный секретный ключ
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def authenticate_user(username: str, password: str, db: AsyncSession):
    """Аутентификация пользователя"""
    result = await db.execute(select(User).where(User.email == username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def verify_password(plain_password: str, hashed_password: str):
    """Проверка пароля"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    """Хеширование пароля"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Создание JWT токена"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Получение текущего пользователя из токена"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось подтвердить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return await authenticate_user(username, "", db) or credentials_exception
    except JWTError:
        raise credentials_exception
async def authenticate_user(username: str, password: str, db: AsyncSession):
    try:
        result = await db.execute(
            select(User)
            .where(User.email == username)
            .limit(1)
        )
        user = result.scalar_one_or_none()
        return user if user and verify_password(password, user.hashed_password) else None
    except Exception:
        return None
# Экспортируем только нужные функции
__all__ = [
    'authenticate_user',
    'verify_password',
    'get_password_hash',
    'create_access_token',
    'get_current_user',
    'oauth2_scheme'
]
