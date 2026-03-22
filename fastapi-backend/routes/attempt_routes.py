from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from schemas.attempt_schema import AttemptSubmit
from config.db import get_database
from bson import ObjectId
from utils.auth_bearer import JWTBearer
import datetime

router = APIRouter()

def get_db_client():
    return get_database()

@router.post("/submit", status_code=status.HTTP_201_CREATED, dependencies=[Depends(JWTBearer())])
async def submit_attempt(submission: AttemptSubmit, token_payload: dict = Depends(JWTBearer()), db: AsyncIOMotorClient = Depends(get_db_client)):
    questions_collection = db["quizzify"]["questions"]
    attempts_collection = db["quizzify"]["attempts"]
    quizzes_collection = db["quizzify"]["quizzes"]
    
    user_id = token_payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    # Fetch quiz details
    try:
        quiz_obj_id = ObjectId(submission.quiz_id)
        quiz = await quizzes_collection.find_one({"_id": quiz_obj_id})
        quiz_title = quiz.get("title", "Untitled Quiz") if quiz else "Unknown Quiz"
    except Exception:
        quiz_title = "Unknown Quiz"
    
    # Fetch questions
    cursor = questions_collection.find({"quiz_id": submission.quiz_id})
    questions = await cursor.to_list(length=100)
    
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for this quiz")
        
    correct_answers = {str(q["_id"]): q["correct_answer"] for q in questions}
    
    score = 0
    total_questions = len(questions)
    
    for ans in submission.answers:
        q_id = ans.get("question_id")
        selected = ans.get("selected_option")
        if q_id in correct_answers and selected == correct_answers[q_id]:
            score += 1
            
    percentage = (score / total_questions) * 100 if total_questions > 0 else 0
    
    attempt_doc = {
        "user_id": user_id,
        "quiz_id": submission.quiz_id,
        "quiz_title": quiz_title,
        "score": score,
        "total_questions": total_questions,
        "percentage": round(percentage, 2),
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    
    result = await attempts_collection.insert_one(attempt_doc)
    
    if result.inserted_id:
        return {
            "message": "Attempt saved successfully",
            "attempt_id": str(result.inserted_id),
            "score": score,
            "total_questions": total_questions,
            "percentage": round(percentage, 2)
        }
    
    raise HTTPException(status_code=500, detail="Failed to save attempt")

@router.get("/", dependencies=[Depends(JWTBearer())])
async def get_my_attempts(token_payload: dict = Depends(JWTBearer()), db: AsyncIOMotorClient = Depends(get_db_client)):
    attempts_collection = db["quizzify"]["attempts"]
    user_id = token_payload.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
        
    cursor = attempts_collection.find({"user_id": user_id}).sort("timestamp", -1)
    attempts = await cursor.to_list(length=100)
    
    result = []
    for a in attempts:
        a["id"] = str(a["_id"])
        del a["_id"]
        result.append(a)
        
    return result
