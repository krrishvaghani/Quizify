from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from config.db import get_database
from utils.auth import admin_required
from bson import ObjectId

router = APIRouter(prefix="/api/leaderboard", tags=["Leaderboard"])

def get_db_client():
    return get_database()

@router.get("/")
async def get_leaderboard(db: AsyncIOMotorClient = Depends(get_db_client), user: dict = Depends(admin_required)):
    attempts_collection = db["quizzify"]["attempts"]
    users_collection = db["quizzify"]["users"]
    
    # Aggregation pipeline to group, calculate, sort, and limit
    pipeline = [
        {
            "$group": {
                "_id": "$user_id",
                "total_score": {"$sum": "$score"},
                "attempts": {"$sum": 1}
            }
        },
        {
            "$sort": {"total_score": -1}
        },
        {
            "$limit": 10
        }
    ]
    
    cursor = attempts_collection.aggregate(pipeline)
    leaderboard_data = await cursor.to_list(length=10)
    
    result = []
    for item in leaderboard_data:
        user_id_str = item["_id"]
        
        # Try to resolve user's name
        try:
            obj_id = ObjectId(user_id_str)
            user_doc = await users_collection.find_one({"_id": obj_id})
            username = user_doc["name"] if user_doc and "name" in user_doc else "Unknown User"
        except Exception:
            username = "Unknown User"
            
        result.append({
            "user_id": user_id_str,
            "username": username,
            "total_score": item["total_score"],
            "attempts": item["attempts"]
        })
        
    return result
