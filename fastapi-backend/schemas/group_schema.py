from pydantic import BaseModel, Field
from typing import List


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    users: List[str] = []


class QuizAssignRequest(BaseModel):
    assigned_users: List[str] = []
    assigned_groups: List[str] = []
