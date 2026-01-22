
import asyncio
from mock_db import MockDatabase
from bson import ObjectId

async def main():
    try:
        print("Initializing MockDatabase...")
        db = MockDatabase()
        print("MockDatabase initialized.")
        
        print("Finding repos...")
        cursor = db.repos.find()
        
        print("Iterating cursor...")
        async for doc in cursor:
            print(f"Found doc: {doc}")
            doc["_id"] = str(doc["_id"])
            
        print("Done.")
    except Exception as e:
        print(f"CRASHED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
