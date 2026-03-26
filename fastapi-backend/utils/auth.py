import time
from typing import Dict, Any
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "1234567890qwertyuiopasdfghjklzxcvbnm")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

def sign_jwt(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "expires": time.time() + 3600 # 1 hour
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt(token: str) -> dict:
    try:
        decoded_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return decoded_token if decoded_token["expires"] >= time.time() else {}
    except:
        return {}

class JWTAuth(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=False)

    async def __call__(self, request: Request) -> dict:
        credentials = await super().__call__(request)
        if not credentials:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        if not credentials.scheme == "Bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme. Bearer scheme required.")
        
        payload = decode_jwt(credentials.credentials)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return payload

def get_current_user(payload: dict = Depends(JWTAuth())) -> dict:
    """Dependency that extracts the validated token payload."""
    return payload

def admin_required(user: dict = Depends(get_current_user)) -> dict:
    """Dependency that ensures the current user has the 'admin' role."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this resource")
    return user
