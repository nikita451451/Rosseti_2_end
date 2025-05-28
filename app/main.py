# main.py 
import os
import logging
from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordBearer
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


# Настройка логгирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Конфигурация (лучше вынести в config.py или .env)
class Config:
    DATABASE_URL = "postgresql://postgres:123@localhost:5433/rosseti_db"
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 1440

from fastapi import FastAPI

app = FastAPI()
# Указываем папку с шаблонами
templates = Jinja2Templates(directory="app/templates")

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

app.mount(
    "/static",
    StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")),
    name="static"
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Подключение к БД
engine = create_engine(Config.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Модель пользователя
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
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
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


