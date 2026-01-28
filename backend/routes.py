from fastapi import APIRouter, HTTPException, Body
from typing import List, Optional, Dict, Any
from models import Repo, Commit, Issue, CommitPatch, IssuePatch
from database import get_db
from bson import ObjectId
import re

router = APIRouter()

def parse_oid(id_str: str, name: str = "id") -> ObjectId:
    """Parse string to ObjectId with proper error handling"""
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid {name} format")

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
    repo_id = str(result.inserted_id)
    repo_dict["_id"] = repo_id
    
    # Auto-create purchase record if purchase_cost exists
    if repo.purchase_cost and repo.purchase_cost > 0:
        from datetime import datetime
        purchase_commit = {
            "repo_id": repo_id,
            "title": "购车费用",
            "message": f"车辆购买成本：¥{repo.purchase_cost}",
            "type": "purchase",
            "mileage": repo.current_mileage if repo.current_mileage else None,
            "cost": {
                "parts": float(repo.purchase_cost),
                "labor": 0.0,
                "currency": "CNY"
            },
            "closes_issues": [],
            "timestamp": repo.purchase_date if repo.purchase_date else datetime.now().timestamp() * 1000
        }
        await db.commits.insert_one(purchase_commit)
    
    return repo_dict

@router.get("/repos/{repo_id}", response_model=Repo)
async def get_repo(repo_id: str):
    db = get_db()
    repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id")})
        
    if repo:
        repo["_id"] = str(repo["_id"])
        return repo
    raise HTTPException(status_code=404, detail="Repo not found")

@router.put("/repos/{repo_id}")
async def update_repo(repo_id: str, repo: Repo):
    db = get_db()
    existing = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id")})
        
    if not existing:
        raise HTTPException(status_code=404, detail="Repo not found")
        
    update_data = repo.dict(exclude_unset=True, exclude={"id", "created_at"})
    
    await db.repos.update_one(
        {"_id": parse_oid(repo_id, "repo_id")},
        {"$set": update_data}
    )
    return {"status": "updated", "id": repo_id}

@router.delete("/repos/{repo_id}")
async def delete_repo(repo_id: str):
    db = get_db()
    repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id")})

    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")

    await db.repos.delete_one({"_id": parse_oid(repo_id, "repo_id")})

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
        if len(search) > 64:
            raise HTTPException(status_code=400, detail="Search query too long")
        safe_search = re.escape(search)
        query["$or"] = [
            {"title": {"$regex": safe_search, "$options": "i"}},
            {"message": {"$regex": safe_search, "$options": "i"}}
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
    
    result = await db.commits.insert_one(commit_dict)
    commit_dict["_id"] = str(result.inserted_id)
    
    if commit.mileage is not None:
        update_result = await db.repos.update_one(
            {
                "_id": parse_oid(commit.repo_id, "repo_id"),
                "current_mileage": {"$lt": commit.mileage}
            },
            {"$set": {
                "current_mileage": commit.mileage,
                "current_head": commit.title
            }}
        )

    if commit.closes_issues:
        issue_oids = [parse_oid(i_id, "issue_id") for i_id in commit.closes_issues]
        await db.issues.update_many(
            {
                "_id": {"$in": issue_oids},
                "repo_id": commit.repo_id
            },
            {"$set": {
                "status": "closed", 
                "closed_at": commit.timestamp,
                "closed_by_commit_id": commit_dict["_id"]
            }}
        )

    if commit.mileage is not None:
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
    
    commit = await db.commits.find_one({"_id": parse_oid(commit_id, "commit_id")})
    if not commit:
        raise HTTPException(status_code=404, detail="Commit not found")
    
    commit["_id"] = str(commit["_id"])
    
    return commit

@router.put("/commits/{commit_id}")
async def update_commit(commit_id: str, patch: CommitPatch):
    db = get_db()
    
    existing = await db.commits.find_one({"_id": parse_oid(commit_id, "commit_id")})
    if not existing:
        raise HTTPException(status_code=404, detail="Commit not found")
    
    clean_data = patch.model_dump(exclude_unset=True)
    
    if not clean_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    await db.commits.update_one(
        {"_id": parse_oid(commit_id, "commit_id")},
        {"$set": clean_data}
    )
    
    if "mileage" in clean_data and clean_data["mileage"]:
        repo_id = existing.get("repo_id")
        if repo_id:
            repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id")})
            if repo and clean_data["mileage"] > repo.get("current_mileage", 0):
                await db.repos.update_one(
                    {"_id": parse_oid(repo_id, "repo_id")},
                    {"$set": {
                        "current_mileage": clean_data["mileage"],
                        "current_head": clean_data.get("title", existing.get("title"))
                    }}
                )
    
    updated = await db.commits.find_one({"_id": parse_oid(commit_id, "commit_id")})
    updated["_id"] = str(updated["_id"])
    
    return updated

@router.delete("/commits/{commit_id}")
async def delete_commit(commit_id: str):
    db = get_db()
    
    commit = await db.commits.find_one({"_id": parse_oid(commit_id, "commit_id")})
    if not commit:
        raise HTTPException(status_code=404, detail="Commit not found")
    
    repo_id = commit.get("repo_id")
    
    result = await db.commits.delete_one({"_id": parse_oid(commit_id, "commit_id")})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete commit")
    
    if repo_id:
        latest_commit = await db.commits.find_one(
            {"repo_id": repo_id},
            sort=[("mileage", -1)]
        )
        
        if latest_commit:
            await db.repos.update_one(
                {"_id": parse_oid(repo_id, "repo_id")},
                {"$set": {
                    "current_mileage": latest_commit.get("mileage", 0),
                    "current_head": latest_commit.get("title", "")
                }}
            )
        else:
            repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id")})
            if repo:
                await db.repos.update_one(
                    {"_id": parse_oid(repo_id, "repo_id")},
                    {"$set": {
                        "current_mileage": repo.get("initial_mileage", 0),
                        "current_head": ""
                    }}
                )
    
    if commit.get("closes_issues"):
        issue_ids = [parse_oid(i_id, "issue_id") for i_id in commit["closes_issues"]]
        await db.issues.update_many(
            {
                "_id": {"$in": issue_ids},
                "repo_id": repo_id
            },
            {"$set": {
                "status": "open",
                "closed_at": None,
                "closed_by_commit_id": None
            }}
        )
    
    return {"message": "Commit deleted successfully", "id": commit_id}

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
    
    pipeline = [
        {"$match": {"repo_id": repo_id}},
    ]
    
    if status:
        pipeline[0]["$match"]["status"] = status
    
    pipeline.extend([
        {"$addFields": {
            "priority_order": {
                "$switch": {
                    "branches": [
                        {"case": {"$eq": ["$priority", "high"]}, "then": 0},
                        {"case": {"$eq": ["$priority", "medium"]}, "then": 1},
                        {"case": {"$eq": ["$priority", "low"]}, "then": 2}
                    ],
                    "default": 99
                }
            }
        }},
        {"$sort": {"priority_order": 1, "due_date": 1}},
        {"$project": {"priority_order": 0}}
    ])
    
    issues = []
    cursor = db.issues.aggregate(pipeline)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        issues.append(doc)

    return issues

@router.patch("/issues/{issue_id}", response_model=Issue)
async def update_issue(issue_id: str, patch: IssuePatch = Body(...)):
    db = get_db()
    
    clean_data = patch.model_dump(exclude_unset=True)
    
    if not clean_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    await db.issues.update_one(
        {"_id": parse_oid(issue_id, "issue_id")},
        {"$set": clean_data}
    )
    
    updated_doc = await db.issues.find_one({"_id": parse_oid(issue_id, "issue_id")})
    if updated_doc:
        updated_doc["_id"] = str(updated_doc["_id"])
        return updated_doc
    raise HTTPException(status_code=404, detail="Issue not found")

# --- Insights / Stats ---

@router.get("/repos/{repo_id}/stats")
async def get_repo_stats(repo_id: str):
    db = get_db()
    
    repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id")})
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
        
    current_mileage = repo.get("current_mileage", 0)
    
    pipeline = [
        {"$match": {"repo_id": repo_id}},
        {"$facet": {
            "totals": [
                {"$group": {
                    "_id": None,
                    "total_parts": {"$sum": {"$ifNull": ["$cost.parts", 0]}},
                    "total_labor": {"$sum": {"$ifNull": ["$cost.labor", 0]}},
                    "count": {"$sum": 1}
                }}
            ],
            "composition": [
                {"$group": {
                    "_id": "$type",
                    "value": {"$sum": {"$add": [{"$ifNull": ["$cost.parts", 0]}, {"$ifNull": ["$cost.labor", 0]}]}}
                }}
            ],
            "fuel": [
                {"$match": {"type": "fuel"}},
                {"$group": {
                    "_id": None,
                    "total_fuel_cost": {"$sum": {"$add": [{"$ifNull": ["$cost.parts", 0]}, {"$ifNull": ["$cost.labor", 0]}]}}
                }}
            ]
        }}
    ]
    
    result = await db.commits.aggregate(pipeline).to_list(length=1)
    
    total_cost = 0
    total_parts = 0
    total_labor = 0
    chart_data = []
    fuel_cost_per_km = 0
    
    if result:
        facets = result[0]
        
        if facets.get("totals") and len(facets["totals"]) > 0:
            totals = facets["totals"][0]
            total_parts = totals.get("total_parts", 0)
            total_labor = totals.get("total_labor", 0)
            total_cost = total_parts + total_labor
        
        if facets.get("composition"):
            chart_data = [{"name": item["_id"], "value": item["value"]} for item in facets["composition"]]
            for item in chart_data:
                item["percentage"] = round((item["value"] / total_cost) * 100, 1) if total_cost > 0 else 0
        
        if facets.get("fuel") and len(facets["fuel"]) > 0:
            total_fuel_cost = facets["fuel"][0].get("total_fuel_cost", 0)
            driven_mileage = current_mileage - repo.get("initial_mileage", 0)
            fuel_cost_per_km = round(total_fuel_cost / driven_mileage, 2) if driven_mileage > 0 else 0

    driven_mileage = current_mileage - repo.get("initial_mileage", 0)
    
    return {
        "total_cost": total_cost,
        "total_mileage": current_mileage,
        "driven_mileage": driven_mileage,
        "cost_per_km": round(total_cost / driven_mileage, 2) if driven_mileage > 0 else 0,
        "fuel_cost_per_km": fuel_cost_per_km,
        "composition": chart_data
    }

@router.get("/repos/{repo_id}/trends")
async def get_repo_trends(repo_id: str, months: int = 12):
    """
    Monthly trend aggregation for line charts
    Returns: mileage progression and cost trends by month
    """
    db = get_db()
    
    repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id")})
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
            "total_cost": {"$sum": {"$add": [{"$ifNull": ["$cost.parts", 0]}, {"$ifNull": ["$cost.labor", 0]}]}},
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

