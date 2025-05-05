from fastapi import APIRouter, UploadFile, File
import shutil
from services.predictor import predict_file

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    result = predict_file(file_path)
    return {"filename": file.filename, "result": result}
