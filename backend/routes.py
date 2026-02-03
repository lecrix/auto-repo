from fastapi import APIRouter, HTTPException, Body, Depends, Request
from typing import List, Optional, Dict, Any
from datetime import datetime
from slowapi import Limiter
from slowapi.util import get_remote_address
from models import Repo, Commit, Issue, CommitPatch, IssuePatch
from database import get_db
from bson import ObjectId
from auth import get_current_user
import re

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

def parse_oid(id_str: str, name: str = "id") -> ObjectId:
    """Parse string to ObjectId with proper error handling"""
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid {name} format")

# --- Repos (Cars) ---

@router.get("/repos", response_model=List[Repo])
async def get_repos(user_openid: str = Depends(get_current_user)):
    db = get_db()
    repos = []
    # Filter by user_openid for multi-tenant support
    cursor = db.repos.find({"user_openid": user_openid})
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        repos.append(doc)
    
    # Data migration: If no repos found, check for legacy data without user_openid
    if not repos:
        legacy_cursor = db.repos.find({"user_openid": None})
        legacy_count = 0
        async for doc in legacy_cursor:
            legacy_count += 1
            doc["_id"] = str(doc["_id"])
            repos.append(doc)
        
        # Assign legacy data to current user
        if legacy_count > 0:
            await db.repos.update_many(
                {"user_openid": None},
                {"$set": {"user_openid": user_openid}}
            )
    
    return repos

@router.post("/repos", response_model=Repo)
async def create_repo(repo: Repo, user_openid: str = Depends(get_current_user)):
    db = get_db()
    repo_dict = repo.dict(exclude={"id"})
    repo_dict["user_openid"] = user_openid
    result = await db.repos.insert_one(repo_dict)
    repo_id = str(result.inserted_id)
    repo_dict["_id"] = repo_id
    
    # Auto-create purchase record if purchase_cost exists
    if repo.purchase_cost and repo.purchase_cost > 0:
        purchase_commit = {
            "repo_id": repo_id,
            "user_openid": user_openid,
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
async def get_repo(repo_id: str, user_openid: str = Depends(get_current_user)):
    db = get_db()
    repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id"), "user_openid": user_openid})
        
    if repo:
        repo["_id"] = str(repo["_id"])
        return repo
    raise HTTPException(status_code=404, detail="Repo not found")

@router.put("/repos/{repo_id}")
async def update_repo(repo_id: str, repo: Repo, user_openid: str = Depends(get_current_user)):
    db = get_db()
    existing = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id"), "user_openid": user_openid})
        
    if not existing:
        raise HTTPException(status_code=404, detail="Repo not found")
        
    update_data = repo.dict(exclude_unset=True, exclude={"id", "created_at", "user_openid"})
    
    await db.repos.update_one(
        {"_id": parse_oid(repo_id, "repo_id"), "user_openid": user_openid},
        {"$set": update_data}
    )
    
    old_purchase_cost = existing.get("purchase_cost") or 0
    new_purchase_cost = repo.purchase_cost or 0
    
    if new_purchase_cost > 0 and new_purchase_cost != old_purchase_cost:
        existing_purchase_commit = await db.commits.find_one({
            "repo_id": repo_id,
            "user_openid": user_openid,
            "type": "purchase"
        })
        
        purchase_date = repo.purchase_date if repo.purchase_date else (
            existing.get("purchase_date") or datetime.now().timestamp() * 1000
        )
        
        if existing_purchase_commit:
            await db.commits.update_one(
                {"_id": existing_purchase_commit["_id"]},
                {"$set": {
                    "message": f"车辆购买成本：¥{new_purchase_cost}",
                    "cost": {
                        "parts": float(new_purchase_cost),
                        "labor": 0.0,
                        "currency": "CNY"
                    },
                    "timestamp": purchase_date
                }}
            )
        else:
            purchase_commit = {
                "repo_id": repo_id,
                "user_openid": user_openid,
                "title": "购车费用",
                "message": f"车辆购买成本：¥{new_purchase_cost}",
                "type": "purchase",
                "mileage": repo.current_mileage if repo.current_mileage else existing.get("current_mileage"),
                "cost": {
                    "parts": float(new_purchase_cost),
                    "labor": 0.0,
                    "currency": "CNY"
                },
                "closes_issues": [],
                "timestamp": purchase_date
            }
            await db.commits.insert_one(purchase_commit)
    
    return {"status": "updated", "id": repo_id}

@router.delete("/repos/{repo_id}")
async def delete_repo(repo_id: str, user_openid: str = Depends(get_current_user)):
    db = get_db()
    repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id"), "user_openid": user_openid})

    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")

    await db.repos.delete_one({"_id": parse_oid(repo_id, "repo_id"), "user_openid": user_openid})

    await db.commits.delete_many({"repo_id": repo_id, "user_openid": user_openid})
    await db.issues.delete_many({"repo_id": repo_id, "user_openid": user_openid})

    return {"status": "deleted", "id": repo_id}


# --- Commits (Records) ---

@router.get("/commits", response_model=List[Commit])
async def get_commits(
    repo_id: str,
    user_openid: str = Depends(get_current_user),
    type: Optional[str] = None,
    mileage_min: Optional[int] = None,
    mileage_max: Optional[int] = None,
    date_start: Optional[float] = None,
    date_end: Optional[float] = None,
    search: Optional[str] = None
):
    db = get_db()
    
    repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id"), "user_openid": user_openid})
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found or access denied")
    
    query: dict = {"repo_id": repo_id, "user_openid": user_openid}
    
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
async def create_commit(commit: Commit, user_openid: str = Depends(get_current_user)):
    db = get_db()
    
    repo = await db.repos.find_one({"_id": parse_oid(commit.repo_id, "repo_id"), "user_openid": user_openid})
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found or access denied")
    
    commit_dict = commit.dict(exclude={"id"})
    commit_dict["user_openid"] = user_openid
    
    result = await db.commits.insert_one(commit_dict)
    commit_dict["_id"] = str(result.inserted_id)
    
    if commit.mileage is not None:
        update_result = await db.repos.update_one(
            {
                "_id": parse_oid(commit.repo_id, "repo_id"),
                "user_openid": user_openid,
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
                "repo_id": commit.repo_id,
                "user_openid": user_openid
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
                "user_openid": user_openid,
                "status": "open",
                "due_mileage": {"$ne": None, "$lte": commit.mileage}
            },
            {"$set": {"priority": "high"}}
    )
    
    return commit_dict

@router.get("/commits/{commit_id}", response_model=Commit)
async def get_commit(commit_id: str, user_openid: str = Depends(get_current_user)):
    db = get_db()
    
    commit = await db.commits.find_one({"_id": parse_oid(commit_id, "commit_id"), "user_openid": user_openid})
    if not commit:
        raise HTTPException(status_code=404, detail="Commit not found")
    
    commit["_id"] = str(commit["_id"])
    
    return commit

@router.put("/commits/{commit_id}")
async def update_commit(commit_id: str, patch: CommitPatch, user_openid: str = Depends(get_current_user)):
    db = get_db()
    
    existing = await db.commits.find_one({"_id": parse_oid(commit_id, "commit_id"), "user_openid": user_openid})
    if not existing:
        raise HTTPException(status_code=404, detail="Commit not found")
    
    clean_data = patch.model_dump(exclude_unset=True)
    
    if not clean_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    await db.commits.update_one(
        {"_id": parse_oid(commit_id, "commit_id"), "user_openid": user_openid},
        {"$set": clean_data}
    )
    
    if "mileage" in clean_data and clean_data["mileage"]:
        repo_id = existing.get("repo_id")
        if repo_id:
            repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id"), "user_openid": user_openid})
            if repo and clean_data["mileage"] > repo.get("current_mileage", 0):
                await db.repos.update_one(
                    {"_id": parse_oid(repo_id, "repo_id"), "user_openid": user_openid},
                    {"$set": {
                        "current_mileage": clean_data["mileage"],
                        "current_head": clean_data.get("title", existing.get("title"))
                    }}
                )
    
    updated = await db.commits.find_one({"_id": parse_oid(commit_id, "commit_id"), "user_openid": user_openid})
    updated["_id"] = str(updated["_id"])
    
    return updated

@router.delete("/commits/{commit_id}")
async def delete_commit(commit_id: str, user_openid: str = Depends(get_current_user)):
    db = get_db()
    
    commit = await db.commits.find_one({"_id": parse_oid(commit_id, "commit_id"), "user_openid": user_openid})
    if not commit:
        raise HTTPException(status_code=404, detail="Commit not found")
    
    repo_id = commit.get("repo_id")
    
    result = await db.commits.delete_one({"_id": parse_oid(commit_id, "commit_id"), "user_openid": user_openid})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete commit")
    
    if repo_id:
        latest_commit = await db.commits.find_one(
            {"repo_id": repo_id, "user_openid": user_openid},
            sort=[("mileage", -1)]
        )
        
        if latest_commit:
            await db.repos.update_one(
                {"_id": parse_oid(repo_id, "repo_id"), "user_openid": user_openid},
                {"$set": {
                    "current_mileage": latest_commit.get("mileage", 0),
                    "current_head": latest_commit.get("title", "")
                }}
            )
        else:
            repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id"), "user_openid": user_openid})
            if repo:
                await db.repos.update_one(
                    {"_id": parse_oid(repo_id, "repo_id"), "user_openid": user_openid},
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
                "repo_id": repo_id,
                "user_openid": user_openid
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
async def create_issue(repo_id: str, issue: Issue, user_openid: str = Depends(get_current_user)):
    db = get_db()
    
    repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id"), "user_openid": user_openid})
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found or access denied")
    
    issue.repo_id = repo_id
    issue_dict = issue.dict(exclude={"id"})
    issue_dict["user_openid"] = user_openid
    
    result = await db.issues.insert_one(issue_dict)
    issue_dict["_id"] = str(result.inserted_id)
    return issue_dict

VALID_ISSUE_STATUSES = {"open", "closed"}

@router.get("/repos/{repo_id}/issues", response_model=List[Issue])
async def get_issues(repo_id: str, user_openid: str = Depends(get_current_user), status: Optional[str] = None):
    db = get_db()
    
    repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id"), "user_openid": user_openid})
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found or access denied")
    
    if status and status not in VALID_ISSUE_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(VALID_ISSUE_STATUSES)}")
    
    pipeline = [
        {"$match": {"repo_id": repo_id, "user_openid": user_openid}},
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
async def update_issue(issue_id: str, patch: IssuePatch = Body(...), user_openid: str = Depends(get_current_user)):
    db = get_db()
    
    clean_data = patch.model_dump(exclude_unset=True)
    
    if not clean_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    await db.issues.update_one(
        {"_id": parse_oid(issue_id, "issue_id"), "user_openid": user_openid},
        {"$set": clean_data}
    )
    
    updated_doc = await db.issues.find_one({"_id": parse_oid(issue_id, "issue_id"), "user_openid": user_openid})
    if updated_doc:
        updated_doc["_id"] = str(updated_doc["_id"])
        return updated_doc
    raise HTTPException(status_code=404, detail="Issue not found")

# --- Insights / Stats ---

@router.get("/repos/{repo_id}/stats")
@limiter.limit("60/minute")
async def get_repo_stats(request: Request, repo_id: str, user_openid: str = Depends(get_current_user)):
    db = get_db()
    
    repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id"), "user_openid": user_openid})
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
        
    current_mileage = repo.get("current_mileage", 0)
    
    pipeline = [
        {"$match": {"repo_id": repo_id, "user_openid": user_openid}},
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
async def get_repo_trends(repo_id: str, user_openid: str = Depends(get_current_user), months: int = 12):
    """
    Monthly trend aggregation for line charts
    Returns: mileage progression and cost trends by month
    """
    db = get_db()
    
    repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id"), "user_openid": user_openid})
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
    
    from datetime import datetime, timedelta
    
    now = datetime.now()
    start_date = now - timedelta(days=months * 30)
    start_timestamp = start_date.timestamp() * 1000
    
    pipeline = [
        {"$match": {
            "repo_id": repo_id,
            "user_openid": user_openid,
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
        {"$facet": {
            "all_costs": [
                {"$group": {
                    "_id": "$month",
                    "total_cost": {"$sum": {"$add": [{"$ifNull": ["$cost.parts", 0]}, {"$ifNull": ["$cost.labor", 0]}]}},
                    "max_mileage": {"$max": "$mileage"},
                    "count": {"$sum": 1}
                }},
                {"$sort": {"_id": 1}}
            ],
            "fuel_costs": [
                {"$match": {"type": "fuel"}},
                {"$group": {
                    "_id": "$month",
                    "fuel_cost": {"$sum": {"$add": [{"$ifNull": ["$cost.parts", 0]}, {"$ifNull": ["$cost.labor", 0]}]}}
                }},
                {"$sort": {"_id": 1}}
            ]
        }}
    ]
    
    result = await db.commits.aggregate(pipeline).to_list(length=1)
    
    if not result or len(result) == 0:
        return {"months": [], "total_months": 0}
    
    all_costs = result[0].get("all_costs", [])
    fuel_costs = result[0].get("fuel_costs", [])
    
    fuel_map = {item["_id"]: item["fuel_cost"] for item in fuel_costs}
    
    monthly_data = []
    for item in all_costs:
        month = item["_id"]
        monthly_data.append({
            "month": month,
            "cost": item["total_cost"],
            "mileage": item["max_mileage"],
            "fuel_cost": fuel_map.get(month, 0),
            "count": item["count"]
        })
    
    return {
        "months": monthly_data,
        "total_months": len(monthly_data)
    }

@router.get("/repos/{repo_id}/export/pdf")
@limiter.limit("10/minute")
async def export_repo_to_pdf(request: Request, repo_id: str, user_openid: str = Depends(get_current_user)):
    """
    Export vehicle maintenance history to PDF with Chinese font support
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
    except ImportError as e:
        print(f"ReportLab import failed: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation library missing: {str(e)}")

    try:
        from fastapi.responses import StreamingResponse
        from io import BytesIO
        from datetime import datetime
        import os
        
        chinese_font_name = 'ChineseFont'
        chinese_font_registered = False
        
        font_paths = [
            '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc',
            '/usr/share/fonts/truetype/wqy-microhei/wqy-microhei.ttc',
            '/usr/share/fonts/wqy-microhei/wqy-microhei.ttc',
            '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
            '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf',
            'C:/Windows/Fonts/msyh.ttc',
            'C:/Windows/Fonts/simsun.ttc',
            'C:/Windows/Fonts/simhei.ttf',
            '/System/Library/Fonts/PingFang.ttc',
            '/Library/Fonts/Arial Unicode.ttf',
        ]
        
        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    pdfmetrics.registerFont(TTFont(chinese_font_name, font_path))
                    chinese_font_registered = True
                    break
                except Exception:
                    continue
        
        if not chinese_font_registered:
            # Fallback to standard font if no Chinese font found (may cause encoding issues)
            print("Warning: No Chinese font found for PDF export")
            chinese_font_name = 'Helvetica'
        
        db = get_db()
        
        repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id"), "user_openid": user_openid})
        if not repo:
            raise HTTPException(status_code=404, detail="Repo not found")
        
        commits_cursor = db.commits.find({"repo_id": repo_id, "user_openid": user_openid}).sort("timestamp", -1)
        commits = []
        async for doc in commits_cursor:
            doc["_id"] = str(doc["_id"])
            commits.append(doc)
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.75*inch, bottomMargin=0.75*inch)
        
        story = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontName=chinese_font_name,
            fontSize=24,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontName=chinese_font_name,
            fontSize=14,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=10
        )
        
        story.append(Paragraph(f"车辆整备记录 - {repo.get('name', 'Unknown')}", title_style))
        story.append(Spacer(1, 0.2*inch))
        
        info_data = [
            ["车辆信息", ""],
            ["车辆名称", repo.get('name', 'N/A')],
            ["车架号", repo.get('vin', 'N/A')],
            ["当前里程", f"{repo.get('current_mileage', 0)} km"],
            ["导出日期", datetime.now().strftime('%Y-%m-%d')]
        ]
        
        info_table = Table(info_data, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, -1), chinese_font_name),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        
        story.append(info_table)
        story.append(Spacer(1, 0.3*inch))
        
        if commits:
            story.append(Paragraph("整备记录", heading_style))
            story.append(Spacer(1, 0.1*inch))
            
            commit_data = [["日期", "标题", "类型", "里程 (km)", "费用 (元)"]]
            
            type_map = {
                'maintenance': '常规保养',
                'repair': '维修',
                'modification': '改装',
                'fuel': '加油',
                'parking': '停车',
                'inspection': '年检',
                'insurance': '保险',
                'purchase': '购车费用',
                'other': '其他'
            }
            
            for commit in commits:
                date = datetime.fromtimestamp(commit.get('timestamp', 0) / 1000).strftime('%Y-%m-%d')
                title = commit.get('title', 'N/A')
                commit_type = type_map.get(commit.get('type', ''), commit.get('type', 'N/A'))
                mileage = commit.get('mileage')
                mileage_display = "/" if not mileage else str(mileage)
                cost = commit.get('cost', {})
                total_cost = cost.get('parts', 0) + cost.get('labor', 0)
                
                commit_data.append([date, title, commit_type, mileage_display, f"¥{total_cost:.2f}"])
            
            commit_table = Table(commit_data, colWidths=[1.2*inch, 2*inch, 1*inch, 1*inch, 1*inch])
            commit_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTNAME', (0, 0), (-1, -1), chinese_font_name),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('FONTSIZE', (0, 1), (-1, -1), 9)
            ]))
            
            story.append(commit_table)
        
        doc.build(story)
        buffer.seek(0)
        
        # RFC 5987: filename* with UTF-8 encoding for non-ASCII characters
        from urllib.parse import quote
        raw_filename = f"车辆维护记录-{repo.get('name', 'vehicle')}.pdf"
        encoded_filename = quote(raw_filename)
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
            }
        )
    except Exception as e:
        print(f"PDF Export Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF Export Failed: {str(e)}")

