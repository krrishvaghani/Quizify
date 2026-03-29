import time
from typing import Dict, Any
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
from dotenv import load_dotenv
from bson import ObjectId
from config.db import get_database

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "1234567890qwertyuiopasdfghjklzxcvbnm")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

def sign_jwt(user_id: str, role: str, expires_in_minutes: int = 60) -> str:
    safe_minutes = max(1, int(expires_in_minutes))
    payload = {
        "user_id": user_id,
        "role": role,
        "expires": time.time() + (safe_minutes * 60)
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

        db = get_database()
        if not db:
            raise HTTPException(status_code=503, detail="Database unavailable")

        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        try:
            user_obj_id = ObjectId(user_id)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        user_doc = await db["quizzify"]["users"].find_one({"_id": user_obj_id})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User no longer exists")

        if user_doc.get("is_deleted", False):
            raise HTTPException(status_code=403, detail="Your account has been deleted. Contact an administrator.")

        if user_doc.get("is_blocked", False):
            raise HTTPException(status_code=403, detail="Your account is blocked. Contact an administrator.")

        return payload

def get_current_user(payload: dict = Depends(JWTAuth())) -> dict:
    """Dependency that extracts the validated token payload."""
    return payload

def admin_required(user: dict = Depends(get_current_user)) -> dict:
    """Dependency that ensures the current user has the 'admin' role."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this resource")
    return user
