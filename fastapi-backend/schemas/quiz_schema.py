from pydantic import BaseModel, Field, field_validator
from typing import List

class QuizCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    category_id: str = Field(..., min_length=1)

class QuestionCreate(BaseModel):
    text: str = Field(..., min_length=3)
    options: List[str] = Field(..., min_length=2, max_length=4)
    correct_answer: str = Field(...)
    
    @field_validator("correct_answer")
    @classmethod
    def answer_must_be_in_options(cls, v: str, info) -> str:
        if "options" in info.data and v not in info.data["options"]:
            raise ValueError("correct_answer must be one of the provided options")
        return v
        
class QuestionsBatchCreate(BaseModel):
    questions: List[QuestionCreate] = Field(..., min_length=1)
