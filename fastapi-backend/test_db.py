import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/quizzify")

async def test_db():
    print(f"Connecting to {MONGO_URI}...")
    client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    try:
        await client.server_info()
        print("Successfully connected to MongoDB.")
    except Exception as e:
        print("Failed to connect to MongoDB.")
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test_db())
