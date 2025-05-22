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

    # Drop high-cardinality or non-informative fields
    cols_to_drop = ['File_Name', 'File_Path', 'Last_Modified_By']
    df = df.drop(columns=[col for col in cols_to_drop if col in df.columns], errors='ignore')

    # Fill all missing values with "unknown"
    df = df.fillna("unknown")

    # Split features and target
    X = df.drop('target', axis=1)
    y = df['target'].astype(str)

    label_encoders = {}

    # Encode all object (categorical) columns in X
    for col in X.select_dtypes(include='object'):
        le = LabelEncoder()
        X[col] = X[col].astype(str).fillna("unknown")

        # Ensure 'unknown' is in encoder classes
        unique_vals = X[col].unique().tolist()
        if "unknown" not in unique_vals:
            unique_vals.append("unknown")
        le.fit(unique_vals)

        X[col] = le.transform(X[col])
        label_encoders[col] = le

    # Encode target
    le_target = LabelEncoder()
    le_target.fit(y)
    y = le_target.transform(y)
    label_encoders['target'] = le_target

    # Train-test split
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Define models
    from sklearn.ensemble import RandomForestClassifier, VotingClassifier
    from sklearn.svm import SVC

    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    svm = SVC(probability=True, random_state=42)
    hybrid = VotingClassifier(estimators=[('rf', rf), ('svm', svm)], voting='soft')

    # Train model
    hybrid.fit(X_train, y_train)

    # Evaluate
    from sklearn.metrics import accuracy_score
    y_pred = hybrid.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    # Save model and encoders
    import os
    import joblib
    os.makedirs("saved_models", exist_ok=True)
    joblib.dump(hybrid, f"saved_models/{model_filename}")
    joblib.dump(label_encoders, f"saved_models/{encoder_filename}")

    return accuracy * 100  # Return accuracy in percent

class TrainingSession(Base):
    __tablename__ = "training_sessions"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    model_path = Column(String(255), nullable=False)
    accuracy = Column(Float, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    
    user = relationship("User", back_populates="training_sessions")

