from motor.motor_asyncio import AsyncIOMotorClient
import os

class DatabaseManager:
    client: AsyncIOMotorClient = None
    db = None

    async def connect(self):
        # Default to local mongo if not specified
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        self.client = AsyncIOMotorClient(mongo_url)
        self.db = self.client.auto_repo
        print(f"Connected to MongoDB at {mongo_url}")

    async def close(self):
        if self.client:
            self.client.close()
            print("Closed MongoDB connection")

db_manager = DatabaseManager()

def get_db():
    return db_manager.db
