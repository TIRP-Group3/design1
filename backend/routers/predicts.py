import json
import joblib
import pandas as pd
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
import os
import io
from sqlalchemy.orm import Session
from typing import List

from database import SessionLocal
from routers.users import get_current_user
from models.predict import PredictionHistory, ScanSession
from models.user import User
from models.train import TrainingSession

router = APIRouter(prefix="/datasets", tags=["Datasets"])

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/predict-file")
async def predict_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    # Load model and encoders
    latest = db.query(TrainingSession).order_by(TrainingSession.uploaded_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=404, detail="No trained model found.")

    try:
        model = joblib.load(latest.model_path)
        encoder_path = latest.model_path.replace("model_", "encoder_")
        encoders = joblib.load(encoder_path)
        target_encoder = encoders["target"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model or encoder loading failed: {e}")

    # Read CSV
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        if 'target' in df.columns:
            df = df.drop(columns=['target'])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV file: {e}")

    # Drop high-cardinality or unstable fields
    cols_to_drop = ['File_Name', 'File_Path', 'Last_Modified_By']
    df = df.drop(columns=[col for col in cols_to_drop if col in df.columns], errors='ignore')

    # Fill missing values with a safe string
    df = df.fillna("unknown")

    # Apply encoders
    try:
        for col, encoder in encoders.items():
            if col == 'target':
                continue
            if col in df.columns:
                # Replace unseen values with "unknown" if "unknown" exists in encoder classes
                if "unknown" in encoder.classes_:
                    df[col] = df[col].apply(lambda x: x if x in encoder.classes_ else "unknown")
                df[col] = encoder.transform(df[col].astype(str))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply encoders: {e}")

    # Predict
    try:
        predictions = model.predict(df)
        probabilities = model.predict_proba(df)
        labels = target_encoder.inverse_transform(predictions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    # Create scan session
    scan_session = ScanSession(user_id=current_user.id)
    db.add(scan_session)
    db.commit()
    db.refresh(scan_session)

    # Prepare results
    results = []
    for idx in range(len(df)):
        prob_dict = {
            target_encoder.inverse_transform([i])[0]: float(prob)
            for i, prob in enumerate(probabilities[idx])
        }

        history_entry = PredictionHistory(
            filename=file.filename,
            prediction=labels[idx],
            probabilities=json.dumps(prob_dict),
            user_id=current_user.id,
            session_id=scan_session.id
        )
        db.add(history_entry)
        db.commit()

        results.append({
            "index": idx,
            "filename": file.filename,
            "prediction": labels[idx],
            "probabilities": prob_dict
        })

    return {
        "session_id": scan_session.id,
        "filename": file.filename,
        "results": results
    }


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
            "user": {
                "id": session.user.id,
                "username": session.user.username,
                "email": session.user.email
            },
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

@router.post("/predict-file-public")
async def predict_file_public(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    GUEST_USER_ID = 3  # 🔐 Change this if your guest user ID differs

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    # Load model and encoders
    latest = db.query(TrainingSession).order_by(TrainingSession.uploaded_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=404, detail="No trained model found.")

    try:
        model = joblib.load(latest.model_path)
        encoder_path = latest.model_path.replace("model_", "encoder_")
        encoders = joblib.load(encoder_path)
        target_encoder = encoders["target"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model or encoder loading failed: {e}")

    # Read CSV
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        if 'target' in df.columns:
            df = df.drop(columns=['target'])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV file: {e}")

    # Drop high-cardinality or unstable fields
    cols_to_drop = ['File_Name', 'File_Path', 'Last_Modified_By']
    df = df.drop(columns=[col for col in cols_to_drop if col in df.columns], errors='ignore')

    # Fill missing values with a safe string
    df = df.fillna("unknown")

    # Apply encoders
    try:
        for col, encoder in encoders.items():
            if col == 'target':
                continue
            if col in df.columns:
                if "unknown" in encoder.classes_:
                    df[col] = df[col].apply(lambda x: x if x in encoder.classes_ else "unknown")
                df[col] = encoder.transform(df[col].astype(str))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply encoders: {e}")

    # Predict
    try:
        predictions = model.predict(df)
        probabilities = model.predict_proba(df)
        labels = target_encoder.inverse_transform(predictions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    # Create scan session for GUEST user
    scan_session = ScanSession(user_id=GUEST_USER_ID)
    db.add(scan_session)
    db.commit()
    db.refresh(scan_session)

    # Save predictions and prepare results
    results = []
    for idx in range(len(df)):
        prob_dict = {
            target_encoder.inverse_transform([i])[0]: float(prob)
            for i, prob in enumerate(probabilities[idx])
        }

        history_entry = PredictionHistory(
            filename=file.filename,
            prediction=labels[idx],
            probabilities=json.dumps(prob_dict),
            user_id=GUEST_USER_ID,
            session_id=scan_session.id
        )
        db.add(history_entry)
        db.commit()

        results.append({
            "index": idx,
            "filename": file.filename,
            "prediction": labels[idx],
            "probabilities": prob_dict
        })

    return {
        "session_id": scan_session.id,
        "filename": file.filename,
        "results": results
    }

@router.get("/scan-session-public/{session_id}")
def get_scan_session_public(
    session_id: int,
    db: Session = Depends(get_db)
):
    GUEST_USER_ID = 3  # ID of the guest/public user account

    session = db.query(ScanSession).filter(
        ScanSession.id == session_id,
        ScanSession.user_id == GUEST_USER_ID
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Public scan session not found.")

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
