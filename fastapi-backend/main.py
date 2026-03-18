import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.db import connect_to_mongo, close_mongo_connection
from routes.auth_routes import router as auth_router
from routes.quiz_routes import router as quiz_router

app = FastAPI(title="Quizzify API", description="Quiz Management System API")

# Setup CORS to allow React frontend connection
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database events
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Include Routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(quiz_router, prefix="/api/quiz", tags=["Quiz"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Quizzify API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
