from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from schemas.quiz_schema import QuizCreate
from config.db import get_database
from bson import ObjectId
from utils.auth import admin_required

router = APIRouter(prefix="/api/quizzes", tags=["Admin Quizzes"])

def get_db_client():
    return get_database()

@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_quiz(quiz: QuizCreate, db: AsyncIOMotorClient = Depends(get_db_client), user: dict = Depends(admin_required)):
    user_id = user.get("user_id")
    quizzes_collection = db["quizzify"]["quizzes"]
    questions_collection = db["quizzify"]["questions"]
    
    quiz_dict = quiz.model_dump(exclude={"questions"})
    quiz_dict["created_by"] = user_id
    
    result = await quizzes_collection.insert_one(quiz_dict)
    
    if result.inserted_id:
        quiz_id = str(result.inserted_id)
        
        if quiz.questions:
            questions_data = []
            for q in quiz.questions:
                q_dict = q.model_dump()
                q_dict["quiz_id"] = quiz_id
                questions_data.append(q_dict)
            if questions_data:
                await questions_collection.insert_many(questions_data)
                
        return {"message": "Quiz created successfully", "quiz_id": quiz_id}
    
    raise HTTPException(status_code=500, detail="Failed to create quiz")

@router.get("/admin")
async def get_admin_quizzes(db: AsyncIOMotorClient = Depends(get_db_client), user: dict = Depends(admin_required)):
    user_id = user.get("user_id")
    quizzes_collection = db["quizzify"]["quizzes"]
    
    cursor = quizzes_collection.find({"created_by": user_id})
    quizzes = await cursor.to_list(length=100)
    
    result = []
    for q in quizzes:
        q["quiz_id"] = str(q["_id"])
        del q["_id"]
        result.append(q)
    return result

@router.delete("/{quiz_id}")
async def delete_quiz(quiz_id: str, db: AsyncIOMotorClient = Depends(get_db_client), user: dict = Depends(admin_required)):
    user_id = user.get("user_id")
    quizzes_collection = db["quizzify"]["quizzes"]
    questions_collection = db["quizzify"]["questions"]
    
    try:
        obj_id = ObjectId(quiz_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID format")
        
    quiz = await quizzes_collection.find_one({"_id": obj_id})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if quiz.get("created_by") != user_id:
         raise HTTPException(status_code=403, detail="You can only delete your own quizzes")
         
    await quizzes_collection.delete_one({"_id": obj_id})
    await questions_collection.delete_many({"quiz_id": quiz_id})
    
    return {"message": "Quiz and associated questions deleted successfully"}
