import pandas as pd
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score
import joblib
import os

def train_model(df: pd.DataFrame):
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
    joblib.dump(hybrid, "saved_models/hybrid_model.pkl")
    joblib.dump(label_encoders, "saved_models/encoders.pkl")

    return accuracy * 100  # Returning accuracy as percentage
