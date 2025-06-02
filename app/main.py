from fastapi import APIRouter, FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta
from app.models import Base, User
from app.schemas import UserCreate, UserResponse
from app.database import get_db
from app.auth import (
    get_password_hash,
    create_access_token,
    get_current_user,
    verify_password
)
from app.config import settings
from app.models import User
app = FastAPI(prefix="/api")
# Шаблоны и статические файлы
templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Настройки CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/test-create-user")
async def test_create_user(email: str, password: str, db: AsyncSession = Depends(get_db)):
    hashed_pwd = get_password_hash(password)
    new_user = User(email=email, hashed_password=hashed_pwd)
    db.add(new_user)
    await db.commit()
    return {"status": "ok"}

@app.get("/healthcheck")
async def healthcheck():
    return {"status": "API is working"}

@app.get("/test-db")
async def test_db_connection(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(text("SELECT 1"))
        return JSONResponse(
            status_code=200,
            content={"status": "success", "result": result.scalar()}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "detail": str(e)}
        )

@app.post("/user")
async def create_user(name: str, email: str, db: AsyncSession = Depends(get_db)):
    new_user = User(name=name, email=email)
    db.add(new_user)
    await db.commit()
    return {"status": "success", "id": new_user.id}

@app.post("/register")
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    existing_user = await db.execute(select(User).where(
        (User.email == user.email) | (User.username == user.username)
    ))
    if existing_user.scalar():
        raise HTTPException(
            status_code=400,
            detail="Email or username already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user

@app.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/user/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
# Эндпоинты аутентификации
@app.post("/register")
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    existing_user = await db.execute(select(User).where(
        (User.email == user.email) | (User.username == user.username)
    ))
    if existing_user.scalar():
        raise HTTPException(
            status_code=400,
            detail="Email or username already registered"  # Более ясное сообщение
        )
    # Создание нового пользователя
    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user

@app.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

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

# Создаем отдельный роутер для аутентификации
auth_router = APIRouter(prefix="/auth")

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    confirm_password: str

class UserRegister(UserCreate):
    confirm_password: str  # Добавляем поле подтверждения пароля
    
@auth_router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserRegister, 
    db: AsyncSession = Depends(get_db)
):
    try:
        # Проверка совпадения паролей (если нужно)
        if user_data.password != user_data.confirm_password:
            raise HTTPException(
                status_code=400,
                detail="Пароли не совпадают"
            )

        # Проверка существующего пользователя
        existing_user = await db.execute(
            select(User).where(
                (User.email == user_data.email) | 
                (User.username == user_data.username)
            )
        )
        if existing_user.scalar():
            raise HTTPException(
                status_code=400,
                detail="Email или имя пользователя уже заняты"
            )

        # Создание пользователя
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        return {
            "status": "success",
            "message": "Пользователь успешно зарегистрирован",
            "user": {
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
# Регистрируем роутер
app.include_router(auth_router)

@auth_router.post("/login")
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return {
        "token": access_token,
        "user": {
            "email": user.email,
            "username": user.username
        }
    }
@app.get("/api/healthcheck")
async def healthcheck():
    return {"status": "ok"}
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
@auth_router.get("/validate-token")
async def validate_token(current_user: User = Depends(get_current_user)):
    return {
        "user": {
            "email": current_user.email,
            "username": current_user.username
        }
    }
@app.exception_handler(404)
async def not_found(request: Request, exc):
    return templates.TemplateResponse("404.html", {"request": request}, status_code=404)

