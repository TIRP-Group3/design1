# backend/models/user.py
from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True)
    password = Column(String(255))

    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)  # Foreign key to roles table
    role = relationship("Role", back_populates="users")  # Establishes relationship

    predictions = relationship("PredictionHistory", back_populates="user", cascade="all, delete-orphan")
