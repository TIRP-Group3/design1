# backend/routers/user.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from schemas.user import UserCreate, UserOut
from models.user import User
from database import get_db

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=user.password  # Hash this in real code!
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
