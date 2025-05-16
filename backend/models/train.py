import pandas as pd
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import joblib
import os
from database import Base

def train_model(df: pd.DataFrame, model_filename: str, encoder_filename: str):
    if 'target' not in df.columns:
        raise ValueError("CSV must contain a 'target' column.")

    X = df.drop('target', axis=1)
    y = df['target']
    
    # Encoding categorical columns
    label_encoders = {}
    for col in X.select_dtypes(include=['object']):
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])
        label_encoders[col] = le
    
    le_target = LabelEncoder()
    y = le_target.fit_transform(y)
    label_encoders['target'] = le_target

    # Splitting data into train and test (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # RandomForestClassifier and SVM
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    svm = SVC(probability=True, random_state=42)

    # Hybrid ensemble model using soft voting
    hybrid = VotingClassifier(estimators=[('rf', rf), ('svm', svm)], voting='soft')

    # Training the model
    hybrid.fit(X_train, y_train)

    # Predicting on the test data
    y_pred = hybrid.predict(X_test)

    # Calculating accuracy
    accuracy = accuracy_score(y_test, y_pred)

    # Saving model and label encoders
    os.makedirs("saved_models", exist_ok=True)
    joblib.dump(hybrid, f"saved_models/{model_filename}")
    joblib.dump(label_encoders, f"saved_models/{encoder_filename}")

    return accuracy * 100  # Returning accuracy as percentage

class TrainingSession(Base):
    __tablename__ = "training_sessions"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    model_path = Column(String(255), nullable=False)
    accuracy = Column(Float, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    
    user = relationship("User", back_populates="training_sessions")