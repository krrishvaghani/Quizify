from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
import httpx
import json
import io
from pydantic import BaseModel
from utils.auth import admin_required
import PyPDF2
from docx import Document
from pptx import Presentation

router = APIRouter(prefix="/api/ai", tags=["AI Generation"])

class GenerateRequest(BaseModel):
    topic: str
    num_questions: int

@router.post("/generate-quiz")
async def generate_quiz(req: GenerateRequest, current_user: dict = Depends(admin_required)):
    prompt = f"""You are an expert quiz generator. Generate {req.num_questions} multiple-choice questions about the topic: "{req.topic}".
Return ONLY a valid JSON array of objects, with no markdown, no backticks, and no extra text.
Each object must have the following exact keys:
- "text": The question text as a string
- "options": An array of exactly 4 strings (one correct, three plausible distractors)
- "correct_answer": A string matching exactly one of the options

Example:
[
  {{
    "text": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correct_answer": "Paris"
  }}
]
"""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post("http://localhost:11434/api/generate", json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False,
                "format": "json"
            })
            response.raise_for_status()
            data = response.json()
            response_text = data.get("response", "")
            
            # The prompt asks for JSON array, and format="json" helps enforce it
            parsed_questions = json.loads(response_text)
            if not isinstance(parsed_questions, list):
                if isinstance(parsed_questions, dict) and "questions" in parsed_questions:
                    parsed_questions = parsed_questions["questions"]
                else:
                    raise ValueError("Expected a JSON array")
                
            return {"questions": parsed_questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

@router.post("/generate-from-file")
async def generate_from_file(
    file: UploadFile = File(...),
    num_questions: int = Form(...),
    current_user: dict = Depends(admin_required)
):
    text = ""
    filename = file.filename.lower()
    
    try:
        content = await file.read()
        
        if filename.endswith(".pdf"):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        elif filename.endswith(".docx"):
            doc = Document(io.BytesIO(content))
            for para in doc.paragraphs:
                if para.text:
                    text += para.text + "\n"
        elif filename.endswith(".pptx"):
            prs = Presentation(io.BytesIO(content))
            for slide in prs.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text") and shape.text:
                        text += shape.text + "\n"
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or PPTX.")
            
        # Limit text structurally preserving LLM context stability
        text = text[:3000]
        
        prompt = f"""You are an expert quiz generator. Generate {num_questions} multiple-choice questions based ONLY on the following content:
"{text}"

Return ONLY a valid JSON array of objects, with no markdown, no backticks, and no extra text.
Each object must have the following exact keys:
- "text": The question text as a string
- "options": An array of exactly 4 strings (one correct, three plausible distractors)
- "correct_answer": A string matching exactly one of the options
"""
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post("http://localhost:11434/api/generate", json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False,
                "format": "json"
            })
            response.raise_for_status()
            data = response.json()
            response_text = data.get("response", "")
            
            parsed_questions = json.loads(response_text)
            if not isinstance(parsed_questions, list):
                if isinstance(parsed_questions, dict) and "questions" in parsed_questions:
                    parsed_questions = parsed_questions["questions"]
                else:
                    raise ValueError("Expected a JSON array")
                
            return {"questions": parsed_questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz from file: {str(e)}")
