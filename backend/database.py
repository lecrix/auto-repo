from typing import Any
import os


class DatabaseManager:
    def __init__(self) -> None:
        self.client: Any = None
        self.db: Any = None

    async def connect(self) -> None:
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            self.client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000)
            await self.client.server_info()  # type: ignore
            self.db = self.client.auto_repo  # type: ignore
            print(f"Connected to MongoDB at {mongo_url}")
        except Exception as e:
            print(f"Warning: Could not connect to MongoDB ({e}). Using Mock Database.")
            import mock_db  # type: ignore[import-not-found]
            self.db = mock_db.MockDatabase()
            self.client = None

    async def create_indexes(self) -> None:
        """Create database indexes for common queries"""
        if not self.client:
            return
        
        await self.db.repos.create_index("user_openid")
        
        await self.db.commits.create_index([
            ("user_openid", 1),
            ("repo_id", 1),
            ("timestamp", -1)
        ])
        
        await self.db.issues.create_index([
            ("user_openid", 1),
            ("repo_id", 1),
            ("status", 1)
        ])
        
        await self.db.issues.create_index([
            ("user_openid", 1),
            ("repo_id", 1),
            ("due_mileage", 1),
            ("status", 1)
        ])

    async def close(self) -> None:
        if self.client:
            self.client.close()
            print("Closed MongoDB connection")

db_manager = DatabaseManager()

def get_db() -> Any:
    return db_manager.db
