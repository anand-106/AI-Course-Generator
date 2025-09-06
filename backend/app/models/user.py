from pydantic import BaseModel, EmailStr
import uuid

class User(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str

class RegisterResponse(BaseModel):
    user: UserOut
    access_token: str
    refresh_token: str
