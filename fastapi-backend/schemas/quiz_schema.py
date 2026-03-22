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
    category_id: str = Field(..., min_length=1)
    duration: int = Field(default=5, ge=1, le=180) # Duration in minutes
    questions: List[QuestionCreate] = []
        
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
