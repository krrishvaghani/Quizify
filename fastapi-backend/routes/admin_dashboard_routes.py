from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from config.db import get_database
from utils.auth import admin_required
from bson import ObjectId

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

def get_db_client():
    return get_database()

@router.get("/dashboard")
async def get_admin_dashboard(db: AsyncIOMotorClient = Depends(get_db_client), user: dict = Depends(admin_required)):
    print(f"--> [BACKEND LOG] Admin Dashboard API called by user_id: {user.get('id')}")
    users_col = db["quizzify"]["users"]
    quizzes_col = db["quizzify"]["quizzes"]
    attempts_col = db["quizzify"]["attempts"]
    
    # 1. Counts
    total_users = await users_col.count_documents({"role": "user"})
    total_quizzes = await quizzes_col.count_documents({})
    total_attempts = await attempts_col.count_documents({})
    
    # 2. Average Score
    avg_score = 0
    if total_attempts > 0:
        avg_pipeline = [{"$group": {"_id": None, "average_percentage": {"$avg": "$percentage"}}}]
        avg_cursor = attempts_col.aggregate(avg_pipeline)
        avg_data = await avg_cursor.to_list(length=1)
        if avg_data:
            avg_score = round(avg_data[0].get("average_percentage", 0), 1)
            
    # Helper to resolve usernames safely
    async def resolve_username(u_id_str: str) -> str:
        try:
            u_doc = await users_col.find_one({"_id": ObjectId(u_id_str)})
            return u_doc.get("name", "Unknown User") if u_doc else "Unknown User"
        except Exception:
            return "Unknown User"

    # 3. Top Performers (Top 3)
    top_pipeline = [
        {
            "$group": {
                "_id": "$user_id",
                "total_score": {"$sum": "$score"},
                "attempts": {"$sum": 1}
            }
        },
        {"$sort": {"total_score": -1}},
        {"$limit": 3}
    ]
    top_cursor = attempts_col.aggregate(top_pipeline)
    top_performers_raw = await top_cursor.to_list(length=3)
    
    top_performers_resolved = []
    for tp in top_performers_raw:
        uname = await resolve_username(tp["_id"])
        top_performers_resolved.append({
            "username": uname,
            "score": tp["total_score"]
        })
        
    # 4. Recent Attempts (Latest 5)
    recent_cursor = attempts_col.find({}).sort("timestamp", -1).limit(5)
    recent_attempts_raw = await recent_cursor.to_list(length=5)
    
    recent_attempts_resolved = []
    for ra in recent_attempts_raw:
        uname = await resolve_username(ra.get("user_id"))
        recent_attempts_resolved.append({
            "username": uname,
            "quiz_title": ra.get("quiz_title", "Unknown Quiz"),
            "score": ra.get("score", 0),
            "percentage": ra.get("percentage", 0)
        })

    return {
        "total_users": total_users,
        "total_quizzes": total_quizzes,
        "total_attempts": total_attempts,
        "average_score": avg_score,
        "top_performers": top_performers_resolved,
        "recent_attempts": recent_attempts_resolved
    }
