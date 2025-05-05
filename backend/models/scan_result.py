# backend/models/scan_result.py
from sqlalchemy import Column, Integer, String, DateTime
from database import Base
from datetime import datetime

class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255))
    result = Column(String(255))
    scanned_at = Column(DateTime, default=datetime.utcnow)
