from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserModel:
    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_user_dict(name: str, email: str, password: str, role: str = "user") -> dict:
        return {
            "name": name,
            "email": email,
            "hashed_password": UserModel.get_password_hash(password),
            "role": role,
            "is_blocked": False,
            "is_deleted": False,
        }
