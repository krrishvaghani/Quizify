from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from schemas.quiz_schema import QuizCreate, QuestionsBatchCreate
from config.db import get_database
from bson import ObjectId

router = APIRouter()

def get_db_client():
    return get_database()

@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_quiz(quiz: QuizCreate, db: AsyncIOMotorClient = Depends(get_db_client)):
    quizzes_collection = db["quizzify"]["quizzes"]
    
    quiz_dict = quiz.model_dump()
    
    result = await quizzes_collection.insert_one(quiz_dict)
    
    if result.inserted_id:
        return {"message": "Quiz created successfully", "quiz_id": str(result.inserted_id)}
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to create quiz"
    )

@router.post("/{quiz_id}/questions", status_code=status.HTTP_201_CREATED)
async def add_questions(quiz_id: str, batch: QuestionsBatchCreate, db: AsyncIOMotorClient = Depends(get_db_client)):
    quizzes_collection = db["quizzify"]["quizzes"]
    questions_collection = db["quizzify"]["questions"]
    
    # Verify the quiz exists
    try:
        quiz_obj_id = ObjectId(quiz_id)
        quiz = await quizzes_collection.find_one({"_id": quiz_obj_id})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz_id format")

    questions_data = []
    for q in batch.questions:
        q_dict = q.model_dump()
        q_dict["quiz_id"] = str(quiz_id)
        questions_data.append(q_dict)
        
    result = await questions_collection.insert_many(questions_data)
    
    if result.inserted_ids:
        return {"message": f"Successfully added {len(result.inserted_ids)} questions"}
        
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to add questions"
    )
