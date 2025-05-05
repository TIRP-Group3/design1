# backend/schemas/user.py
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserShow(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True
