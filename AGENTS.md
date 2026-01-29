# AGENTS.md - AutoRepo Development Guide

> **Purpose**: This guide provides agentic coding assistants with essential context about AutoRepo's architecture, conventions, and workflows.

---

## 📋 Project Overview

**AutoRepo** is a Git-inspired vehicle maintenance tracking system with:
- **Frontend**: WeChat Mini Program (TypeScript + SCSS)
- **Backend**: FastAPI (Python 3.9+) with MongoDB/MockDB
- **Architecture**: RESTful API, async/await patterns throughout
- **Authentication**: JWT-based WeChat login
- **Storage**: WeChat Cloud for images (cloud1-5g2vgpovd2d7461b)

**Core Concepts**:
- `Repo` = Vehicle
- `Commit` = Maintenance/modification record (now supports images)
- `Issue` = Scheduled maintenance task/reminder
- `HEAD` = Current vehicle state (mileage, condition)

---

## 🛠 Build, Lint & Test Commands

### Backend (Python)

#### Development Server
```bash
cd backend
pip install -r requirements.txt

# Create .env file with required variables (see backend/.env.example)
# WECHAT_APPID=<your_appid>
# WECHAT_SECRET=<your_secret>
# JWT_SECRET=<random_secret_key>

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Testing
⚠️ **No test framework currently configured**. When implementing tests:
- Use `pytest` for backend tests
- Place tests in `backend/tests/` directory
- Name test files: `test_*.py` or `*_test.py`
- Run single test: `pytest backend/tests/test_routes.py -v`

#### Code Quality
⚠️ **No linter/formatter configured**. Recommended setup:
```bash
# Install tools
pip install black flake8 mypy

# Format code
black backend/

# Lint
flake8 backend/ --max-line-length=100

# Type check
mypy backend/ --ignore-missing-imports
```

### Frontend (WeChat Mini Program)

#### Development
1. Open **WeChat Developer Tools**
2. Import project: `auto-repo/miniprogram`
3. Set AppID or use test mode
4. Compile & Preview

#### Testing
⚠️ **No automated testing framework**. Manual testing via WeChat DevTools simulator.

#### Build
- Build happens automatically in WeChat Developer Tools
- Transpiled output: `miniprogram_npm/` (gitignored)

---

## 📂 Project Structure

```
auto-repo/
├── backend/                    # FastAPI Server
│   ├── main.py                 # App entrypoint, CORS, lifecycle
│   ├── routes.py               # API endpoints (/repos, /commits, /issues)
│   ├── models.py               # Pydantic data models
│   ├── database.py             # MongoDB connection manager
│   ├── mock_db.py              # File-based fallback DB (for local dev)
│   └── requirements.txt        # Python dependencies
│
├── miniprogram/                # WeChat Mini Program
│   ├── app.ts                  # App lifecycle, cloud init, auto-login
│   ├── app.scss                # Global styles (CSS variables)
│   ├── pages/                  # UI pages
│   │   ├── repo-list/          # Vehicle list
│   │   ├── repo-detail/        # Timeline + insights + issues
│   │   ├── repo-create/        # Add/edit vehicle
│   │   ├── commit-create/      # Add maintenance record (with image upload)
│   │   ├── commit-detail/      # Record details
│   │   └── issue-create/       # Add maintenance reminder
│   ├── components/             # Reusable components
│   │   ├── custom-nav/         # Custom navigation bar
│   │   ├── insights-view/      # Data visualizations
│   │   └── dashboard-widget/   # High-priority alerts
│   ├── services/
│   │   ├── api.ts              # Backend API wrapper (request helper)
│   │   └── auth.ts             # WeChat login & JWT token management
│   └── utils/
│       └── util.ts             # Shared utilities (formatTime, etc.)
│
├── docs/                       # Documentation assets
├── typings/                    # WeChat API type definitions
└── tsconfig.json               # TypeScript strict mode config
```

---

## 🎨 Code Style Guidelines

### TypeScript (Frontend)

#### General Conventions
- **Strict mode enabled**: All TypeScript strict flags active in `tsconfig.json`
- **File naming**: `kebab-case.ts`, `index.ts` for components
- **Indentation**: 2 spaces (WeChat convention)

#### Imports
```typescript
// External APIs first
import { getRepoDetail, getCommits } from '../../services/api'

// Local utilities after
import { formatTime } from '../../utils/util'

// No wildcard imports (avoid `import * as`)
```

#### Type Annotations
```typescript
// Always type function parameters
async onLoad(options: any) { ... }

// Use explicit types for data properties
data: {
  repo: null as any,           // WeChat limitation: use `any` for complex types
  commits: [] as any[],        // Array types with `as`
  loading: true,               // Infer primitives
  repoId: '',
  currentTab: 0
}

// Prefer interfaces over types for objects
interface Commit {
  id?: string;
  title: string;
  mileage: number;
}
```

#### Naming Conventions
- **Variables/Functions**: `camelCase` (`getRepoDetail`, `currentTab`)
- **Components**: `PascalCase` for component definitions
- **Constants**: `UPPER_SNAKE_CASE` for true constants
- **Private methods**: Prefix with `_` (e.g., `_calculateStats`)

#### Async/Await Patterns
```typescript
// Prefer Promise.all for parallel requests
const [repo, commits] = await Promise.all([
  getRepoDetail(repoId),
  getCommits(repoId)
])

// Always handle errors (show toast or log)
try {
  const result = await someApiCall()
} catch (err) {
  wx.showToast({ title: '操作失败', icon: 'none' })
  console.error('API Error:', err)
}
```

#### WeChat-Specific
- Use `wx.` APIs (never global DOM methods)
- Page lifecycle: `onLoad`, `onShow`, `onReady`, `onHide`
- Component lifecycle: `lifetimes.attached`, `lifetimes.detached`
- Navigation: `wx.navigateTo`, `wx.navigateBack`, `wx.reLaunch`

### SCSS Styling

#### Structure
```scss
// Use CSS variables from app.scss
.container {
  background: var(--bg-color);
  padding: var(--spacing-md);
}

// BEM-like naming for clarity
.commit-list { ... }
.commit-item { ... }
.commit-item__title { ... }
.commit-item--active { ... }

// Nest sparingly (max 2-3 levels)
.tab-bar {
  .tab-item {
    &.active {
      color: var(--primary-color);
    }
  }
}
```

#### Design System
- **Colors**: Use CSS vars (`--primary-color`, `--text-main`, `--bg-color`)
- **Spacing**: Use spacing scale (`--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`)
- **Shadows**: `var(--shadow-sm)`, `var(--shadow-lg)`
- **Border radius**: 8px (small), 12px (medium), 20px (large cards)
- **Transitions**: `transition: all 0.2s ease` for interactive elements

### Python (Backend)

#### General Conventions
- **PEP 8 compliant** (120 char line length recommended)
- **File naming**: `snake_case.py`
- **Indentation**: 4 spaces

#### Imports
```python
# Standard library first
from typing import List, Optional
from datetime import datetime
import os

# Third-party packages
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Local modules last
from models import Repo, Commit
from database import get_db
```

#### Type Hints
```python
# Always type-hint functions
async def get_repos() -> List[Repo]:
    ...

async def create_repo(repo: Repo) -> dict:
    ...

# Use Optional for nullable fields
from typing import Optional

def process(data: str, flag: Optional[bool] = None) -> int:
    ...
```

#### Naming Conventions
- **Variables/Functions**: `snake_case` (`get_repo_stats`, `current_mileage`)
- **Classes**: `PascalCase` (`DatabaseManager`, `Repo`)
- **Constants**: `UPPER_SNAKE_CASE` (`BASE_URL`, `MAX_RETRIES`)
- **Private methods**: Prefix with `_` (e.g., `_validate_data`)

#### Async/Await
```python
# All DB operations are async
async def get_repos():
    db = get_db()
    repos = []
    cursor = db.repos.find()
    async for doc in cursor:
        repos.append(doc)
    return repos

# Use await for all async calls
result = await db.repos.insert_one(data)
```

#### Error Handling
```python
# Use HTTPException for API errors
from fastapi import HTTPException

if not repo:
    raise HTTPException(status_code=404, detail="Repo not found")

# Catch exceptions for invalid ObjectId
from bson import ObjectId

try:
    repo = await db.repos.find_one({"_id": ObjectId(repo_id)})
except:
    raise HTTPException(status_code=400, detail="Invalid ID format")
```

#### Database Patterns
```python
# Convert ObjectId to string for responses
doc["_id"] = str(doc["_id"])

# Use dict() to serialize Pydantic models
repo_dict = repo.dict(exclude={"id"})

# Exclude fields from updates
update_data = repo.dict(exclude_unset=True, exclude={"id", "created_at"})

# Sort queries
cursor = db.commits.find({"repo_id": repo_id}).sort("timestamp", -1)
```

---

## 🔧 Common Patterns & Idioms

### API Request Flow (Frontend → Backend)

1. **Frontend calls API helper** (`services/api.ts`)
   ```typescript
   const repos = await getRepos()
   ```

2. **API helper wraps wx.request**
   ```typescript
   const request = (url: string, method: string, data?: any) => {
     return new Promise((resolve, reject) => {
       wx.request({ url: `${BASE_URL}${url}`, method, data, ... })
     })
   }
   ```

3. **Backend route processes** (`routes.py`)
   ```python
   @router.get("/repos", response_model=List[Repo])
   async def get_repos():
       db = get_db()
       # ... query & return
   ```

### State Management Pattern

**Frontend** (WeChat Mini Program):
- Use `this.setData()` to update reactive state
- Use `data` object for component state
- No global state library (use local storage for persistence)

```typescript
// Update single field
this.setData({ loading: false })

// Update nested data
this.setData({
  'repo.current_mileage': newMileage
})
```

### Date/Timestamp Handling

**Backend stores timestamps in milliseconds**:
```python
from datetime import datetime
timestamp: float = datetime.now().timestamp() * 1000
```

**Frontend converts for display**:
```typescript
const formatDate = (ts: number) => new Date(ts).toISOString().split('T')[0]
```

---

## 🚨 Common Pitfalls & Anti-Patterns

### ❌ Don't
```typescript
// TypeScript: Avoid `any` without reason
let data: any = {...}  // Bad: loses type safety

// Python: Don't use bare except
try:
    ...
except:  // Bad: catches all errors
    pass

// Backend: Don't forget to convert ObjectId
return doc  // Bad: ObjectId not JSON serializable

// Frontend: Don't mutate state directly
this.data.loading = false  // Bad: not reactive
```

### ✅ Do
```typescript
// TypeScript: Use specific types when possible
interface RepoData {
  name: string;
  mileage: number;
}

// Python: Catch specific exceptions
try:
    ...
except ValueError as e:
    logger.error(f"Validation failed: {e}")

// Backend: Always stringify ObjectId
doc["_id"] = str(doc["_id"])

// Frontend: Use setData for reactivity
this.setData({ loading: false })
```

---

## 📝 Important Notes

### Database
- **Auto-fallback**: If MongoDB unavailable, uses `MockDatabase` (file-based JSON storage at `backend/mock_db_data.json`)
- **No migrations**: Schema is implicit in Pydantic models
- **ObjectId handling**: Always convert to string for JSON serialization

### Authentication
- **Current**: JWT-based WeChat login implemented
- **Token storage**: Local storage (`autorepo_token`, `autorepo_openid`)
- **Token expiry**: 7 days
- **Multi-tenancy**: All routes filter by `user_openid`
- **Data migration**: Legacy data (no `user_openid`) assigned to first user who logs in
- **Auto-login**: App automatically obtains JWT on launch via `services/auth.ts`

### Business Logic
- **Auto HEAD update**: Creating a commit updates repo's `current_mileage` and `current_head` (only if new mileage > current)
- **Issue automation**: Commits can close issues via `closes_issues` field
- **Mileage triggers**: When commit mileage ≥ issue's `due_mileage`, issue priority → "high"
- **Image upload**: Commits support up to 9 images uploaded to WeChat Cloud storage

---

## 🔍 When Modifying Code

### Adding New API Endpoint
1. Define Pydantic model in `models.py`
2. Add route in `routes.py` with type annotations
3. Test via FastAPI docs at `http://localhost:8000/docs`
4. Add API helper in `miniprogram/services/api.ts`
5. Use helper in page/component

### Adding New Page
1. Create folder in `miniprogram/pages/page-name/`
2. Add `index.ts`, `index.wxml`, `index.scss`, `index.json`
3. Register in `app.json` under `pages` array
4. Use `Page({ ... })` constructor

### Adding New Component
1. Create folder in `miniprogram/components/component-name/`
2. Add `index.ts`, `index.wxml`, `index.scss`, `index.json`
3. Use `Component({ ... })` constructor
4. Reference in page JSON: `"usingComponents": { "custom-nav": "/components/custom-nav/index" }`

---

## 🎯 Before Committing

1. **Backend**: Run LSP diagnostics or manual type checks
2. **Frontend**: Compile in WeChat DevTools (check for errors)
3. **Test manually**: Verify affected flows work end-to-end
4. **Check formatting**: Code follows existing indentation/style
5. **No secrets**: `.env` files not committed (use `.gitignore`)

---

*Last Updated: 2026-01-29*
*Maintained by: AutoRepo Team*
