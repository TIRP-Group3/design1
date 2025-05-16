from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from models.train import train_model, TrainingSession
from sqlalchemy.orm import Session
from database import SessionLocal
from models.user import User
from routers.users import get_current_user

import os
import pandas as pd
import uuid

router = APIRouter(prefix="/datasets", tags=["Datasets"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Save uploaded file to disk
        os.makedirs("uploaded_files", exist_ok=True)
        file_path = f"uploaded_files/{file.filename}"
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Read CSV
        df = pd.read_csv(file_path)

        # Generate unique filenames for model/encoder
        unique_id = str(uuid.uuid4())[:8]
        model_name = f"model_{unique_id}.pkl"
        encoder_name = f"encoder_{unique_id}.pkl"
        os.makedirs("saved_models", exist_ok=True)

        # Train model
        accuracy = train_model(df, model_name, encoder_name)

        # Save training session metadata
        session = TrainingSession(
            filename=file.filename,
            model_path=f"saved_models/{model_name}",
            accuracy=accuracy,
            uploaded_by=current_user.id  # assumes auth required
        )
        db.add(session)
        db.commit()

        return {
            "message": "Model trained successfully",
            "accuracy": accuracy,
            "session_id": session.id
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/training-sessions")
def list_training_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only show all if admin, else show user's own
    if current_user.role.name.lower() == "admin":
        sessions = db.query(TrainingSession).all()
    else:
        sessions = db.query(TrainingSession).filter(TrainingSession.uploaded_by == current_user.id).all()

    results = []
    for s in sessions:
        results.append({
            "id": s.id,
            "filename": s.filename,
            "accuracy": s.accuracy,
            "model_path": s.model_path,
            "uploaded_at": s.uploaded_at.isoformat(),
            "uploaded_by": s.user.username if s.user else None
        })

    return results