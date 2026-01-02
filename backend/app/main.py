import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_path = Path(__file__).parent.parent  # Go up one level from app/ to backend/
sys.path.insert(0, str(backend_path))

from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth
from app.routers import course

load_dotenv()

app = FastAPI()

app.include_router(auth.router)
app.include_router(course.router)

@app.get("/")
def home():
    return {"msg": "Welcome to AI Course Generator"}

@app.get("/health")
def health_check():
    from app.db import users_collection, connection_error
    return {
        "status": "ok" if users_collection is not None else "error",
        "database": "connected" if users_collection is not None else "disconnected",
        "error": connection_error if connection_error else None
    }

# CORS for Vite dev server and production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*",  # relax during development; tighten in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
