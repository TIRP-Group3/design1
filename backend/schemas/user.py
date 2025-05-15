# backend/schemas/user.py
from pydantic import BaseModel, EmailStr

class UserRole(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

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
    role: UserRole  

    class Config:
        from_attributes = True
