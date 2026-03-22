from pydantic import BaseModel, EmailStr
from typing import Optional

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "user"

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Jane Doe",
                "email": "jane@example.com",
                "password": "strongpassword123",
                "role": "user"
            }
        }

class UserLogin(BaseModel):
    email: EmailStr
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "email": "jane@example.com",
                "password": "strongpassword123"
            }
        }
