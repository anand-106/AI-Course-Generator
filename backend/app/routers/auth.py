from fastapi import APIRouter, HTTPException
from datetime import timedelta
from app.models.user import User, UserOut, RegisterResponse
from app.core.security import get_password_hash, create_access_token
from app.db import users_db
import uuid

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=RegisterResponse)
def register(user: User):
    if user.email in users_db:
        raise HTTPException(status_code=400, detail="User already exists")
    

    user_id = str(uuid.uuid4())

    users_db[user.email] = {
        "id": user_id,
        "name": user.name,
        "password": get_password_hash(user.password)
    }


    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, 
        expires_delta=access_token_expires
    )
    refresh_token = create_access_token(
        data={"sub": user.email}, 
        expires_delta=timedelta(days=7)
    )

    return {
        "user": {
            "id": user_id,
            "email": user.email,
            "name": user.name
        },
        "access_token": access_token,
        "refresh_token": refresh_token
    }