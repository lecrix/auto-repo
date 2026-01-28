from fastapi import APIRouter, HTTPException, Body
from typing import List, Optional, Dict, Any
from models import Repo, Commit, Issue
from database import get_db
from bson import ObjectId

router = APIRouter()

# --- Repos (Cars) ---

@router.get("/repos", response_model=List[Repo])
async def get_repos():
    db = get_db()
    repos = []
    # For Phase 1, we just return all repos
    # In real app, we would filter by user_openid
    cursor = db.repos.find()
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        repos.append(doc)
    return repos

@router.post("/repos", response_model=Repo)
async def create_repo(repo: Repo):
    db = get_db()
    repo_dict = repo.dict(exclude={"id"})
    result = await db.repos.insert_one(repo_dict)
    repo_dict["_id"] = str(result.inserted_id)
    return repo_dict

@router.get("/repos/{repo_id}", response_model=Repo)
async def get_repo(repo_id: str):
    db = get_db()
    try:
        repo = await db.repos.find_one({"_id": ObjectId(repo_id)})
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    if repo:
        repo["_id"] = str(repo["_id"])
        return repo
    raise HTTPException(status_code=404, detail="Repo not found")

@router.put("/repos/{repo_id}")
async def update_repo(repo_id: str, repo: Repo):
    db = get_db()
    # Retrieve existing to keep created_at content if needed
    try:
        existing = await db.repos.find_one({"_id": ObjectId(repo_id)})
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    if not existing:
        raise HTTPException(status_code=404, detail="Repo not found")
        
    # We exclude 'id' and 'created_at' from update to preserve them
    update_data = repo.dict(exclude_unset=True, exclude={"id", "created_at"})
    
    await db.repos.update_one(
        {"_id": ObjectId(repo_id)},
        {"$set": update_data}
    )
    return {"status": "updated", "id": repo_id}

@router.delete("/repos/{repo_id}")
async def delete_repo(repo_id: str):
    db = get_db()
    # 1. Check existence
    try:
        repo = await db.repos.find_one({"_id": ObjectId(repo_id)})
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid ID")

    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")

    # 2. Delete Repo
    await db.repos.delete_one({"_id": ObjectId(repo_id)})

    # 3. Delete associated Commits and Issues (Cascade Delete)
    await db.commits.delete_many({"repo_id": repo_id})
    await db.issues.delete_many({"repo_id": repo_id})

    return {"status": "deleted", "id": repo_id}


# --- Commits (Records) ---

@router.get("/commits", response_model=List[Commit])
async def get_commits(
    repo_id: str,
    type: Optional[str] = None,
    mileage_min: Optional[int] = None,
    mileage_max: Optional[int] = None,
    date_start: Optional[float] = None,
    date_end: Optional[float] = None,
    search: Optional[str] = None
):
    db = get_db()
    query: dict = {"repo_id": repo_id}
    
    if type:
        query["type"] = type
    if mileage_min is not None:
        if "mileage" not in query:
            query["mileage"] = {}
        query["mileage"]["$gte"] = mileage_min
    if mileage_max is not None:
        if "mileage" not in query:
            query["mileage"] = {}
        query["mileage"]["$lte"] = mileage_max
    if date_start:
        if "timestamp" not in query:
            query["timestamp"] = {}
        query["timestamp"]["$gte"] = date_start
    if date_end:
        if "timestamp" not in query:
            query["timestamp"] = {}
        query["timestamp"]["$lte"] = date_end
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"message": {"$regex": search, "$options": "i"}}
        ]
    
    commits = []
    cursor = db.commits.find(query).sort("timestamp", -1)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        commits.append(doc)
    return commits

@router.post("/commits", response_model=Commit)
async def create_commit(commit: Commit):
    db = get_db()
    commit_dict = commit.dict(exclude={"id"})
    
    # 1. Insert Commit
    result = await db.commits.insert_one(commit_dict)
    commit_dict["_id"] = str(result.inserted_id)
    
    # 2. Update Repo HEAD automatically
    # Update current_mileage and current_head pointer on the Repo
    # FIX: Only update if the new commit's mileage is greater than current (prevent rollback when backfilling)
    current_repo = await db.repos.find_one({"_id": ObjectId(commit.repo_id)})
    if current_repo and commit.mileage is not None and commit.mileage > current_repo.get("current_mileage", 0):
        await db.repos.update_one(
            {"_id": ObjectId(commit.repo_id)},
            {"$set": {
                "current_mileage": commit.mileage,
                "current_head": commit.title
            }}
        )

    # 3. AUTOMATION: Close Issues
    if commit.closes_issues:
        issue_oids = [ObjectId(i_id) for i_id in commit.closes_issues]
        await db.issues.update_many(
            {"_id": {"$in": issue_oids}},
            {"$set": {
                "status": "closed", 
                "closed_at": commit.timestamp,
                "closed_by_commit_id": commit_dict["_id"]
            }}
        )

    # 4. AUTOMATION: Check Mileage Triggers for Open Issues
    # Find and mark all issues that should be high priority in ONE bulk update
    await db.issues.update_many(
        {
            "repo_id": commit.repo_id,
            "status": "open",
            "due_mileage": {"$ne": None, "$lte": commit.mileage}
        },
        {"$set": {"priority": "high"}}
    )
    
    return commit_dict

@router.get("/commits/{commit_id}", response_model=Commit)
async def get_commit(commit_id: str):
    db = get_db()
    
    commit = await db.commits.find_one({"_id": ObjectId(commit_id)})
    if not commit:
        raise HTTPException(status_code=404, detail="Commit not found")
    
    commit["_id"] = str(commit["_id"])
    
    return commit

@router.put("/commits/{commit_id}")
async def update_commit(commit_id: str, update_data: dict):
    db = get_db()
    
    existing = await db.commits.find_one({"_id": ObjectId(commit_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Commit not found")
    
    clean_data = {k: v for k, v in update_data.items() if k not in ["id", "_id"]}
    
    if not clean_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    await db.commits.update_one(
        {"_id": ObjectId(commit_id)},
        {"$set": clean_data}
    )
    
    if "mileage" in clean_data and clean_data["mileage"]:
        repo_id = clean_data.get("repo_id") or existing.get("repo_id")
        if repo_id:
            repo = await db.repos.find_one({"_id": ObjectId(repo_id)})
            if repo and clean_data["mileage"] > repo.get("current_mileage", 0):
                await db.repos.update_one(
                    {"_id": ObjectId(repo_id)},
                    {"$set": {
                        "current_mileage": clean_data["mileage"],
                        "current_head": clean_data.get("title", existing.get("title"))
                    }}
                )
    
    updated = await db.commits.find_one({"_id": ObjectId(commit_id)})
    updated["_id"] = str(updated["_id"])
    
    return updated

@router.delete("/commits/{commit_id}")
async def delete_commit(commit_id: str):
    db = get_db()
    
    commit = await db.commits.find_one({"_id": ObjectId(commit_id)})
    if not commit:
        raise HTTPException(status_code=404, detail="Commit not found")
    
    result = await db.commits.delete_one({"_id": ObjectId(commit_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete commit")
    
    return {"message": "Commit deleted successfully", "id": commit_id}
    raise HTTPException(status_code=404, detail="Commit not found")

# --- Issues (Reminders/Tasks) ---

@router.post("/repos/{repo_id}/issues", response_model=Issue)
async def create_issue(repo_id: str, issue: Issue):
    db = get_db()
    issue.repo_id = repo_id # Ensure repo_id matches path
    issue_dict = issue.dict(exclude={"id"})
    
    result = await db.issues.insert_one(issue_dict)
    issue_dict["_id"] = str(result.inserted_id)
    return issue_dict

@router.get("/repos/{repo_id}/issues", response_model=List[Issue])
async def get_issues(repo_id: str, status: Optional[str] = None):
    db = get_db()
    query = {"repo_id": repo_id}
    if status:
        query["status"] = status
        
    issues = []
    # FIX: Sort in memory because alphabetical sort (high < low < medium) is incorrect
    # We want: High -> Medium -> Low
    cursor = db.issues.find(query)

    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        issues.append(doc)

    # Custom sort priority
    priority_map = {"high": 0, "medium": 1, "low": 2}
    issues.sort(key=lambda x: (priority_map.get(x.get("priority"), 99), x.get("due_date") or float('inf')))

    return issues

@router.patch("/issues/{issue_id}", response_model=Issue)
async def update_issue(issue_id: str, update_data: Dict[str, Any] = Body(...)):
    db = get_db()
    # Filter out fields that shouldn't be touched directly if needed
    # For now allow full update
    
    await db.issues.update_one(
        {"_id": ObjectId(issue_id)},
        {"$set": update_data}
    )
    
    updated_doc = await db.issues.find_one({"_id": ObjectId(issue_id)})
    if updated_doc:
        updated_doc["_id"] = str(updated_doc["_id"])
        return updated_doc
    raise HTTPException(status_code=404, detail="Issue not found")

# --- Insights / Stats ---

@router.get("/repos/{repo_id}/stats")
async def get_repo_stats(repo_id: str):
    db = get_db()
    
    # 1. Basic Repo Info
    repo = await db.repos.find_one({"_id": ObjectId(repo_id)})
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
        
    current_mileage = repo.get("current_mileage", 0)
    
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
    
    stats_result = await db.commits.aggregate(pipeline).to_list(length=1)
    
    total_cost = 0
    total_parts = 0
    total_labor = 0
    
    if stats_result:
        res = stats_result[0]
        total_parts = res.get("total_parts", 0)
        total_labor = res.get("total_labor", 0)
        total_cost = total_parts + total_labor
    
    purchase_cost = repo.get("purchase_cost", 0) or 0
    total_cost = total_cost + purchase_cost
        
    # 3. Cost Composition (for Pie Chart)
    # Simple grouping by 'type' (Maintenance, Modification, Repair)
    composition_pipeline = [
        {"$match": {"repo_id": repo_id}},
        {"$group": {
            "_id": "$type", 
            "value": {"$sum": {"$add": ["$cost.parts", "$cost.labor"]}}
        }}
    ]
    composition = await db.commits.aggregate(composition_pipeline).to_list(length=10)
    # Format for charts: [{"name": "Maintenance", "value": 1200}, ...]
    chart_data = [{"name": item["_id"], "value": item["value"]} for item in composition]

    return {
        "total_cost": total_cost,
        "total_mileage": current_mileage,
        "driven_mileage": current_mileage - repo.get("initial_mileage", 0),
        "cost_per_km": round(total_cost / (current_mileage - repo.get("initial_mileage", 0)), 2) if (current_mileage - repo.get("initial_mileage", 0)) > 0 else 0,
        "composition": chart_data
    }

@router.get("/repos/{repo_id}/trends")
async def get_repo_trends(repo_id: str, months: int = 12):
    """
    Monthly trend aggregation for line charts
    Returns: mileage progression and cost trends by month
    """
    db = get_db()
    
    repo = await db.repos.find_one({"_id": ObjectId(repo_id)})
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
    
    from datetime import datetime, timedelta
    
    now = datetime.now()
    start_date = now - timedelta(days=months * 30)
    start_timestamp = start_date.timestamp() * 1000
    
    pipeline = [
        {"$match": {
            "repo_id": repo_id,
            "timestamp": {"$gte": start_timestamp}
        }},
        {"$addFields": {
            "month": {
                "$dateToString": {
                    "format": "%Y-%m",
                    "date": {"$toDate": "$timestamp"}
                }
            }
        }},
        {"$group": {
            "_id": "$month",
            "total_cost": {"$sum": {"$add": ["$cost.parts", "$cost.labor"]}},
            "max_mileage": {"$max": "$mileage"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    trends = await db.commits.aggregate(pipeline).to_list(length=100)
    
    monthly_data = []
    for item in trends:
        monthly_data.append({
            "month": item["_id"],
            "cost": item["total_cost"],
            "mileage": item["max_mileage"],
            "count": item["count"]
        })
    
    return {
        "months": monthly_data,
        "total_months": len(monthly_data)
    }

