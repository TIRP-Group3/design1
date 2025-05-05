from pydantic import BaseModel
from datetime import datetime

class ScanResultOut(BaseModel):
    id: int
    filename: str
    result: str
    scanned_at: datetime

    class Config:
        orm_mode = True
