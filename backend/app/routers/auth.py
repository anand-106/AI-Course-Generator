from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.models.user import User, RegisterResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.db import users_collection
import uuid

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/signup", response_model=RegisterResponse)
def signup(user: User):
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
def signin(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": form_data.username},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
