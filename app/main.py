import contextlib
from fastapi import APIRouter, FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from jose import JWTError
import jwt
from pydantic import BaseModel
from sqlalchemy import Date, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import date, timedelta
from typing import List, Optional
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.schemas import Meter, Reading, UserCreate  

from app.models import Base, Meter as MeterModel, Reading as ReadingModel, User  # SQLAlchemy-модели
from app.schemas import MeterCreate, ReadingCreate, UserCreate, UserResponse, Meter as MeterSchema, Reading as ReadingSchema  # Pydantic-схемы
from app.database import get_db
from app.auth import (
    get_password_hash,
    create_access_token,
    get_current_user,
    get_current_optional_user,
    verify_password,
    authenticate_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.config import settings
from sqlalchemy import DECIMAL, Column, Date, ForeignKey, Integer, String, DateTime, UniqueConstraint, func
from sqlalchemy.ext.declarative import declarative_base
from bacup.auth import ALGORITHM, SECRET_KEY, oauth2_scheme

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

@app.get("/users/me", response_model=UserResponse)
async def read_user_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
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
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class UserResponse(BaseModel):
    username: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    
    class Config:
        orm_mode = True
@app.get("/users/me", response_model=UserResponse)
async def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user
@app.patch("/users/me", response_model=UserResponse)
async def update_user_me(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Обновляем только переданные поля
    for field, value in user_data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    await db.commit()
    await db.refresh(current_user)
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

async def authenticate_user(username: str, password: str, db: AsyncSession):
    result = await db.execute(select(User).where(User.email == username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user
@auth_router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    user = await authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "username": user.username,
            "email": user.email
        }
    }

# Подключите роутер один раз:
app.include_router(auth_router, prefix="/api")
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

@app.post("/api/auth/login")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # Здесь должна быть проверка пользователя в базе данных
    # Для примера используем фиктивного пользователя
    fake_user = {
        "username": "test",
        "email": "test@example.com",
        "password": get_password_hash("test")
    }
    
    if not verify_password(form_data.password, fake_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticat": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": fake_user["username"]}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "username": fake_user["username"],
            "email": fake_user["email"]
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
@app.get("/auth/validate-token")
async def validate_token(token: str = Depends(oauth2_scheme)):
    try:
        # Ваша логика валидации токена
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=400, detail="Invalid token")
        return {"valid": True}
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid token")
@app.exception_handler(404)
async def not_found(request: Request, exc):
    return templates.TemplateResponse("404.html", {"request": request}, status_code=404)
 # Меню сайта 
class MenuItem(Base):
    __tablename__ = "menu_items"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    icon = Column(String)
    path = Column(String)
    parent_id = Column(Integer, ForeignKey("menu_items.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=True)  # Добавлено новое поле
    order = Column(Integer, default=0)

class MenuItemCreate(BaseModel):
    title: str
    icon: str
    path: str
    parent_id: Optional[int] = None
    is_active: bool = True
    order: int = 0

class MenuItemResponse(BaseModel):
    id: int
    title: str
    icon: str
    path: str
    parent_id: Optional[int]
    is_active: bool
    order: int
@app.get("/debug/menu-items")
async def debug_menu_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MenuItem))
    items = result.scalars().all()
    return {"count": len(items), "items": items}
@app.get("/api/menu", response_model=List[MenuItemResponse])
async def get_menu(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_optional_user)
):
    query = select(MenuItem).where(MenuItem.is_active == True)
    
    if not current_user:
        query = query.where(MenuItem.is_public == True)
    
    result = await db.execute(query.order_by(MenuItem.order))
    items = result.scalars().all()
    return items

@app.post("/api/menu", response_model=MenuItemResponse)
async def create_menu_item(
    item: MenuItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_item = MenuItem(**item.dict())
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    return new_item

async def init_db(db: AsyncSession):
    # Проверяем, есть ли нужные таблицы
    for table in [MenuItem, MeterModel, ReadingModel]:
        try:
            await db.execute(select(table).limit(1))
        except:
            await db.run_sync(Base.metadata.create_all)

    # Инициализация меню
    result = await db.execute(select(MenuItem))
    if not result.scalars().first():
        default_menu = [
        {"title": "Личный кабинет", "icon": "fa-home", "path": "#home", "order": 1},
        {"title": "Профиль", "icon": "fa-user", "path": "#profile", "order": 2, "is_active": False},
        {"title": "Подать показания", "icon": "fa-tachometer-alt", "path": "#submitReadings", "order": 3},
        {"title": "Приборы учёта", "icon": "fa-bolt", "path": "#meters", "order": 4},
        {"title": "Проверка ИПУ", "icon": "fa-search", "path": "#checkIPU", "order": 5},
        {"title": "История начислений", "icon": "fa-history", "path": "#history", "order": 6},
        {"title": "Квитанции", "icon": "fa-file-invoice", "path": "#receipt", "order": 7},
        {"title": "Справки", "icon": "fa-file-alt", "path": "#certificate", "order": 8},
    ]
        db.add_all([MenuItem(**item) for item in default_menu])
        await db.commit()
    
    await db.commit()

@app.on_event("startup")
async def on_startup():
    # Получаем асинхронный генератор
    db_gen = get_db()
    try:
        # Получаем сессию из генератора
        db = await anext(db_gen)
        await init_db(db)
    finally:
        # Закрываем генератор
        await db_gen.aclose()

@app.get("/api/menu", response_model=List[MenuItemResponse])
async def get_menu(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_optional_user)
):
    query = select(MenuItem).where(MenuItem.is_active == True)
    
    # Если пользователь не авторизован, показываем только публичные пункты
    if not current_user:
        query = query.where(MenuItem.is_public == True)
    
    result = await db.execute(query.order_by(MenuItem.order))
    return result.scalars().all()
@app.post("/api/meters/", response_model=MeterSchema, tags=["meters"])
async def create_meter(
    meter: MeterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_meter = MeterModel(**meter.dict(), user_id=current_user.id)
    db.add(db_meter)
    await db.commit()
    await db.refresh(db_meter)
    return MeterSchema.from_orm(db_meter)

@app.get("/api/meters/", response_model=List[MeterSchema], tags=["meters"])
async def read_meters(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(MeterModel)
        .where(MeterModel.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    meters = result.scalars().all()
    return [MeterSchema.from_orm(meter) for meter in meters]

@app.get("/api/meters/{meter_id}", response_model=MeterSchema, tags=["meters"])
async def read_meter(
    meter_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(MeterModel)
        .where(MeterModel.id == meter_id)
        .where(MeterModel.user_id == current_user.id)
    )
    meter = result.scalar_one_or_none()
    if meter is None:
        raise HTTPException(status_code=404, detail="Meter not found")
    return MeterSchema.from_orm(meter)

@app.post("/api/readings/", response_model=ReadingSchema, tags=["readings"])
async def create_reading(
    reading: ReadingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meter_result = await db.execute(
        select(MeterModel)
        .where(MeterModel.id == reading.meter_id)
        .where(MeterModel.user_id == current_user.id)
    )
    if meter_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Meter not found")
    
    db_reading = ReadingModel(**reading.dict())
    db.add(db_reading)
    await db.commit()
    await db.refresh(db_reading)
    return ReadingSchema.from_orm(db_reading)

@app.get("/api/readings/", response_model=List[ReadingSchema], tags=["readings"])
async def read_readings(
    meter_id: int,
    start_date: date = None,
    end_date: date = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meter_result = await db.execute(
        select(MeterModel)
        .where(MeterModel.id == meter_id)
        .where(MeterModel.user_id == current_user.id)
    )
    if meter_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Meter not found")
    
    query = select(ReadingModel).where(ReadingModel.meter_id == meter_id)
    
    if start_date:
        query = query.where(ReadingModel.date >= start_date)
    if end_date:
        query = query.where(ReadingModel.date <= end_date)
    
    result = await db.execute(
        query
        .order_by(ReadingModel.date.desc())
        .offset(skip)
        .limit(limit)
    )
    readings = result.scalars().all()
    return [ReadingSchema.from_orm(reading) for reading in readings]
# Эндпоинты для работы с приборами учета
@app.get("/api/meters", response_model=List[Meter])
async def get_meters(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Meter).where(Meter.user_id == current_user.id))
    return result.scalars().all()

@app.post("/api/meters", response_model=Meter)
async def create_meter(
    meter: MeterCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_meter = Meter(**meter.dict(), user_id=current_user.id)
    db.add(db_meter)
    await db.commit()
    await db.refresh(db_meter)
    return db_meter

# Эндпоинты для работы с показаниями
@app.get("/api/readings", response_model=List[Reading])
async def get_readings(
    meter_id: int = None,
    start_date: date = None,
    end_date: date = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Reading)
    
    if meter_id:
        # Проверяем, что прибор принадлежит пользователю
        meter = await db.get(Meter, meter_id)
        if not meter or meter.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Meter not found")
        query = query.where(Reading.meter_id == meter_id)
    
    if start_date:
        query = query.where(Reading.date >= start_date)
    if end_date:
        query = query.where(Reading.date <= end_date)
    
    result = await db.execute(query.order_by(Reading.date.desc()))
    return result.scalars().all()

@app.post("/api/readings", response_model=Reading)
async def create_reading(
    reading: ReadingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Проверяем, что прибор принадлежит пользователю
    meter = await db.get(Meter, reading.meter_id)
    if not meter or meter.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Meter not found")
    
    db_reading = Reading(**reading.dict())
    db.add(db_reading)
    await db.commit()
    await db.refresh(db_reading)
    return db_reading

if __name__ == "__main__":
    uvicorn.run(
        app, 
        host="0.0.0.0",  # Слушаем все интерфейсы
        port=8000,
        reload=True
    )