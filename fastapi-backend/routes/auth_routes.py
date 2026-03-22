from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from schemas.user_schema import UserSignup, UserLogin
from models.user_model import UserModel
from config.db import get_database
from utils.auth import sign_jwt

router = APIRouter()

def get_db_client():
    return get_database()

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: UserSignup, db: AsyncIOMotorClient = Depends(get_db_client)):
    users_collection = db["quizzify"]["users"]
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists with this email"
        )
    
    # Create user dictionary ready for DB
    user_dict = UserModel.create_user_dict(name=user.name, email=user.email, password=user.password, role=user.role)
    
    # Store user in MongoDB
    result = await users_collection.insert_one(user_dict)
    
    if result.inserted_id:
        return {"message": "User registered successfully"}
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to register user"
    )

@router.post("/login", status_code=status.HTTP_200_OK)
async def login(user: UserLogin, db: AsyncIOMotorClient = Depends(get_db_client)):
    users_collection = db["quizzify"]["users"]
    
    # Find user in database
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    is_valid_password = UserModel.verify_password(user.password, db_user["hashed_password"])
    if not is_valid_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    user_id_str = str(db_user["_id"])
    role = db_user.get("role", "user")
    access_token = sign_jwt(user_id_str, role)
    
    return {
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": user_id_str,
            "name": db_user["name"],
            "email": db_user["email"],
            "role": role
        }
    }
