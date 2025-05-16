import json
import joblib
import pandas as pd
from fastapi import APIRouter, File, UploadFile, Depends
import os
from typing import List
from sqlalchemy.orm import Session
from database import SessionLocal
from routers.users import get_current_user
from models.predict import PredictionHistory
from models.user import User
from models.predict import ScanSession  # new import

from models.train import TrainingSession


router = APIRouter(prefix="/datasets", tags=["Datasets"])

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def extract_features_from_file(file_bytes: bytes, filename: str) -> dict:
    return {
        "file_size": len(file_bytes),
        "extension": os.path.splitext(filename)[1].lower().replace('.', ''),
    }

@router.post("/predict-file")
async def predict_file(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get the latest training session
    latest = db.query(TrainingSession).order_by(TrainingSession.uploaded_at.desc()).first()

    if not latest:
        raise HTTPException(status_code=404, detail="No trained model found.")

    model = joblib.load(latest.model_path)
    encoder_path = latest.model_path.replace("model_", "encoder_")
    encoders = joblib.load(encoder_path)


    results = []

    # Create a scan session
    scan_session = ScanSession(user_id=current_user.id)
    db.add(scan_session)
    db.commit()
    db.refresh(scan_session)

    for file in files:
        contents = await file.read()
        try:
            features = extract_features_from_file(contents, file.filename)
            df = pd.DataFrame([features])

            for col, encoder in encoders.items():
                if col == 'target':
                    continue
                if col in df.columns:
                    df[col] = encoder.transform(df[col].astype(str))

            probs = model.predict_proba(df)[0]
            pred = model.predict(df)[0]
            target_encoder = encoders['target']
            label = target_encoder.inverse_transform([pred])[0]

            probability_dict = {
                target_encoder.inverse_transform([i])[0]: float(prob)
                for i, prob in enumerate(probs)
            }

            # Save to DB
            history_entry = PredictionHistory(
                filename=file.filename,
                prediction=label,
                probabilities=json.dumps(probability_dict),
                user_id=current_user.id,
                session_id=scan_session.id  # link to session
            )
            db.add(history_entry)
            db.commit()

            results.append({
                "filename": file.filename,
                "prediction": label,
                "probabilities": probability_dict
            })

        except Exception as e:
            results.append({
                "filename": file.filename,
                "error": f"Prediction failed: {str(e)}"
            })

    return {"session_id": scan_session.id, "results": results}

@router.get("/prediction-history")
def get_user_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Admins see all, others see only their own
    if current_user.role.name.lower() == "admin":
        records = db.query(PredictionHistory).order_by(PredictionHistory.scanned_at.desc()).all()
    else:
        records = db.query(PredictionHistory).filter(
            PredictionHistory.user_id == current_user.id
        ).order_by(PredictionHistory.scanned_at.desc()).all()

    results = []
    for r in records:
        record_dict = {
            "id": r.id,
            "filename": r.filename,
            "prediction": r.prediction,
            "scanned_at": r.scanned_at.isoformat() if r.scanned_at else None,
            "user_id": r.user_id,
            "user": {
                "id": r.user.id if r.user else None,
                "username": r.user.username if r.user else "Unknown"
            },
            "session_id": r.session_id,
            "probabilities": json.loads(r.probabilities) if isinstance(r.probabilities, str) else r.probabilities,
        }
        results.append(record_dict)

    return results

@router.get("/prediction-sessions")
def get_user_prediction_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = db.query(ScanSession).filter(ScanSession.user_id == current_user.id).order_by(ScanSession.scanned_at.desc()).all()
    data = []
    for session in sessions:
        data.append({
            "session_id": session.id,
            "scanned_at": session.scanned_at.isoformat(),
            "file_count": len(session.predictions),
            "files": [
                {
                    "filename": p.filename,
                    "prediction": p.prediction,
                    "probabilities": json.loads(p.probabilities)
                } for p in session.predictions
            ]
        })
    return data

@router.get("/scan-session/{session_id}")
def get_scan_session_details(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(ScanSession).filter(
        ScanSession.id == session_id,
        ScanSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Scan session not found.")

    return {
        "session_id": session.id,
        "scanned_at": session.scanned_at.isoformat(),
        "user": {
            "id": session.user.id,
            "username": session.user.username,
            "email": session.user.email
        } if session.user else None,
        "files": [
            {
                "id": p.id,
                "filename": p.filename,
                "prediction": p.prediction,
                "probabilities": json.loads(p.probabilities),
                "scanned_at": p.scanned_at.isoformat() if p.scanned_at else None
            }
            for p in session.predictions
        ]
    }
