from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from config.db import get_database
from utils.auth import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/api/user", tags=["User Dashboard"])

def get_db_client():
    return get_database()

@router.get("/dashboard")
async def get_user_dashboard(db: AsyncIOMotorClient = Depends(get_db_client), user: dict = Depends(get_current_user)):
    user_id = user.get("user_id")
    print(f"--> [BACKEND LOG] User Dashboard API called by user_id: {user_id}")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")
        
    attempts_col = db["quizzify"]["attempts"]
    quizzes_col = db["quizzify"]["quizzes"]
    
    # 1. Total Attempts
    total_attempts = await attempts_col.count_documents({"user_id": user_id})
    
    # 2 & 3. Total Score, Average Score, Best Score
    total_score = 0
    avg_score = 0
    best_score = 0
    
    if total_attempts > 0:
        stats_pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$group": {
                    "_id": None,
                    "total_sum": {"$sum": "$score"},
                    "avg_percentage": {"$avg": "$percentage"},
                    "max_percentage": {"$max": "$percentage"}
                }
            }
        ]
        stats_cursor = attempts_col.aggregate(stats_pipeline)
        stats_data = await stats_cursor.to_list(length=1)
        if stats_data:
            total_score = stats_data[0].get("total_sum", 0)
            avg_score = round(stats_data[0].get("avg_percentage", 0), 1)
            best_score = round(stats_data[0].get("max_percentage", 0), 1)
            
    # 4. Global Rank
    leaderboard_pipeline = [
        {"$group": {"_id": "$user_id", "total_score": {"$sum": "$score"}}},
        {"$sort": {"total_score": -1}}
    ]
    lb_cursor = attempts_col.aggregate(leaderboard_pipeline)
    lb_data = await lb_cursor.to_list(length=None) # get all ranked users
    
    rank = 0
    for idx, lb_user in enumerate(lb_data):
        if str(lb_user["_id"]) == str(user_id):
            rank = idx + 1
            break
            
    # If unranked but they exist, they effectively have rank = len(lb_data) + 1 if no score
    # We will just leave it at 0 if no attempts exist.
            
    # 5. Recent Attempts (Latest 5 for this user)
    recent_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$addFields": {"sort_date": {"$ifNull": ["$date", "$timestamp"]}}},
        {"$sort": {"sort_date": -1}},
        {"$limit": 5}
    ]
    recent_cursor = attempts_col.aggregate(recent_pipeline)
    recent_attempts = []
    async for ra in recent_cursor:
        recent_attempts.append({
            "quiz_title": ra.get("quiz_title", "Unknown Quiz"),
            "score": ra.get("score", 0),
            "percentage": ra.get("percentage", 0),
            "date": ra.get("date") or ra.get("timestamp")
        })
        
    # 6. Recommended Quizzes (Latest 3 quizzes added to the platform)
    quizzes_cursor = quizzes_col.find({}).sort("_id", -1).limit(3)
    recommended_quizzes = []
    async for q in quizzes_cursor:
        recommended_quizzes.append({
            "quiz_id": str(q["_id"]),
            "title": q.get("title", "Untitled Quiz"),
            "duration": q.get("time_limit", 10)
        })

    return {
        "total_attempts": total_attempts,
        "total_score": total_score,
        "average_score": avg_score,
        "best_score": best_score,
        "rank": rank,
        "recent_attempts": recent_attempts,
        "recommended_quizzes": recommended_quizzes
    }
