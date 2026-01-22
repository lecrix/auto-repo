# Phase 3 Design: Data Visualization & Intelligent Issues

## 1. Overview
This phase introduces "Insights" and "Issues" to AutoRepo, transforming it from a passive logger to an active vehicle management system.
- **Goal**: Provide analytical insights (cost/km, trends) and actionable reminders (insurance, maintenance).
- **Core Concept**: Manage vehicle tasks as **GitHub Issues** and close them via **Commits**.

## 2. User Interface (UI)

### 2.1 Dual-Tab Repo Detail
Refactor the "Repo Detail" page into two tabs:

#### **Tab 1: Timeline (Default)**
- **Header**: Vehicle Card (unchanged).
- **Dashboard Widget**: Sticky top area showing *only* High Priority alerts (e.g., "⚠️ Insurance expires in 5 days").
- **Content**: The existing Git-style Commit Timeline.

#### **Tab 2: Insights (New)**
A dashboard-style view composed of three sections:

**A. Key Metrics (核心指标)**
- **Total Cost**: `¥35,000`
- **Total Mileage**: `42,000 km`
- **Cost Efficiency**: `¥0.83/km` (Total Cost / Total Mileage)

**B. Data Visualization (Charts)**
- **Cost Composition** (Pie Chart): Parts vs. Labor vs. Mods vs. Fixed Costs.
- **Trend Analysis** (Line Chart): Monthly spending over the last 12 months.

**C. Issues Dashboard (Reminder Center)**
- List of **Open Issues** cards.
- **Visuals**: Color-coded by priority (Red=High, Yellow=Medium, Blue=Low).
- **Content**: "Renew Insurance", "Service B due at 50,000km".

## 3. Data Schema (MongoDB)

### 3.1 New Model: `Issue`
Represents a task or reminder.
```python
class Issue(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    repo_id: str
    title: str
    description: Optional[str]
    status: str = "open"          # "open", "closed"
    priority: str = "medium"      # "high", "medium", "low"
    labels: List[str] = []        # ["maintenance", "legal", "mod"]
    
    # Triggers (OR logic)
    due_date: Optional[float] = None     # Timestamp
    due_mileage: Optional[int] = None    # Target Km
    
    # Closing info
    closed_at: Optional[float] = None
    closed_by_commit_id: Optional[str] = None
```

### 3.2 Update Model: `Commit`
Add linkage to close issues.
```python
class Commit(BaseModel):
    # ... existing fields ...
    closes_issues: List[str] = []  # List of Issue IDs
```

## 4. Business Logic

### 4.1 Mileage Watcher
- **Trigger**: When a new Commit is added.
- **Action**: Check if `current_mileage` >= `issue.due_mileage` for any open issue.
- **Result**: If met, upgrade Issue priority to **High** (Overdue).

### 4.2 Auto-Close
- **Trigger**: When a Commit with `closes_issues` is created.
- **Action**: Set corresponding Issue status to `closed`, set `closed_at` = now, `closed_by_commit_id` = commit.id.

## 5. API Endpoints

### Issues
- `POST /api/repos/{id}/issues` - Create Issue
- `GET /api/repos/{id}/issues` - List Issues (filter by status)
- `PATCH /api/issues/{id}` - Update Issue (status, priority)

### Analytics
- `GET /api/repos/{id}/stats` - Get calculated metrics (total cost, cost/km) and chart data.
