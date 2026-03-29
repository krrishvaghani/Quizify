from pydantic import BaseModel, Field, field_validator
from typing import List

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

class QuizCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    duration: int = Field(default=5, ge=1, le=180) # Duration in minutes
    question_timer: bool = Field(default=False)
    time_per_question: int | None = Field(default=None, ge=5, le=300)
    assigned_users: List[str] = []
    assigned_groups: List[str] = []
    question_ids: List[str] = []
    questions: List[QuestionCreate] = []


class QuestionBankCreate(BaseModel):
    question: str = Field(..., min_length=3)
    options: List[str] = Field(..., min_length=2, max_length=4)
    correct_answer: str = Field(...)
    category: str = Field(default="General", min_length=2, max_length=100)
    difficulty: str = Field(default="medium")

    @field_validator("correct_answer")
    @classmethod
    def bank_answer_must_be_in_options(cls, v: str, info) -> str:
        if "options" in info.data and v not in info.data["options"]:
            raise ValueError("correct_answer must be one of the provided options")
        return v

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        normalized = v.strip().lower()
        if normalized not in {"easy", "medium", "hard"}:
            raise ValueError("difficulty must be one of: easy, medium, hard")
        return normalized
        
class QuestionsBatchCreate(BaseModel):
    questions: List[QuestionCreate] = Field(..., min_length=1)

class AnswerSubmission(BaseModel):
    question_id: str
    selected_option: str

class QuizSubmitRequest(BaseModel):
    answers: List[AnswerSubmission]

class QuizResultResponse(BaseModel):
    score: int
    total_questions: int
    percentage: float
