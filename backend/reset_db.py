# reset_db.py

from sqlalchemy.orm import Session
from database import engine, SessionLocal, Base
from models.user import User
from models.role import Role  # Assuming you have a Role model

# 1. Drop all tables
Base.metadata.drop_all(bind=engine)

# 2. Recreate all tables
Base.metadata.create_all(bind=engine)

# 3. Seed initial data
def seed_roles():
    db: Session = SessionLocal()

    roles = [
        Role(name="Admin"),
        Role(name="User"),
    ]
    db.add_all(roles)
    db.commit()
    db.close()

if __name__ == "__main__":
    seed_roles()
    print("Database reset and roles seeded.")

# python reset_db.py to reset everything, for development purpose only