# Commit Data Structure - Implementation Reference

**Purpose**: Quick-reference code snippets for implementing search, filter, and export features

---

## PART A: BACKEND QUERY EXAMPLES (Python/FastAPI)

### 1. Enhanced GET /commits with Multiple Filters

```python
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from models import Commit
from database import get_db
from bson import ObjectId
from datetime import datetime

@router.get("/commits", response_model=List[Commit])
async def get_commits(
    repo_id: str = Query(...),
    type_filter: Optional[str] = Query(None),
    min_mileage: Optional[int] = Query(None),
    max_mileage: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),  # ISO format "2026-01-01"
    end_date: Optional[str] = Query(None),    # ISO format "2026-01-31"
    search: Optional[str] = Query(None),       # Title/message search
    min_cost: Optional[float] = Query(None),
    max_cost: Optional[float] = Query(None),
    skip: int = Query(0),
    limit: int = Query(50)
):
    """
    List commits with filtering, searching, and pagination.
    
    Query Examples:
    - /commits?repo_id=123&type_filter=maintenance
    - /commits?repo_id=123&min_mileage=40000&max_mileage=60000
    - /commits?repo_id=123&start_date=2026-01-01&end_date=2026-01-31
    - /commits?repo_id=123&search=machine+oil
    - /commits?repo_id=123&min_cost=100&max_cost=500
    """
    db = get_db()
    query = {"repo_id": repo_id}
    
    # Type filter
    if type_filter:
        query["type"] = type_filter
    
    # Mileage range
    if min_mileage or max_mileage:
        mileage_query = {}
        if min_mileage:
            mileage_query["$gte"] = min_mileage
        if max_mileage:
            mileage_query["$lte"] = max_mileage
        query["mileage"] = mileage_query
    
    # Date range (timestamps in milliseconds)
    if start_date or end_date:
        timestamp_query = {}
        if start_date:
            start_ms = int(datetime.fromisoformat(start_date).timestamp() * 1000)
            timestamp_query["$gte"] = start_ms
        if end_date:
            end_ms = int(datetime.fromisoformat(end_date).timestamp() * 1000)
            timestamp_query["$lte"] = end_ms
        query["timestamp"] = timestamp_query
    
    # Cost filter (total = parts + labor)
    if min_cost or max_cost:
        # Using aggregation for cost range
        if min_cost:
            query["$expr"] = {"$gte": [
                {"$add": ["$cost.parts", "$cost.labor"]},
                min_cost
            ]}
        if max_cost:
            if "$expr" in query:
                # AND condition
                query["$expr"] = {"$and": [
                    query["$expr"],
                    {"$lte": [
                        {"$add": ["$cost.parts", "$cost.labor"]},
                        max_cost
                    ]}
                ]}
            else:
                query["$expr"] = {"$lte": [
                    {"$add": ["$cost.parts", "$cost.labor"]},
                    max_cost
                ]}
    
    # Text search (requires text index on title + message)
    if search:
        query["$text"] = {"$search": search}
    
    commits = []
    cursor = db.commits.find(query).sort("timestamp", -1).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        commits.append(doc)
    
    return commits
```

**Setup MongoDB Text Index** (run once):
```python
# In database initialization or migration script
db.commits.create_index([("title", "text"), ("message", "text")])
```

---

### 2. Full-Text Search Endpoint (Alternative)

```python
@router.get("/commits/search", response_model=List[Commit])
async def search_commits(
    repo_id: str = Query(...),
    q: str = Query(...)  # Search query
):
    """
    Full-text search in title and message fields.
    
    Example: /commits/search?repo_id=123&q=oil+filter
    """
    db = get_db()
    
    # Case-insensitive regex search
    pattern = {"$regex": q, "$options": "i"}
    query = {
        "repo_id": repo_id,
        "$or": [
            {"title": pattern},
            {"message": pattern}
        ]
    }
    
    commits = []
    cursor = db.commits.find(query).sort("timestamp", -1)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        commits.append(doc)
    
    return commits
```

---

### 3. Export Endpoint (CSV)

```python
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import csv
import io
from datetime import datetime

@router.get("/commits/export")
async def export_commits(repo_id: str, format: str = "csv"):
    """
    Export all commits as CSV or JSON.
    
    Example: /commits/export?repo_id=123&format=csv
    """
    db = get_db()
    
    # Get repo info for header
    repo = await db.repos.find_one({"_id": ObjectId(repo_id)})
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
    
    # Get all commits
    commits = []
    cursor = db.commits.find({"repo_id": repo_id}).sort("timestamp", -1)
    async for doc in cursor:
        commits.append(doc)
    
    if format == "csv":
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "ID", "标题", "类型", "里程(km)", "日期", 
            "配件费(¥)", "工时费(¥)", "总计(¥)", "详细描述"
        ])
        
        # Rows
        for commit in commits:
            date_str = datetime.fromtimestamp(commit["timestamp"] / 1000).strftime("%Y-%m-%d")
            cost_parts = commit.get("cost", {}).get("parts", 0)
            cost_labor = commit.get("cost", {}).get("labor", 0)
            total_cost = cost_parts + cost_labor
            
            writer.writerow([
                str(commit["_id"])[:8],  # Short ID
                commit["title"],
                commit["type"],
                commit["mileage"],
                date_str,
                f"{cost_parts:.2f}",
                f"{cost_labor:.2f}",
                f"{total_cost:.2f}",
                commit.get("message", "")[:50]  # Truncate message
            ])
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment;filename=commits.csv"}
        )
    
    elif format == "json":
        export_data = {
            "vehicle": {
                "id": repo_id,
                "name": repo.get("name", "Unknown"),
                "current_mileage": repo.get("current_mileage", 0),
                "export_date": datetime.now().isoformat()
            },
            "commits": [
                {
                    "id": str(c["_id"]),
                    "title": c["title"],
                    "type": c["type"],
                    "mileage": c["mileage"],
                    "date": datetime.fromtimestamp(c["timestamp"] / 1000).isoformat(),
                    "cost_parts": c.get("cost", {}).get("parts", 0),
                    "cost_labor": c.get("cost", {}).get("labor", 0),
                    "cost_total": c.get("cost", {}).get("parts", 0) + c.get("cost", {}).get("labor", 0),
                    "message": c.get("message", "")
                }
                for c in commits
            ],
            "summary": {
                "total_records": len(commits),
                "total_cost": sum(
                    c.get("cost", {}).get("parts", 0) + c.get("cost", {}).get("labor", 0)
                    for c in commits
                ),
                "date_range": {
                    "earliest": datetime.fromtimestamp(
                        min([c["timestamp"] for c in commits]) / 1000
                    ).isoformat() if commits else None,
                    "latest": datetime.fromtimestamp(
                        max([c["timestamp"] for c in commits]) / 1000
                    ).isoformat() if commits else None
                }
            }
        }
        
        return export_data
```

---

## PART B: FRONTEND API CALLS (TypeScript)

### 1. Updated API Service with Filters

```typescript
// services/api.ts

interface CommitFilters {
  type?: string;
  minMileage?: number;
  maxMileage?: number;
  startDate?: string;  // ISO format "2026-01-01"
  endDate?: string;
  search?: string;
  minCost?: number;
  maxCost?: number;
  skip?: number;
  limit?: number;
}

export const getCommitsFiltered = (repoId: string, filters: CommitFilters) => {
  let url = `/commits?repo_id=${repoId}`;
  
  if (filters.type) url += `&type_filter=${filters.type}`;
  if (filters.minMileage !== undefined) url += `&min_mileage=${filters.minMileage}`;
  if (filters.maxMileage !== undefined) url += `&max_mileage=${filters.maxMileage}`;
  if (filters.startDate) url += `&start_date=${filters.startDate}`;
  if (filters.endDate) url += `&end_date=${filters.endDate}`;
  if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
  if (filters.minCost !== undefined) url += `&min_cost=${filters.minCost}`;
  if (filters.maxCost !== undefined) url += `&max_cost=${filters.maxCost}`;
  if (filters.skip !== undefined) url += `&skip=${filters.skip}`;
  if (filters.limit !== undefined) url += `&limit=${filters.limit}`;
  
  return request(url, 'GET');
};

export const searchCommits = (repoId: string, query: string) => {
  return request(`/commits/search?repo_id=${repoId}&q=${encodeURIComponent(query)}`, 'GET');
};

export const exportCommits = (repoId: string, format: 'csv' | 'json' = 'csv') => {
  return request(`/commits/export?repo_id=${repoId}&format=${format}`, 'GET');
};
```

### 2. Page Example: Filter UI

```typescript
// pages/commit-filter/index.ts

Page({
  data: {
    repoId: '',
    filters: {
      type: '',
      minMileage: '',
      maxMileage: '',
      startDate: '',
      endDate: '',
      search: '',
      minCost: '',
      maxCost: ''
    },
    results: [] as any[],
    loading: false,
    typeOptions: [
      { label: '全部类型', value: '' },
      { label: '常规保养', value: 'maintenance' },
      { label: '故障维修', value: 'repair' },
      { label: '改装升级', value: 'modification' }
    ]
  },

  onLoad(options: any) {
    this.data.repoId = options.repoId;
  },

  onFilterChange(e: any) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`filters.${field}`]: e.detail.value
    });
  },

  async onSearch() {
    this.setData({ loading: true });
    try {
      const results = await getCommitsFiltered(this.data.repoId, {
        type: this.data.filters.type || undefined,
        minMileage: this.data.filters.minMileage ? parseInt(this.data.filters.minMileage) : undefined,
        maxMileage: this.data.filters.maxMileage ? parseInt(this.data.filters.maxMileage) : undefined,
        startDate: this.data.filters.startDate || undefined,
        endDate: this.data.filters.endDate || undefined,
        search: this.data.filters.search || undefined,
        minCost: this.data.filters.minCost ? parseFloat(this.data.filters.minCost) : undefined,
        maxCost: this.data.filters.maxCost ? parseFloat(this.data.filters.maxCost) : undefined
      });
      this.setData({ results });
    } catch (err: any) {
      wx.showToast({ title: err.message || '搜索失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async onExport() {
    wx.showLoading({ title: '导出中...' });
    try {
      const data = await exportCommits(this.data.repoId, 'csv');
      // Handle download (WeChat-specific)
      wx.showToast({ title: '已导出', icon: 'success' });
    } catch (err: any) {
      wx.showToast({ title: err.message || '导出失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});
```

---

## PART C: DATA TRANSFORMATION EXAMPLES

### Convert Timestamp to Display Format

```typescript
// Convert from milliseconds (storage) to display string
const formatCommitDate = (timestampMs: number): string => {
  const date = new Date(timestampMs);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // Result: "2026/01/27"
};

const formatCommitDateTime = (timestampMs: number): string => {
  const date = new Date(timestampMs);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  // Result: "2026/01/27 10:35:27"
};

// Convert from ISO string (user input) to milliseconds (storage)
const dateStringToTimestamp = (isoString: string): number => {
  return new Date(isoString).getTime();
  // Input: "2026-01-27"
  // Output: 1706332800000
};
```

### Calculate Cost Totals

```typescript
const calculateCostTotal = (commit: any): number => {
  if (!commit.cost) return 0;
  return (commit.cost.parts || 0) + (commit.cost.labor || 0);
};

const formatCurrency = (value: number): string => {
  return `¥ ${value.toFixed(2)}`;
};

const calculateAverageCostPerKm = (totalCost: number, totalMileage: number): string => {
  if (totalMileage === 0) return '¥ 0.00';
  return `¥ ${(totalCost / totalMileage).toFixed(4)}/km`;
};
```

---

## PART D: TYPE DEFINITIONS

### TypeScript Interfaces

```typescript
// Complete Commit interface
interface Commit {
  _id?: string;
  id?: string;
  repo_id: string;
  title: string;
  message?: string;
  mileage: number;
  type: CommitType;
  cost?: {
    parts: number;
    labor: number;
    currency: string;
  };
  closes_issues: string[];
  timestamp: number;
  // Frontend-only fields (added during formatting)
  date?: string;
  date_time?: string;
  cost_total?: number;
}

type CommitType = 'maintenance' | 'repair' | 'modification';

interface CommitFilters {
  type?: CommitType;
  minMileage?: number;
  maxMileage?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  minCost?: number;
  maxCost?: number;
}

interface CommitExport {
  vehicle: {
    id: string;
    name: string;
    current_mileage: number;
    export_date: string;
  };
  commits: Array<{
    id: string;
    title: string;
    type: CommitType;
    mileage: number;
    date: string;
    cost_total: number;
  }>;
  summary: {
    total_records: number;
    total_cost: number;
    cost_per_km: number;
  };
}
```

---

## PART E: TESTING QUERIES

### Example MongoDB Queries (for manual testing)

```javascript
// Find all maintenance commits for a repo
db.commits.find({
  "repo_id": "67950a1b2b6e4a0987654321",
  "type": "maintenance"
}).sort({ "timestamp": -1 }).pretty()

// Find commits between 40k-60k km
db.commits.find({
  "repo_id": "67950a1b2b6e4a0987654321",
  "mileage": { "$gte": 40000, "$lte": 60000 }
})

// Find commits costing more than ¥500
db.commits.find({
  "repo_id": "67950a1b2b6e4a0987654321",
  "$expr": {
    "$gte": [
      { "$add": ["$cost.parts", "$cost.labor"] },
      500
    ]
  }
})

// Text search (requires index)
db.commits.find({
  "repo_id": "67950a1b2b6e4a0987654321",
  "$text": { "$search": "oil" }
})

// Commits in date range
db.commits.find({
  "repo_id": "67950a1b2b6e4a0987654321",
  "timestamp": {
    "$gte": 1704067200000,  // 2024-01-01
    "$lte": 1735689599000   // 2024-12-31
  }
})
```

---

## PART F: VALIDATION RULES (Backend)

```python
from pydantic import BaseModel, Field, validator
from typing import Optional

class Cost(BaseModel):
    parts: float = Field(ge=0)  # Non-negative
    labor: float = Field(ge=0)
    currency: str = "CNY"

class Commit(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    repo_id: str
    title: str = Field(min_length=1, max_length=200)
    message: Optional[str] = Field(max_length=2000)
    mileage: int = Field(ge=0)
    type: str
    cost: Optional[Cost] = None
    closes_issues: list[str] = []
    timestamp: float = Field(default_factory=lambda: datetime.now().timestamp() * 1000)
    
    @validator('type')
    def validate_type(cls, v):
        valid_types = ['maintenance', 'repair', 'modification']
        if v not in valid_types:
            # Warning: Allow other values for backward compatibility
            print(f"Warning: Unknown commit type '{v}'")
        return v
    
    @validator('timestamp')
    def validate_timestamp(cls, v):
        # Timestamp should be recent (within ±10 years)
        current_ms = datetime.now().timestamp() * 1000
        if abs(v - current_ms) > 315360000000:  # ~10 years
            raise ValueError("Timestamp too far in past/future")
        return v
```

---

## Summary: Implementation Roadmap

| Feature | Complexity | Files to Modify | Estimated Time |
|---------|-----------|-----------------|-----------------|
| Filter by Type | Low | routes.py, api.ts | 30 min |
| Mileage Range Filter | Low | routes.py, api.ts | 30 min |
| Date Range Filter | Low | routes.py, api.ts | 45 min |
| Text Search | Medium | routes.py (needs index), api.ts | 1 hour |
| Cost Range Filter | Medium | routes.py (aggregation), api.ts | 1 hour |
| Pagination | Low | routes.py, api.ts | 30 min |
| Export CSV | Medium | routes.py, api.ts | 1.5 hours |
| Filter UI Page | Medium | new page files, components | 2 hours |
| **Total** | **Medium** | **6 files** | **~7 hours** |

