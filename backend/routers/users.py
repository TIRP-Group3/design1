from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from models.user import User
from schemas.user import UserCreate, UserLogin, UserShow
from utils.hash import hash_password, verify_password, create_access_token, decode_access_token
from database import SessionLocal

router = APIRouter(prefix="/users", tags=["Users"])

# Dependency to get the database session
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function to extract the JWT token from the Authorization header
def get_token(authorization: str = Header(...)) -> str:
    if authorization.startswith("Bearer "):
        return authorization.split(" ")[1]
    raise HTTPException(status_code=401, detail="Token missing or invalid")

@router.post("/register", response_model=UserShow)
def register_user(request: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == request.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = User(
        username=request.username,
        email=request.email,
        password=hash_password(request.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login_user(request: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Generate JWT token
    token = create_access_token(data={"sub": user.username})
    return {"message": "Login successful", "token": token}

# Route to get current user's info, protected by JWT
@router.get("/me", response_model=UserShow)
def get_current_user(token: str = Depends(get_token), db: Session = Depends(get_db)):
    # Decode the JWT token
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Extract username from token payload
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    # Fetch user from database
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user
