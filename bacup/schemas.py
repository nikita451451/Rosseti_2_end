from __future__ import annotations
from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_active: bool

class Token(BaseModel):
    access_token: str
    token_type: str

class MeterBase(BaseModel):
    number: str
    type: str
    installed_at: date

class MeterCreate(MeterBase):
    pass

class Meter(MeterBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True

class ReadingBase(BaseModel):
    meter_id: int
    value: Decimal
    date: Optional[date] = None

class ReadingCreate(ReadingBase):
    pass

class Reading(ReadingBase):
    id: int
    
    class Config:
        from_attributes = True
