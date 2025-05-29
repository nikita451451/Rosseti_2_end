# main.py 
import os
import logging
from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordBearer,HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Optional
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from starlette.status import HTTP_303_SEE_OTHER
from fastapi.responses import RedirectResponse
from fastapi import Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import validator
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker
from fastapi import Depends
from fastapi import status



# Настройка логгирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Конфигурация
class Config:
    DATABASE_URL = "postgresql://postgres:123@localhost:5433/rosseti_db"
    SECRET_KEY = "1234"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 1440
    RESET_PASSWORD_TOKEN_EXPIRE_MINUTES = 30
    SMTP_SERVER = "smtp.example.com"
    SMTP_PORT = 587
    SMTP_USERNAME = "email@example.com"
    SMTP_PASSWORD = "password"

security = HTTPBearer()
app = FastAPI()
# Указываем папку с шаблонами
templates = Jinja2Templates(directory="app/templates")

@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI with PostgreSQL!"}
# Подключаем статические файлы
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/register", response_class=HTMLResponse)
async def register(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@app.get("/login", response_class=HTMLResponse)
async def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/about", response_class=HTMLResponse)
async def about(request: Request):
    return templates.TemplateResponse("about.html", {"request": request})

@app.get("/services", response_class=HTMLResponse)
async def services(request: Request):
    return templates.TemplateResponse("services.html", {"request": request})

@app.get("/news", response_class=HTMLResponse)
async def news(request: Request):
    return templates.TemplateResponse("news.html", {"request": request})

@app.get("/forgot-password", response_class=HTMLResponse)
async def news(request: Request):
    return templates.TemplateResponse("forgot-password.html", {"request": request})

app.mount("/static", StaticFiles(directory="app/static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

@app.exception_handler(404)
async def not_found(request: Request, exc):
    return templates.TemplateResponse("404.html", {"request": request}, status_code=404)
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Подключение к БД
engine = create_engine(Config.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
router = APIRouter()

def check_db_connection():
    try:
        # Создаем подключение
        engine = create_engine(Config.DATABASE_URL)
        connection = engine.connect()
        connection.close()
        return {"status": "success", "message": "Database connection successful"}
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )
    
# Модель пользователя
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)  
    created_at = Column(DateTime, default=datetime.utcnow)
# Создаем таблицы (лучше использовать Alembic для миграций)
Base.metadata.create_all(bind=engine)

# Pydantic-модели
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Утилиты
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependency для получения сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def db_session():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        db.close()

# JWT функции
def create_access_token(data: dict):
    expires = timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + expires})
    return jwt.encode(to_encode, Config.SECRET_KEY, algorithm=Config.ALGORITHM)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    return pwd_context.hash(password)

def get_user(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def authenticate_user(db: Session, email: str, password: str):
    user = get_user(db, email)
    if not user or not verify_password(password, user.password):
        return None
    return user

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = get_user(db, email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except JWTError as e:
        logger.error(f"JWT error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

# Роуты
@app.post("/register/", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if get_user(db, user.email):
        raise HTTPException(...)
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password  # Исправлено здесь
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login/", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    authenticated_user = authenticate_user(db, user.email, user.password)
    if not authenticated_user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me/")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }

# Добавляем обработчики для форм регистрации/логина
@app.post("/register", response_class=RedirectResponse)
async def handle_register(
    request: Request,
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        # Проверяем, существует ли пользователь
        if get_user(db, email):
            return RedirectResponse("/register?error=user_exists", status_code=HTTP_303_SEE_OTHER)
        
        # Хешируем пароль и создаем пользователя
        hashed_password = get_password_hash(password)
        db_user = User(
            username=username,
            email=email,
            password=hashed_password
        )
        db.add(db_user)
        db.commit()
        
        # Создаем токен и устанавливаем куки
        access_token = create_access_token({"sub": email})
        response = RedirectResponse("/", status_code=HTTP_303_SEE_OTHER)
        response.set_cookie(key="access_token", value=f"Bearer {access_token}", httponly=True)
        return response
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return RedirectResponse("/register?error=server_error", status_code=HTTP_303_SEE_OTHER)

@app.post("/login", response_class=RedirectResponse)
async def handle_login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        user = authenticate_user(db, email, password)
        if not user:
            return RedirectResponse("/login?error=invalid_credentials", status_code=HTTP_303_SEE_OTHER)
        
        access_token = create_access_token({"sub": email})
        response = RedirectResponse("/", status_code=HTTP_303_SEE_OTHER)
        response.set_cookie(key="access_token", value=f"Bearer {access_token}", httponly=True)
        return response
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return RedirectResponse("/login?error=server_error", status_code=HTTP_303_SEE_OTHER)
@app.get("/api/healthcheck")
async def healthcheck():
    try:
        with SessionLocal() as db:
            db.execute("SELECT 1")
        return {"status": "connected"}
    except Exception as e:
        return {"status": "disconnected", "error": str(e)}

    token = credentials.credentials
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = get_user(db, email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except JWTError as e:
        # Проверяем куки, если нет токена в заголовках
        token = request.cookies.get("access_token")
        if token and token.startswith("Bearer "):
            token = token[7:]
            try:
                payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
                email = payload.get("sub")
                if not email:
                    raise HTTPException(status_code=401, detail="Invalid token")
                user = get_user(db, email)
                if not user:
                    raise HTTPException(status_code=404, detail="User not found")
                return user
            except JWTError:
                pass
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/profile", response_class=HTMLResponse)
async def profile(request: Request, current_user: User = Depends(get_current_user)):
    return templates.TemplateResponse("profile.html", {
        "request": request,
        "user": current_user
    }) 
class Config:
    RESET_PASSWORD_TOKEN_EXPIRE_MINUTES = 30
    SMTP_SERVER = "smtp.example.com"
    SMTP_PORT = 587
    SMTP_USERNAME = "email@example.com"
    SMTP_PASSWORD = "password"

# Дополнительные Pydantic модели
class ResetPasswordRequest(BaseModel):
    email: str

class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str

# Дополнительные роуты
@app.post("/forgot-password")
async def forgot_password(
    request: Request,
    email: str = Form(...),
    db: Session = Depends(get_db)
):
    user = get_user(db, email)
    if not user:
        return RedirectResponse("/forgot-password?error=user_not_found", status_code=303)
    
    reset_token = create_access_token(
        {"sub": email}, 
        expires_delta=timedelta(minutes=Config.RESET_PASSWORD_TOKEN_EXPIRE_MINUTES)
    )
    
    # Здесь должна быть отправка письма с токеном
    # send_reset_email(email, reset_token)
    
    reset_url = f"http://localhost:8000/reset-password?token={reset_token}"
    return RedirectResponse(f"/forgot-password?success=true&email={email}", status_code=303)

@app.post("/reset-password")
async def reset_password(
    request: Request,
    token: str = Form(...),
    new_password: str = Form(...),
    confirm_password: str = Form(...),
    db: Session = Depends(get_db)
):
    if new_password != confirm_password:
        return RedirectResponse(f"/reset-password?token={token}&error=password_mismatch", status_code=303)
    
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=400, detail="Invalid token")
        
        user = get_user(db, email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.password = get_password_hash(new_password)
        db.commit()
        
        return RedirectResponse("/login?password_reset=true", status_code=303)
    except JWTError:
        return RedirectResponse("/login?error=invalid_token", status_code=303)

@app.get("/reset-password", response_class=HTMLResponse)
async def reset_password_page(request: Request, token: str):
    try:
        jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
        return templates.TemplateResponse("reset-password.html", {"request": request, "token": token})
    except JWTError:
        return RedirectResponse("/login?error=invalid_token", status_code=303)
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    
    @validator('password')
    def password_complexity(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        # Дополнительные проверки
        return v
    
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
