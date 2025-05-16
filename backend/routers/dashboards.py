from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.user import User
from models.predict import PredictionHistory
from routers.users import get_current_user
from datetime import datetime, timedelta
from collections import Counter
from database import SessionLocal
import json

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("")
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Basic counts
    users_count = db.query(User).count()
    scans = db.query(PredictionHistory).filter(PredictionHistory.user_id == current_user.id).all()
    scans_count = len(scans)

    # Threat count
    threats = [s for s in scans if s.prediction.lower() not in ["benign", "clean", "none"]]
    threats_count = len(threats)

    # Threats today
    today = datetime.now().date()
    threats_today = sum(
        1 for s in threats
        if s.scanned_at and s.scanned_at.date() == today
    )

    # Threat Graph (last 3 months by name label)
    def month_label(dt):
        return dt.strftime("%b %Y")

    month_counter = Counter()
    for s in threats:
        if s.scanned_at:
            label = month_label(s.scanned_at)
            month_counter[label] += 1

    threat_graph_data = [
        {"name": label, "threats": count}
        for label, count in sorted(month_counter.items())
    ][-3:]  # only latest 3

    # Risk Breakdown
    def classify_severity(pred):
        p = pred.lower()
        if p in ["trojan", "ransomware", "worm"]:
            return "High"
        elif p in ["spyware", "keylogger"]:
            return "Medium"
        elif p in ["adware", "pup"]:
            return "Low"
        else:
            return "None"

    severity_counts = Counter()
    for s in threats:
        severity = classify_severity(s.prediction)
        if severity != "None":
            severity_counts[severity] += 1

    risk_data = [
        {"name": "Low", "value": severity_counts["Low"], "color": "#FFD700"},
        {"name": "Medium", "value": severity_counts["Medium"], "color": "#FF8C00"},
        {"name": "High", "value": severity_counts["High"], "color": "#FF4500"},
    ]

    # Type Breakdown
    type_counts = Counter(s.prediction for s in threats)
    color_map = {
        "trojan": "blue",
        "adware": "lightblue",
        "spyware": "purple",
        "ransomware": "green",
    }

    type_data = [
        {"name": name, "value": count, "color": color_map.get(name.lower(), "#ccc")}
        for name, count in type_counts.items()
    ]

    return {
        "usersCount": users_count,
        "scansCount": scans_count,
        "threatsCount": threats_count,
        "threatsToday": threats_today,
        "threatGraphData": threat_graph_data,
        "riskData": risk_data,
        "typeData": type_data,
    }
