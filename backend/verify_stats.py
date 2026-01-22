
import asyncio
from mock_db import MockDatabase
from bson import ObjectId

async def get_repo_stats_simulated(repo_id):
    db = MockDatabase()
    
    print(f"--- Simulating Stats for Repo: {repo_id} ---")
    
    # 1. Basic Repo Info
    repo = await db.repos.find_one({"_id": ObjectId(repo_id)})
    if not repo:
        print("Repo not found!")
        return
    print(f"Found Repo: {repo['name']}, Mileage: {repo.get('current_mileage')}")

    # 2. Aggregations
    pipeline = [
        {"$match": {"repo_id": repo_id}},
        {"$group": {
            "_id": None,
            "total_parts": {"$sum": "$cost.parts"},
            "total_labor": {"$sum": "$cost.labor"},
            "count": {"$sum": 1}
        }}
    ]
    
    print("Running Summary Aggregation...")
    stats_cursor = db.commits.aggregate(pipeline)
    stats_result = await stats_cursor.to_list(length=1)
    print(f"Summary Result: {stats_result}")

    # 3. Cost Composition
    composition_pipeline = [
        {"$match": {"repo_id": repo_id}},
        {"$group": {
            "_id": "$type", 
            "value": {"$sum": {"$add": ["$cost.parts", "$cost.labor"]}}
        }}
    ]
    
    print("Running Composition Aggregation...")
    comp_cursor = db.commits.aggregate(composition_pipeline)
    composition = await comp_cursor.to_list(length=10)
    print(f"Composition Result: {composition}")

async def main():
    # Use the ID from the mock_db_data.json check
    repo_id = "697228640d69d8b88ab1cbf6" 
    await get_repo_stats_simulated(repo_id)

if __name__ == "__main__":
    asyncio.run(main())
