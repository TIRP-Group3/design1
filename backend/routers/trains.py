from fastapi import APIRouter, UploadFile, File
from models.train import train_model

import os
import pandas as pd

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    try:
        # Save the uploaded file to disk
        file_location = f"uploaded_files/{file.filename}"
        os.makedirs("uploaded_files", exist_ok=True)
        with open(file_location, "wb") as f:
            f.write(await file.read())

        # Load CSV and train the model, get accuracy and other metrics
        df = pd.read_csv(file_location)
        accuracy = train_model(df)  # Train the model and get accuracy
        
        # Return the accuracy and metrics to the frontend
        return {"message": "Model trained successfully", "accuracy": accuracy}

    except Exception as e:
        return {"detail": str(e)}