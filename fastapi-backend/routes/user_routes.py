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


async def _get_user_group_ids(db: AsyncIOMotorClient, user_id: str) -> list[str]:
    groups_collection = db["quizzify"]["groups"]
    cursor = groups_collection.find({"users": user_id}, {"_id": 1})
    groups = await cursor.to_list(length=500)
    return [str(group["_id"]) for group in groups]

@router.get("/api/quizzes/user")
async def get_user_quizzes(db: AsyncIOMotorClient = Depends(get_db_client), user: dict = Depends(get_current_user)):
    user_id = user.get("user_id")
    quizzes_collection = db["quizzify"]["quizzes"]

    user_group_ids = await _get_user_group_ids(db, user_id)
    query = {
        "$or": [
            {"assigned_users": user_id},
            {"assigned_groups": {"$in": user_group_ids}},
        ]
    }

    cursor = quizzes_collection.find(query)
    quizzes = await cursor.to_list(length=100)
    
    result = []
    for q in quizzes:
        q["quiz_id"] = str(q["_id"])
        del q["_id"]
        result.append(q)
    return result


@router.get("/api/user/assigned-quizzes/{user_id}")
async def get_assigned_quizzes(
    user_id: str,
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(get_current_user),
):
    if user_id != user.get("user_id") and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="You can only view your own assigned quizzes")

    quizzes_collection = db["quizzify"]["quizzes"]
    user_group_ids = await _get_user_group_ids(db, user_id)

    query = {
        "$or": [
            {"assigned_users": user_id},
            {"assigned_groups": {"$in": user_group_ids}},
        ]
    }

    cursor = quizzes_collection.find(query).sort("_id", -1)
    quizzes = await cursor.to_list(length=300)

    result = []
    for q in quizzes:
        result.append(
            {
                "quiz_id": str(q["_id"]),
                "title": q.get("title", "Untitled Quiz"),
                "duration": q.get("duration", 5),
                "question_timer": q.get("question_timer", False),
                "time_per_question": q.get("time_per_question"),
            }
        )

    return result

@router.get("/api/quizzes/user/{quiz_id}")
async def play_quiz(quiz_id: str, db: AsyncIOMotorClient = Depends(get_db_client), user: dict = Depends(get_current_user)):
    quizzes_collection = db["quizzify"]["quizzes"]
    questions_collection = db["quizzify"]["questions"]
    user_id = user.get("user_id")
    role = user.get("role")
    
    try:
        quiz_obj_id = ObjectId(quiz_id)
        quiz = await quizzes_collection.find_one({"_id": quiz_obj_id})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        if role != "admin":
            user_group_ids = await _get_user_group_ids(db, user_id)
            assigned_users = quiz.get("assigned_users", [])
            assigned_groups = quiz.get("assigned_groups", [])
            if user_id not in assigned_users and not set(user_group_ids).intersection(set(assigned_groups)):
                raise HTTPException(status_code=403, detail="This quiz is not assigned to you")
            
        question_ids = quiz.get("question_ids", [])
        if question_ids:
            q_object_ids = [ObjectId(qid) for qid in question_ids if ObjectId.is_valid(qid)]
            cursor = questions_collection.find({"_id": {"$in": q_object_ids}})
            questions = await cursor.to_list(length=200)
        else:
            cursor = questions_collection.find({"quiz_id": quiz_id})
            questions = await cursor.to_list(length=100)
        
        # Remove correct_answer so user can't cheat
        formatted_questions = []
        for q in questions:
            formatted_questions.append({
                "question_id": str(q["_id"]),
                "question": q.get("question") or q.get("text", ""),
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
    
    quiz_doc = None
    try:
        quiz_obj_id = ObjectId(submission.quiz_id)
        quiz_doc = await quizzes_collection.find_one({"_id": quiz_obj_id})
    except Exception:
        quiz_doc = None

    question_ids = quiz_doc.get("question_ids", []) if quiz_doc else []
    if question_ids:
        q_object_ids = [ObjectId(qid) for qid in question_ids if ObjectId.is_valid(qid)]
        cursor = questions_collection.find({"_id": {"$in": q_object_ids}})
        questions = await cursor.to_list(length=200)
    else:
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
            "question": q.get("question") or q.get("text", ""),
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
