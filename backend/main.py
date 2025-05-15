# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users
from routers import trains
from routers import predicts
from database import Base, engine

app = FastAPI()
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Create all the tables in the database
Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "Hello from Malware Detector!"}

# Include routers for user and file upload
app.include_router(users.router)
app.include_router(trains.router)
app.include_router(predicts.router)
