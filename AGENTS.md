# AGENTS.md - AutoRepo Development Guide

> Vehicle maintenance tracking with Git metaphors: Repo=Vehicle, Commit=Maintenance record, Issue=Reminder

## Tech Stack
- **Frontend**: WeChat Mini Program (TypeScript + SCSS)
- **Backend**: FastAPI (Python 3.9+) + MongoDB/MockDB
- **Auth**: JWT-based WeChat login | **Storage**: WeChat Cloud for images

---

## Build, Lint & Test Commands

### Backend (Python)

```bash
cd backend
pip install -r requirements.txt

# Development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run all tests
pytest -v

# Run single test file
pytest tests/test_routes.py -v

# Run single test function
pytest tests/test_routes.py::test_create_repo -v

# Linting & formatting (dev dependencies)
pip install -r requirements-dev.txt
black .                           # Format code
flake8 --max-line-length=120      # Lint
mypy . --ignore-missing-imports   # Type check
```

**Config files**: `pytest.ini` (asyncio_mode=auto), `pyproject.toml` (black line-length=120)

### Frontend (WeChat Mini Program)

Development via **WeChat Developer Tools** only:
1. Import `miniprogram/` directory
2. Set AppID or use test mode
3. Compile & Preview (no CLI commands available)

---

## Project Structure

```
backend/
├── main.py          # FastAPI entrypoint, CORS
├── routes.py        # API endpoints (/repos, /commits, /issues)
├── models.py        # Pydantic data models
├── auth.py          # JWT authentication
├── database.py      # MongoDB connection
├── mock_db.py       # File-based fallback DB
└── tests/           # pytest tests

miniprogram/
├── app.ts           # App lifecycle, cloud init, auto-login
├── pages/           # UI pages (repo-list, repo-detail, commit-create, etc.)
├── components/      # custom-nav, insights-view, dashboard-widget
├── services/
│   ├── api.ts       # Backend API wrapper with retry/auth
│   └── auth.ts      # WeChat login & JWT management
└── utils/util.ts    # Shared utilities
```

---

## Code Style Guidelines

### TypeScript (Frontend)

**Config**: `tsconfig.json` with all strict flags enabled

```typescript
// Import order: external APIs → local utilities
import { getRepoDetail, getCommits } from '../../services/api'
import { formatTime } from '../../utils/util'

// Data typing (WeChat limitation: use `any` for complex objects)
data: {
  repo: null as any,
  commits: [] as any[],
  loading: true,
  repoId: ''
}

// Async error handling (always show toast)
try {
  const result = await someApiCall()
} catch (err) {
  wx.showToast({ title: '操作失败', icon: 'none' })
  console.error('API Error:', err)
}

// State updates (must use setData for reactivity)
this.setData({ loading: false })            // ✓ Correct
this.data.loading = false                   // ✗ Not reactive
```

**Naming**: `camelCase` functions/variables, `PascalCase` components, `_prefix` private methods

### Python (Backend)

**Config**: PEP 8, 120 char lines (via black), type hints required

```python
# Import order: stdlib → third-party → local
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from models import Repo, Commit

# Type hints on all functions
async def get_repos() -> List[Repo]:
    ...

# Error handling with HTTPException
if not repo:
    raise HTTPException(status_code=404, detail="Repo not found")

# ObjectId handling (CRITICAL: always stringify for JSON)
doc["_id"] = str(doc["_id"])

# Use parse_oid helper for safe ObjectId parsing
from routes import parse_oid
repo = await db.repos.find_one({"_id": parse_oid(repo_id, "repo_id")})
```

**Naming**: `snake_case` functions/variables, `PascalCase` classes, `UPPER_SNAKE_CASE` constants

### SCSS Styling

```scss
// Use CSS variables from app.scss
.container {
  background: var(--bg-color);
  padding: var(--spacing-md);
}

// BEM-like naming, max 2-3 levels nesting
.commit-item { ... }
.commit-item__title { ... }
.commit-item--active { ... }
```

---

## Critical Patterns

### Database
- **Auto-fallback**: MongoDB unavailable → uses MockDB (file-based at `backend/mock_db_data.json`)
- **Multi-tenancy**: All queries filter by `user_openid` from JWT

### Authentication
- JWT stored in local storage (`autorepo_token`, `autorepo_openid`)
- 7-day expiry, auto-refresh on 401
- All 15 API endpoints require `Depends(get_current_user)`

### Business Logic
- Commit creation auto-updates repo's `current_mileage` (if higher)
- Commits can close issues via `closes_issues` field
- Images uploaded to WeChat Cloud (max 9 per commit)

---

## Anti-Patterns (AVOID)

| Don't | Do |
|-------|-----|
| `as any` / `@ts-ignore` | Proper types or `null as any` for WeChat |
| Bare `except:` | Catch specific exceptions |
| Return raw MongoDB doc | Always stringify `_id` |
| Mutate `this.data` directly | Use `this.setData({...})` |
| `response_model` without `_id` handling | Convert ObjectId before return |

---

## Before Committing

1. Backend: `pytest -v` passes, `black .` applied
2. Frontend: WeChat DevTools compiles without errors
3. No `.env` or secrets committed

*Last Updated: 2026-01-30*
