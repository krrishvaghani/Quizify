from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from schemas.quiz_schema import QuizCreate, QuestionsBatchCreate, QuizSubmitRequest
from config.db import get_database
from bson import ObjectId
from utils.auth_bearer import JWTBearer

router = APIRouter()

def get_db_client():
    return get_database()

@router.post("/create", status_code=status.HTTP_201_CREATED, dependencies=[Depends(JWTBearer())])
async def create_quiz(quiz: QuizCreate, db: AsyncIOMotorClient = Depends(get_db_client), token_payload: dict = Depends(JWTBearer())):
    role = token_payload.get("role")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create quizzes")
        
    user_id = token_payload.get("user_id")
    quizzes_collection = db["quizzify"]["quizzes"]
    questions_collection = db["quizzify"]["questions"]
    
    quiz_dict = quiz.model_dump(exclude={"questions"})
    quiz_dict["created_by"] = user_id
    
    result = await quizzes_collection.insert_one(quiz_dict)
    
    if result.inserted_id:
        quiz_id = str(result.inserted_id)
        
        # Insert questions if provided
        if quiz.questions:
            questions_data = []
            for q in quiz.questions:
                q_dict = q.model_dump()
                q_dict["quiz_id"] = quiz_id
                questions_data.append(q_dict)
            if questions_data:
                await questions_collection.insert_many(questions_data)
                
        return {"message": "Quiz created successfully", "quiz_id": quiz_id}
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to create quiz"
    )

@router.get("/admin", dependencies=[Depends(JWTBearer())])
async def get_admin_quizzes(db: AsyncIOMotorClient = Depends(get_db_client), token_payload: dict = Depends(JWTBearer())):
    role = token_payload.get("role")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view this")
        
    user_id = token_payload.get("user_id")
    quizzes_collection = db["quizzify"]["quizzes"]
    
    cursor = quizzes_collection.find({"created_by": user_id})
    quizzes = await cursor.to_list(length=100)
    
    result = []
    for q in quizzes:
        q["quiz_id"] = str(q["_id"])
        del q["_id"]
        result.append(q)
    return result

@router.delete("/{quiz_id}", dependencies=[Depends(JWTBearer())])
async def delete_quiz(quiz_id: str, db: AsyncIOMotorClient = Depends(get_db_client), token_payload: dict = Depends(JWTBearer())):
    role = token_payload.get("role")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete quizzes")
        
    user_id = token_payload.get("user_id")
    quizzes_collection = db["quizzify"]["quizzes"]
    questions_collection = db["quizzify"]["questions"]
    
    try:
        obj_id = ObjectId(quiz_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID format")
        
    quiz = await quizzes_collection.find_one({"_id": obj_id})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if quiz.get("created_by") != user_id and role != "superadmin":
         raise HTTPException(status_code=403, detail="You can only delete your own quizzes")
         
    await quizzes_collection.delete_one({"_id": obj_id})
    await questions_collection.delete_many({"quiz_id": quiz_id})
    
    return {"message": "Quiz and associated questions deleted successfully"}

@router.post("/{quiz_id}/questions", status_code=status.HTTP_201_CREATED, dependencies=[Depends(JWTBearer())])
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

@router.get("/", dependencies=[Depends(JWTBearer())])
async def get_all_quizzes(db: AsyncIOMotorClient = Depends(get_db_client)):
    quizzes_collection = db["quizzify"]["quizzes"]
    cursor = quizzes_collection.find({})
    quizzes = await cursor.to_list(length=100)
    
    result = []
    for q in quizzes:
        q["quiz_id"] = str(q["_id"])
        del q["_id"]
        result.append(q)
    return result

@router.get("/{quiz_id}", dependencies=[Depends(JWTBearer())])
async def get_quiz(quiz_id: str, db: AsyncIOMotorClient = Depends(get_db_client)):
    quizzes_collection = db["quizzify"]["quizzes"]
    questions_collection = db["quizzify"]["questions"]
    
    try:
        quiz_obj_id = ObjectId(quiz_id)
        quiz = await quizzes_collection.find_one({"_id": quiz_obj_id})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
            
        cursor = questions_collection.find({"quiz_id": quiz_id})
        questions = await cursor.to_list(length=100)
        
        # Format questions, removing correct_answer
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
            "category_id": quiz.get("category_id", ""),
            "questions": formatted_questions
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail="Invalid quiz_id format")

@router.post("/{quiz_id}/submit", dependencies=[Depends(JWTBearer())])
async def submit_quiz(quiz_id: str, submission: QuizSubmitRequest, db: AsyncIOMotorClient = Depends(get_db_client)):
    questions_collection = db["quizzify"]["questions"]
    
    cursor = questions_collection.find({"quiz_id": quiz_id})
    questions = await cursor.to_list(length=100)
    
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for this quiz")
        
    # Map question_id to correct_answer
    correct_answers = {str(q["_id"]): q["correct_answer"] for q in questions}
    
    score = 0
    total_questions = len(questions)
    
    for ans in submission.answers:
        if ans.question_id in correct_answers and ans.selected_option == correct_answers[ans.question_id]:
            score += 1
            
    percentage = (score / total_questions) * 100 if total_questions > 0 else 0
    
    return {
        "score": score,
        "total_questions": total_questions,
        "percentage": round(percentage, 2)
    }
