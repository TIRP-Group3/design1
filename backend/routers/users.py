from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from models.user import User
from schemas.user import UserCreate, UserLogin, UserShow
from utils.hash import hash_password, verify_password, create_access_token, decode_access_token
from database import SessionLocal
from models.role import Role


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
    # Check if username is taken
    existing = db.query(User).filter(User.username == request.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Fetch the default role
    default_role = db.query(Role).filter(Role.name == "User").first()
    if not default_role:
        raise HTTPException(status_code=500, detail="Default role 'User' not found")

    # Create new user with default role
    new_user = User(
        username=request.username,
        email=request.email,
        password=hash_password(request.password),
        role_id=default_role.id  # 👈 Assign default role
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
    return {"message": "Login successful", "token": token,'user':user,'role':user.role.name}

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

@router.put("/update-role/{user_id}")
def update_user_role(
    user_id: int,
    role_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_role = db.query(Role).filter(Role.name.ilike(role_name)).first()
    if not new_role:
        raise HTTPException(status_code=400, detail="Invalid role name")

    user.role_id = new_role.id
    db.commit()
    return {"message": "Role updated successfully"}

@router.get("/all")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name.lower() != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    users = db.query(User).all()
    results = []
    for u in users:
        results.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": {
                "id": u.role.id if u.role else None,
                "name": u.role.name if u.role else "Unknown"
            }
        })
    return results