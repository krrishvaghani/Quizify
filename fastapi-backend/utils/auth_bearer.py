from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.auth_handler import decode_jwt
from config.db import get_database
from bson import ObjectId

class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, request: Request):
        credentials: HTTPAuthorizationCredentials = await super(JWTBearer, self).__call__(request)
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid authentication scheme.")
            if not self.verify_jwt(credentials.credentials):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token or expired token.")
            payload = decode_jwt(credentials.credentials)
            user_id = payload.get("user_id") if payload else None
            if not user_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token payload.")

            db = get_database()
            if not db:
                raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable.")

            try:
                user_object_id = ObjectId(user_id)
            except Exception:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token payload.")

            user_doc = await db["quizzify"]["users"].find_one({"_id": user_object_id})
            if not user_doc:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User no longer exists.")

            if user_doc.get("is_deleted", False):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your account has been deleted. Contact an administrator.")

            if user_doc.get("is_blocked", False):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your account is blocked. Contact an administrator.")

            return payload
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid authorization code.")

    def verify_jwt(self, jwt_token: str) -> bool:
        isTokenValid: bool = False
        try:
            payload = decode_jwt(jwt_token)
            if payload:
                isTokenValid = True
        except Exception:
            isTokenValid = False
        return isTokenValid
