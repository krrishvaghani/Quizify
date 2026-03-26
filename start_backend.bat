@echo off
echo =========================================
echo      Starting Quizzify FastAPI Backend
echo =========================================

cd fastapi-backend

IF EXIST "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) ELSE (
    echo [WARNING] No venv found! Running globally. You may encounter import errors...
)

echo Starting Uvicorn server...
uvicorn main:app --reload --port 8000
