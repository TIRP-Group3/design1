from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from database import SessionLocal
from models.user import User
from utils.hash import decode_access_token  # Now using the function from hash.py

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency to get the current user from the JWT token
def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)) -> User:
    try:
        # Decode the JWT token using the helper from hash.py
        payload = decode_access_token(token)
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Fetch user from the database
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Dependency to check user role
def role_required(role_name: str):
    def wrapper(user: User = Depends(get_current_user)):
        if user.role is None or user.role.name.lower() != role_name.lower():
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return wrapper
