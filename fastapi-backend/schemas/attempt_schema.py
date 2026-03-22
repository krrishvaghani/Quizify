from pydantic import BaseModel
from typing import List, Dict

class AttemptSubmit(BaseModel):
    quiz_id: str
    answers: List[Dict[str, str]] # [{'question_id': 'id', 'selected_option': 'opt'}]
    
class AttemptResponse(BaseModel):
    id: str
    user_id: str
    quiz_id: str
    quiz_title: str
    score: int
    total_questions: int
    percentage: float
    timestamp: str
