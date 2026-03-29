from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from config.db import get_database
from utils.auth import admin_required, get_current_user
from bson import ObjectId

router = APIRouter(prefix="/api/leaderboard", tags=["Leaderboard"])

def get_db_client():
    return get_database()

@router.get("/")
async def get_leaderboard(db: AsyncIOMotorClient = Depends(get_db_client), user: dict = Depends(get_current_user)):
    return await get_global_leaderboard(db=db, user=user)


@router.get("/global")
async def get_global_leaderboard(db: AsyncIOMotorClient = Depends(get_db_client), user: dict = Depends(get_current_user)):
    attempts_collection = db["quizzify"]["attempts"]
    users_collection = db["quizzify"]["users"]
    
    # Aggregation pipeline to group, calculate, sort, and limit
    pipeline = [
        {
            "$group": {
                "_id": "$user_id",
                "total_score": {"$sum": "$score"},
                "attempts": {"$sum": 1},
                "average_percentage": {"$avg": "$percentage"}
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
    for idx, item in enumerate(leaderboard_data):
        user_id_str = str(item["_id"])
        
        # Try to resolve user's name
        try:
            obj_id = ObjectId(user_id_str)
            user_doc = await users_collection.find_one({"_id": obj_id})
            username = user_doc["name"] if user_doc and "name" in user_doc else "Unknown User"
        except Exception:
            username = "Unknown User"
            
        result.append({
            "rank": idx + 1,
            "user_id": user_id_str,
            "username": username,
            "total_score": item["total_score"],
            "attempts": item["attempts"],
            "average_percentage": round(item.get("average_percentage", 0), 2),
        })
        
    return result


@router.get("/quiz/{quiz_id}")
async def get_quiz_leaderboard(
    quiz_id: str,
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(get_current_user),
):
    attempts_collection = db["quizzify"]["attempts"]
    users_collection = db["quizzify"]["users"]

    pipeline = [
        {"$match": {"quiz_id": quiz_id}},
        {
            "$group": {
                "_id": "$user_id",
                "attempts": {"$sum": 1},
                "average_percentage": {"$avg": "$percentage"},
                "best_percentage": {"$max": "$percentage"},
                "total_score": {"$sum": "$score"},
                "quiz_title": {"$first": "$quiz_title"},
            }
        },
        {"$sort": {"best_percentage": -1, "average_percentage": -1, "total_score": -1}},
        {"$limit": 50},
    ]

    leaderboard_data = await attempts_collection.aggregate(pipeline).to_list(length=50)
    result = []
    quiz_title = ""

    for idx, item in enumerate(leaderboard_data):
        user_id_str = str(item["_id"])
        quiz_title = quiz_title or item.get("quiz_title", "")
        try:
            obj_id = ObjectId(user_id_str)
            user_doc = await users_collection.find_one({"_id": obj_id})
            username = user_doc["name"] if user_doc and "name" in user_doc else "Unknown User"
        except Exception:
            username = "Unknown User"

        result.append(
            {
                "rank": idx + 1,
                "user_id": user_id_str,
                "username": username,
                "attempts": item.get("attempts", 0),
                "average_percentage": round(item.get("average_percentage", 0), 2),
                "best_percentage": round(item.get("best_percentage", 0), 2),
                "total_score": item.get("total_score", 0),
            }
        )

    return {"quiz_id": quiz_id, "quiz_title": quiz_title or "", "rankings": result}
