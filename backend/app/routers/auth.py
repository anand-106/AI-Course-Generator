from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from pydantic import BaseModel
from app.models.user import User, RegisterResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.db import users_collection, connection_error
import uuid

router = APIRouter(prefix="/auth", tags=["Auth"])

class SignInRequest(BaseModel):
    email: str
    password: str

@router.post("/signup", response_model=RegisterResponse)
def signup(user: User):
    if users_collection is None:
        error_detail = connection_error if connection_error else "Database connection not available."
        raise HTTPException(
            status_code=503, 
            detail=f"Database connection failed. {error_detail} Please check your MongoDB configuration in the .env file and ensure your IP is whitelisted in MongoDB Atlas."
        )
    
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    user_id = str(uuid.uuid4())

    users_collection.insert_one({
        "id": user_id,
        "email": user.email,
        "name": user.name,
        "password": get_password_hash(user.password)
    })

    return {
        "user": {
            "id": user_id,
            "email": user.email,
            "name": user.name
        },
        "msg": "User registered successfully"
    }

@router.post("/signin", response_model=Token)
def signin(request: SignInRequest):
    if users_collection is None:
        error_detail = connection_error if connection_error else "Database connection not available."
        raise HTTPException(
            status_code=503, 
            detail=f"Database connection failed. {error_detail} Please check your MongoDB configuration in the .env file and ensure your IP is whitelisted in MongoDB Atlas."
        )
    
    user = users_collection.find_one({"email": request.email})
    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": request.email},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
