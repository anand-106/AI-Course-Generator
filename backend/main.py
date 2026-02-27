from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import traceback
import logging

from routers import auth
from routers import course
from routers import chat
from routers import user

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal server error: {str(exc)}",
            "type": type(exc).__name__
        }
    )

app.include_router(auth.router)
app.include_router(course.router)
app.include_router(chat.router)
app.include_router(user.router)

@app.get("/")
def home():
    return {"msg": "Welcome to AI Course Generator"}

@app.get("/health")
def health_check():
    from db import users_collection, connection_error
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
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
