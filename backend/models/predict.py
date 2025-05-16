from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base
from sqlalchemy.orm import relationship
class PredictionHistory(Base):
    __tablename__ = "prediction_histories"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    prediction = Column(String(255), nullable=False)
    probabilities = Column(String(255), nullable=False)  # store JSON string
    scanned_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # assuming users table exists
    user = relationship("User", back_populates="predictions")
    session_id = Column(Integer, ForeignKey("scan_sessions.id"), nullable=True)
    session = relationship("ScanSession", back_populates="predictions")


class ScanSession(Base):
    __tablename__ = "scan_sessions"
    id = Column(Integer, primary_key=True, index=True)
    scanned_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="scan_sessions")
    predictions = relationship("PredictionHistory", back_populates="session")
