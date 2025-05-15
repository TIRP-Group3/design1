import json
import joblib
import pandas as pd
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
import os
from typing import List
from sqlalchemy.orm import Session
from database import SessionLocal
from routers.users import get_current_user
from models.predict import PredictionHistory
from models.user import User
model = joblib.load("saved_models/hybrid_model.pkl")
encoders = joblib.load("saved_models/encoders.pkl")

router = APIRouter(prefix="/datasets", tags=["Datasets"])

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def extract_features_from_file(file_bytes: bytes, filename: str) -> dict:
    # Placeholder for actual feature extraction
    return {
        "file_size": len(file_bytes),
        "extension": os.path.splitext(filename)[1].lower().replace('.', ''),
        # Add more realistic features here
    }

@router.post("/predict-file")
async def predict_file(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = []

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
                user_id=current_user.id
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

    return {"results": results}

@router.get("/prediction-history")
def get_user_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(PredictionHistory).filter(PredictionHistory.user_id == current_user.id).all()

    # Convert SQLAlchemy objects to dicts and parse probabilities string
    results = []
    for r in records:
        record_dict = {
            "id": r.id,
            "filename": r.filename,
            "prediction": r.prediction,
            "scanned_at": r.scanned_at.isoformat() if r.scanned_at else None,
            "user_id": r.user_id,
            # parse probabilities JSON string into dict
            "probabilities": json.loads(r.probabilities) if isinstance(r.probabilities, str) else r.probabilities,
        }
        results.append(record_dict)

    return results