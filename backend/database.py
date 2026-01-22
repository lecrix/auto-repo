from motor.motor_asyncio import AsyncIOMotorClient
import os

class DatabaseManager:
    client: AsyncIOMotorClient = None
    db = None

    async def connect(self):
        # Default to local mongo if not specified
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        try:
            self.client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000)
            # Trigger checking connection
            await self.client.server_info()
            self.db = self.client.auto_repo
            print(f"Connected to MongoDB at {mongo_url}")
        except Exception as e:
            print(f"Warning: Could not connect to MongoDB ({e}). Using Mock Database.")
            from mock_db import MockDatabase
            self.db = MockDatabase()
            self.client = None

    async def close(self):
        if self.client:
            self.client.close()
            print("Closed MongoDB connection")

db_manager = DatabaseManager()

def get_db():
    return db_manager.db
