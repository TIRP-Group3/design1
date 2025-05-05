# backend/main.py
from fastapi import FastAPI
from routers import user
from routers import file_upload
from database import Base, engine

app = FastAPI()

# Create all the tables in the database
Base.metadata.create_all(bind=engine)

# Include routers for user and file upload
app.include_router(user.router)
app.include_router(file_upload.router)
