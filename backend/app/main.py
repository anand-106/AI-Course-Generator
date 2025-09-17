import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_path = Path(__file__).parent.parent  # Go up one level from app/ to backend/
sys.path.insert(0, str(backend_path))

from fastapi import FastAPI

from app.routers import auth

app = FastAPI()

app.include_router(auth.router)

@app.get("/")
def home():
    return {"msg": "Welcome to AI Course Generator API 🚀"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
