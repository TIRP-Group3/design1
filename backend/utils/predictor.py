def predict_file(file_path: str) -> str:
    # Dummy prediction logic for now
    return "benign" if file_path.endswith(".txt") else "malicious"
