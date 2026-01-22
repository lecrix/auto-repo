from fastapi import APIRouter, HTTPException, Body
from typing import List
from models import Repo, Commit
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
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    if repo:
        repo["_id"] = str(repo["_id"])
        return repo
    raise HTTPException(status_code=404, detail="Repo not found")

# --- Commits (Records) ---

@router.get("/commits", response_model=List[Commit])
async def get_commits(repo_id: str):
    db = get_db()
    commits = []
    # Sort by timestamp descending (newest first)
    cursor = db.commits.find({"repo_id": repo_id}).sort("timestamp", -1)
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
    await db.repos.update_one(
        {"_id": ObjectId(commit.repo_id)},
        {"$set": {
            "current_mileage": commit.mileage,
            "current_head": commit.title # Or commit ID ideally, simplification for now
        }}
    )
    
    return commit_dict

@router.get("/commits/{commit_id}", response_model=Commit)
async def get_commit_detail(commit_id: str):
    db = get_db()
    try:
        commit = await db.commits.find_one({"_id": ObjectId(commit_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")

    if commit:
        commit["_id"] = str(commit["_id"])
        return commit
    raise HTTPException(status_code=404, detail="Commit not found")
