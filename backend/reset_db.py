# reset_db.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from database import engine, SessionLocal, Base
from models.user import User
from models.role import Role  # Assuming you have a Role model
from models.predict import PredictionHistory
from models.predict import ScanSession

# 1. Drop all tables safely by disabling foreign key checks
def drop_and_recreate_tables():
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        Base.metadata.drop_all(bind=engine)
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))

    Base.metadata.create_all(bind=engine)

# 2. Seed initial roles
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
    drop_and_recreate_tables()
    seed_roles()
    print("Database reset and roles seeded.")
