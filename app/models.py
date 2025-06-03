from sqlalchemy import DECIMAL, Column, Date, ForeignKey, Integer, String, DateTime, UniqueConstraint, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
class Meter(Base):
    __tablename__ = "meters"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    number = Column(String(50), unique=True, nullable=False)
    type = Column(String(30), nullable=False)  # электроэнергия/вода/газ
    installed_at = Column(Date, nullable=False)

class Reading(Base):
    __tablename__ = "readings"
    
    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(Integer, ForeignKey("meters.id"))
    value = Column(DECIMAL(10, 2), nullable=False)
    date = Column(Date, nullable=False, default=func.current_date())
    
    __table_args__ = (
        UniqueConstraint('meter_id', 'date', name='_meter_date_uc'),
    )