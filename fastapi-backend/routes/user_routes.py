from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from schemas.attempt_schema import AttemptSubmit
from config.db import get_database
from bson import ObjectId
from utils.auth import get_current_user
import datetime

router = APIRouter(tags=["User Quizzes and Attempts"])

def get_db_client():
    return get_database()

@router.get("/api/quizzes/user")
async def get_user_quizzes(db: AsyncIOMotorClient = Depends(get_db_client), user: dict = Depends(get_current_user)):
    quizzes_collection = db["quizzify"]["quizzes"]
    cursor = quizzes_collection.find({})
    quizzes = await cursor.to_list(length=100)
    
    result = []
    for q in quizzes:
        q["quiz_id"] = str(q["_id"])
        del q["_id"]
        result.append(q)
    return result

@router.get("/api/quizzes/user/{quiz_id}")
async def play_quiz(quiz_id: str, db: AsyncIOMotorClient = Depends(get_db_client), user: dict = Depends(get_current_user)):
    quizzes_collection = db["quizzify"]["quizzes"]
    questions_collection = db["quizzify"]["questions"]
    
    try:
        quiz_obj_id = ObjectId(quiz_id)
        quiz = await quizzes_collection.find_one({"_id": quiz_obj_id})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
            
        cursor = questions_collection.find({"quiz_id": quiz_id})
        questions = await cursor.to_list(length=100)
        
        # Remove correct_answer so user can't cheat
        formatted_questions = []
        for q in questions:
            formatted_questions.append({
                "question_id": str(q["_id"]),
                "question": q["text"],
                "options": q["options"]
            })
            
        return {
            "quiz_id": quiz_id,
            "title": quiz.get("title", "Untitled Quiz"),
            "duration": quiz.get("duration", 5),
            "question_timer": quiz.get("question_timer", False),
            "time_per_question": quiz.get("time_per_question"),
            "questions": formatted_questions
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail="Invalid quiz_id format")

@router.post("/api/attempts/submit", status_code=status.HTTP_201_CREATED)
async def submit_attempt(submission: AttemptSubmit, db: AsyncIOMotorClient = Depends(get_db_client), user: dict = Depends(get_current_user)):
    questions_collection = db["quizzify"]["questions"]
    attempts_collection = db["quizzify"]["attempts"]
    quizzes_collection = db["quizzify"]["quizzes"]
    
    user_id = user.get("user_id")

    try:
        quiz_obj_id = ObjectId(submission.quiz_id)
        quiz = await quizzes_collection.find_one({"_id": quiz_obj_id})
        quiz_title = quiz.get("title", "Untitled Quiz") if quiz else "Unknown Quiz"
    except Exception:
        quiz_title = "Unknown Quiz"
    
    cursor = questions_collection.find({"quiz_id": submission.quiz_id})
    questions = await cursor.to_list(length=100)
    
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for this quiz")
        
    correct_answers = {str(q["_id"]): q["correct_answer"] for q in questions}
    
    score = 0
    total_questions = len(questions)
    detailed_questions = []
    
    for q in questions:
        q_id_str = str(q["_id"])
        correct_opt = q["correct_answer"]
        # Find user's selected option if it exists
        user_opt = next((ans.get("selected_option") for ans in submission.answers if ans.get("question_id") == q_id_str), None)
        is_val = (user_opt == correct_opt)
        
        detailed_questions.append({
            "question": q["text"],
            "options": q["options"],
            "correct_answer": correct_opt,
            "user_answer": user_opt,
            "is_correct": is_val
        })
        
        if is_val:
            score += 1
            
    percentage = (score / total_questions) * 100 if total_questions > 0 else 0
    
    attempt_doc = {
        "user_id": user_id,
        "quiz_id": submission.quiz_id,
        "quiz_title": quiz_title,
        "score": score,
        "total": total_questions,
        "percentage": round(percentage, 2),
        "date": datetime.datetime.utcnow().isoformat(),
        "questions": detailed_questions 
    }
    
    result = await attempts_collection.insert_one(attempt_doc)
    
    if result.inserted_id:
        return {
            "message": "Attempt saved successfully",
            "attempt_id": str(result.inserted_id),
            "score": score,
            "total": total_questions,
            "percentage": round(percentage, 2)
        }
    
    raise HTTPException(status_code=500, detail="Failed to save attempt")

@router.get("/api/attempts/{id}")
async def get_attempts_or_detail(id: str, db: AsyncIOMotorClient = Depends(get_db_client), user: dict = Depends(get_current_user)):
    attempts_collection = db["quizzify"]["attempts"]
    
    # First try resolving id as an attempt_id
    try:
        obj_id = ObjectId(id)
        attempt = await attempts_collection.find_one({"_id": obj_id})
        if attempt:
            if attempt.get("user_id") != user.get("user_id") and user.get("role") != "admin":
                raise HTTPException(status_code=403, detail="You can only view your own attempts")
            
            attempt["id"] = str(attempt["_id"])
            del attempt["_id"]
            # Map legacy records seamlessly
            if "total_questions" in attempt:
                attempt["total"] = attempt.pop("total_questions")
            if "timestamp" in attempt:
                attempt["date"] = attempt.pop("timestamp")
            return attempt
    except Exception:
        pass
        
    # If not a valid attempt, treat it as user_id for summary list
    if id != user.get("user_id") and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="You can only view your own attempts")

    cursor = attempts_collection.find({"user_id": id}).sort("date", -1)
    attempts = await cursor.to_list(length=100)
    
    # Fallback sort on timestamp for legacy records if 'date' sorting fails naturally
    if not attempts:
        cursor = attempts_collection.find({"user_id": id}).sort("timestamp", -1)
        attempts = await cursor.to_list(length=100)
    
    result = []
    for a in attempts:
        summary = {
            "id": str(a["_id"]),
            "quiz_title": a.get("quiz_title", "Unknown"),
            "score": a.get("score"),
            "total": a.get("total") or a.get("total_questions"),
            "percentage": a.get("percentage"),
            "date": a.get("date") or a.get("timestamp")
        }
        result.append(summary)
        
    return result
