from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from motor.motor_asyncio import AsyncIOMotorClient
from config.db import get_database
from utils.auth import admin_required
from bson import ObjectId
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import csv
import io
from schemas.group_schema import GroupCreate, QuizAssignRequest
from schemas.quiz_schema import QuestionBankCreate
from routes.ai_routes import get_ai_settings, generate_questions_from_text, extract_text_from_upload, DEFAULT_AI_SETTINGS
from models.user_model import UserModel

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])


class BlockUserRequest(BaseModel):
    is_blocked: bool


class AISettingsUpdateRequest(BaseModel):
    enabled: bool
    default_prompt: str
    difficulty: str
    questions_limit: int


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UserRoleUpdateRequest(BaseModel):
    role: str


class TokenExpirySettingsRequest(BaseModel):
    token_expiry_minutes: int

def get_db_client():
    return get_database()

@router.get("/dashboard")
async def get_admin_dashboard(db: AsyncIOMotorClient = Depends(get_db_client), user: dict = Depends(admin_required)):
    print(f"--> [BACKEND LOG] Admin Dashboard API called by user_id: {user.get('user_id')}")
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


@router.get("/quiz-analytics")
async def get_quiz_analytics(
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    attempts_col = db["quizzify"]["attempts"]
    quizzes_col = db["quizzify"]["quizzes"]

    analytics_pipeline = [
        {
            "$group": {
                "_id": "$quiz_id",
                "total_attempts": {"$sum": 1},
                "average_score": {"$avg": "$percentage"},
                "highest_score": {"$max": "$percentage"},
            }
        },
        {
            "$project": {
                "_id": 0,
                "quiz_id": "$_id",
                "total_attempts": 1,
                "average_score": {"$round": [{"$ifNull": ["$average_score", 0]}, 2]},
                "highest_score": {"$round": [{"$ifNull": ["$highest_score", 0]}, 2]},
            }
        },
        {"$sort": {"total_attempts": -1}},
    ]

    analytics = await attempts_col.aggregate(analytics_pipeline).to_list(length=500)

    quiz_object_ids = []
    for row in analytics:
        try:
            quiz_object_ids.append(ObjectId(row["quiz_id"]))
        except Exception:
            continue

    quiz_title_map = {}
    if quiz_object_ids:
        quiz_docs = await quizzes_col.find({"_id": {"$in": quiz_object_ids}}).to_list(length=500)
        quiz_title_map = {str(doc["_id"]): doc.get("title", "Untitled Quiz") for doc in quiz_docs}

    result = []
    for row in analytics:
        quiz_id = row.get("quiz_id")

        hardest_pipeline = [
            {"$match": {"quiz_id": quiz_id, "questions": {"$exists": True, "$ne": []}}},
            {"$unwind": "$questions"},
            {
                "$group": {
                    "_id": "$questions.question",
                    "attempts": {"$sum": 1},
                    "correct": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$questions.is_correct", True]},
                                1,
                                0,
                            ]
                        }
                    },
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "question": "$_id",
                    "correct_rate": {
                        "$cond": [
                            {"$eq": ["$attempts", 0]},
                            1,
                            {"$divide": ["$correct", "$attempts"]},
                        ]
                    },
                }
            },
            {"$sort": {"correct_rate": 1}},
            {"$limit": 1},
        ]

        hardest = await attempts_col.aggregate(hardest_pipeline).to_list(length=1)
        hardest_question = hardest[0]["question"] if hardest else "N/A"

        result.append(
            {
                "quiz_id": quiz_id,
                "quiz_title": quiz_title_map.get(quiz_id, "Unknown Quiz"),
                "total_attempts": row.get("total_attempts", 0),
                "average_score": row.get("average_score", 0),
                "highest_score": row.get("highest_score", 0),
                "hardest_question": hardest_question,
            }
        )

    return result


@router.get("/users")
async def get_all_users(
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    users_col = db["quizzify"]["users"]

    users_pipeline = [
        {"$match": {"is_deleted": {"$ne": True}}},
        {"$addFields": {"user_id": {"$toString": "$_id"}}},
        {
            "$lookup": {
                "from": "attempts",
                "let": {"uid": "$user_id"},
                "pipeline": [
                    {"$match": {"$expr": {"$eq": ["$user_id", "$$uid"]}}},
                    {"$project": {"_id": 0, "percentage": 1}},
                ],
                "as": "attempt_docs",
            }
        },
        {
            "$project": {
                "_id": 0,
                "user_id": 1,
                "username": "$name",
                "email": 1,
                "role": {"$ifNull": ["$role", "user"]},
                "total_attempts": {"$size": "$attempt_docs"},
                "average_score": {
                    "$round": [{"$ifNull": [{"$avg": "$attempt_docs.percentage"}, 0]}, 2]
                },
                "is_blocked": {"$ifNull": ["$is_blocked", False]},
                "is_deleted": {"$ifNull": ["$is_deleted", False]},
            }
        },
        {"$sort": {"role": 1, "username": 1}},
    ]

    users = await users_col.aggregate(users_pipeline).to_list(length=1000)
    return users


@router.delete("/user/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    users_col = db["quizzify"]["users"]
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    target_user = await users_col.find_one({"_id": user_object_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Admin users cannot be deleted")

    await users_col.update_one(
        {"_id": user_object_id},
        {"$set": {"is_deleted": True}},
    )

    return {
        "message": "User deleted successfully",
        "is_deleted": True,
    }


@router.put("/user/{user_id}/block")
async def block_or_unblock_user(
    user_id: str,
    payload: BlockUserRequest,
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    users_col = db["quizzify"]["users"]

    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    target_user = await users_col.find_one({"_id": user_object_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Admin users cannot be blocked")

    if target_user.get("is_deleted", False):
        raise HTTPException(status_code=400, detail="Deleted users cannot be blocked or unblocked")

    await users_col.update_one(
        {"_id": user_object_id},
        {"$set": {"is_blocked": payload.is_blocked}},
    )

    status_text = "blocked" if payload.is_blocked else "unblocked"
    return {"message": f"User {status_text} successfully", "is_blocked": payload.is_blocked}


@router.put("/user/{user_id}/role")
async def update_user_role(
    user_id: str,
    payload: UserRoleUpdateRequest,
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    users_col = db["quizzify"]["users"]
    role = payload.role.strip().lower()
    if role not in {"admin", "user"}:
        raise HTTPException(status_code=400, detail="role must be either 'admin' or 'user'")

    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    target_user = await users_col.find_one({"_id": user_object_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if str(target_user.get("_id")) == str(user.get("user_id")) and role != "admin":
        raise HTTPException(status_code=400, detail="You cannot remove your own admin role")

    await users_col.update_one({"_id": user_object_id}, {"$set": {"role": role}})
    return {"message": "User role updated successfully", "role": role}


@router.post("/change-password")
async def admin_change_password(
    payload: ChangePasswordRequest,
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    users_col = db["quizzify"]["users"]
    user_id = user.get("user_id")
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user token")

    admin_doc = await users_col.find_one({"_id": user_object_id})
    if not admin_doc:
        raise HTTPException(status_code=404, detail="User not found")

    if not UserModel.verify_password(payload.current_password, admin_doc.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(payload.new_password.strip()) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    hashed_new = UserModel.get_password_hash(payload.new_password)
    await users_col.update_one({"_id": user_object_id}, {"$set": {"hashed_password": hashed_new}})
    return {"message": "Password changed successfully"}


@router.get("/settings")
async def get_admin_settings(
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    settings_col = db["quizzify"]["admin_settings"]
    settings = await settings_col.find_one({"_id": "default"})
    token_expiry_minutes = int(settings.get("token_expiry_minutes", 60)) if settings else 60
    return {"token_expiry_minutes": token_expiry_minutes}


@router.put("/settings")
async def update_admin_settings(
    payload: TokenExpirySettingsRequest,
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    if payload.token_expiry_minutes < 5 or payload.token_expiry_minutes > 1440:
        raise HTTPException(status_code=400, detail="token_expiry_minutes must be between 5 and 1440")

    settings_col = db["quizzify"]["admin_settings"]
    await settings_col.update_one(
        {"_id": "default"},
        {"$set": {"token_expiry_minutes": int(payload.token_expiry_minutes)}},
        upsert=True,
    )
    return {"message": "Settings updated successfully", "token_expiry_minutes": int(payload.token_expiry_minutes)}


@router.get("/export/users/csv")
async def export_users_csv(
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    users_col = db["quizzify"]["users"]
    users = await users_col.find({}).to_list(length=5000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["user_id", "name", "email", "role", "is_blocked", "is_deleted"])

    for u in users:
        writer.writerow(
            [
                str(u.get("_id", "")),
                u.get("name", ""),
                u.get("email", ""),
                u.get("role", "user"),
                bool(u.get("is_blocked", False)),
                bool(u.get("is_deleted", False)),
            ]
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users_export.csv"},
    )


@router.get("/export/users/excel")
async def export_users_excel(
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    try:
        from openpyxl import Workbook
    except Exception:
        raise HTTPException(status_code=500, detail="openpyxl is required for excel export")

    users_col = db["quizzify"]["users"]
    users = await users_col.find({}).to_list(length=5000)

    wb = Workbook()
    ws = wb.active
    ws.title = "Users"
    ws.append(["user_id", "name", "email", "role", "is_blocked", "is_deleted"])
    for u in users:
        ws.append(
            [
                str(u.get("_id", "")),
                u.get("name", ""),
                u.get("email", ""),
                u.get("role", "user"),
                bool(u.get("is_blocked", False)),
                bool(u.get("is_deleted", False)),
            ]
        )

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=users_export.xlsx"},
    )


@router.post("/groups", status_code=status.HTTP_201_CREATED)
async def create_group(
    payload: GroupCreate,
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    groups_col = db["quizzify"]["groups"]
    users_col = db["quizzify"]["users"]

    normalized_name = payload.name.strip()
    if not normalized_name:
        raise HTTPException(status_code=400, detail="Group name is required")

    existing_group = await groups_col.find_one({"name": {"$regex": f"^{normalized_name}$", "$options": "i"}})
    if existing_group:
        raise HTTPException(status_code=400, detail="Group name already exists")

    unique_user_ids = sorted(set(payload.users or []))
    if unique_user_ids:
        valid_users_count = await users_col.count_documents(
            {
                "_id": {"$in": [ObjectId(uid) for uid in unique_user_ids if ObjectId.is_valid(uid)]},
                "role": "user",
                "is_deleted": {"$ne": True},
            }
        )
        if valid_users_count != len(unique_user_ids):
            raise HTTPException(status_code=400, detail="One or more selected users are invalid")

    result = await groups_col.insert_one({"name": normalized_name, "users": unique_user_ids})
    return {
        "message": "Group created successfully",
        "group_id": str(result.inserted_id),
        "name": normalized_name,
        "users": unique_user_ids,
    }


@router.get("/groups")
async def list_groups(
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    groups_col = db["quizzify"]["groups"]
    cursor = groups_col.find({}).sort("name", 1)
    groups = await cursor.to_list(length=500)

    result = []
    for group in groups:
        result.append(
            {
                "group_id": str(group["_id"]),
                "name": group.get("name", "Untitled Group"),
                "users": group.get("users", []),
                "user_count": len(group.get("users", [])),
            }
        )

    return result


@router.put("/quiz/{quiz_id}/assign")
async def assign_quiz(
    quiz_id: str,
    payload: QuizAssignRequest,
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    quizzes_col = db["quizzify"]["quizzes"]
    groups_col = db["quizzify"]["groups"]
    users_col = db["quizzify"]["users"]

    try:
        quiz_object_id = ObjectId(quiz_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID format")

    quiz_doc = await quizzes_col.find_one({"_id": quiz_object_id})
    if not quiz_doc:
        raise HTTPException(status_code=404, detail="Quiz not found")

    assigned_users = sorted(set(payload.assigned_users or []))
    assigned_groups = sorted(set(payload.assigned_groups or []))

    if assigned_users:
        valid_user_object_ids = [ObjectId(uid) for uid in assigned_users if ObjectId.is_valid(uid)]
        valid_users_count = await users_col.count_documents(
            {
                "_id": {"$in": valid_user_object_ids},
                "role": "user",
                "is_deleted": {"$ne": True},
            }
        )
        if valid_users_count != len(assigned_users):
            raise HTTPException(status_code=400, detail="One or more assigned users are invalid")

    if assigned_groups:
        valid_group_object_ids = [ObjectId(gid) for gid in assigned_groups if ObjectId.is_valid(gid)]
        valid_groups_count = await groups_col.count_documents({"_id": {"$in": valid_group_object_ids}})
        if valid_groups_count != len(assigned_groups):
            raise HTTPException(status_code=400, detail="One or more assigned groups are invalid")

    await quizzes_col.update_one(
        {"_id": quiz_object_id},
        {
            "$set": {
                "assigned_users": assigned_users,
                "assigned_groups": assigned_groups,
            }
        },
    )

    return {
        "message": "Quiz assignment updated successfully",
        "quiz_id": quiz_id,
        "assigned_users": assigned_users,
        "assigned_groups": assigned_groups,
    }


@router.post("/questions", status_code=status.HTTP_201_CREATED)
async def create_question_bank_question(
    payload: QuestionBankCreate,
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    questions_col = db["quizzify"]["questions"]

    question_doc = payload.model_dump()
    result = await questions_col.insert_one(question_doc)

    return {
        "message": "Question added to bank successfully",
        "question_id": str(result.inserted_id),
    }


@router.get("/questions")
async def get_question_bank_questions(
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    questions_col = db["quizzify"]["questions"]
    cursor = questions_col.find(
        {
            "$or": [
                {"quiz_id": {"$exists": False}},
                {"quiz_id": None},
            ]
        }
    ).sort("_id", -1)

    questions = await cursor.to_list(length=1000)
    result = []
    for q in questions:
        result.append(
            {
                "question_id": str(q["_id"]),
                "question": q.get("question") or q.get("text", ""),
                "options": q.get("options", []),
                "correct_answer": q.get("correct_answer", ""),
                "category": q.get("category", "General"),
                "difficulty": q.get("difficulty", "medium"),
            }
        )

    return result


@router.get("/ai-settings")
async def get_admin_ai_settings(
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    settings = await get_ai_settings(db)
    return settings


@router.put("/ai-settings")
async def update_admin_ai_settings(
    payload: AISettingsUpdateRequest,
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    difficulty = payload.difficulty.strip().lower()
    if difficulty not in {"easy", "medium", "hard"}:
        raise HTTPException(status_code=400, detail="difficulty must be one of: easy, medium, hard")

    questions_limit = int(payload.questions_limit)
    if questions_limit < 1 or questions_limit > 50:
        raise HTTPException(status_code=400, detail="questions_limit must be between 1 and 50")

    default_prompt = payload.default_prompt.strip() or DEFAULT_AI_SETTINGS["default_prompt"]

    settings_doc = {
        "enabled": bool(payload.enabled),
        "default_prompt": default_prompt,
        "difficulty": difficulty,
        "questions_limit": questions_limit,
    }

    settings_col = db["quizzify"]["ai_settings"]
    await settings_col.update_one(
        {"_id": "default"},
        {"$set": settings_doc},
        upsert=True,
    )

    return {"message": "AI settings updated successfully", **settings_doc}


@router.post("/import-quiz")
async def import_quiz_from_file(
    file: UploadFile = File(...),
    num_questions: int = Form(10),
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    settings = await get_ai_settings(db)
    if not settings.get("enabled", True):
        raise HTTPException(status_code=403, detail="AI generation is currently disabled by admin settings")

    limited_questions = max(1, min(int(num_questions), int(settings.get("questions_limit", 20))))
    extracted_text = await extract_text_from_upload(file)
    generated = await generate_questions_from_text(
        text=extracted_text,
        num_questions=limited_questions,
        settings=settings,
    )

    return {
        "message": "Quiz imported successfully",
        "questions": generated.get("questions", []),
        "source": generated.get("source", "fallback"),
    }
