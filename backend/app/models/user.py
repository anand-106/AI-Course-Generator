from pydantic import BaseModel

class User(BaseModel):
    name: str
    email: str
    password: str

class RegisterResponse(BaseModel):
    user: dict
    msg: str

class Token(BaseModel):
    access_token: str
    token_type: str