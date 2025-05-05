# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
# Database connection URL
SQLALCHEMY_DATABASE_URL = "mysql+mysqlconnector://root:@localhost:3306/dbmalware"

# Create an engine
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"charset": "utf8mb4"})

# Create a SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

