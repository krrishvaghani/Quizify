from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from schemas.category_schema import CategoryCreate
from config.db import get_database
from utils.auth import get_current_user, admin_required

router = APIRouter(tags=["Categories"])


def get_db_client():
    return get_database()


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_category(
    category: CategoryCreate,
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(admin_required),
):
    categories_collection = db["quizzify"]["categories"]

    # Check for duplicate category name (case-insensitive)
    existing = await categories_collection.find_one(
        {"name": {"$regex": f"^{category.name}$", "$options": "i"}}
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A category with this name already exists",
        )

    category_doc = {
        "name": category.name,
        "created_by": user.get("user_id"),
    }

    result = await categories_collection.insert_one(category_doc)

    if result.inserted_id:
        return {
            "message": "Category created successfully",
            "category_id": str(result.inserted_id),
            "name": category.name,
        }

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to create category",
    )


@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_categories(
    db: AsyncIOMotorClient = Depends(get_db_client),
    user: dict = Depends(get_current_user),
):
    categories_collection = db["quizzify"]["categories"]
    cursor = categories_collection.find({})
    categories = await cursor.to_list(length=200)

    result = []
    for cat in categories:
        result.append({
            "category_id": str(cat["_id"]),
            "name": cat["name"],
            "created_by": cat.get("created_by", ""),
        })

    return result
