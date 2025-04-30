from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Malware Detection API is running!"}
