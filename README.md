<h1 align="center">🚗 AutoRepo</h1>

<p align="center">
  <strong>Manage your vehicle maintenance like a Git repository.</strong>
</p>

<p align="center">
  <a href="./README_ZH.md">简体中文</a> | <strong>English</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/Frontend-MiniProgram-07c160.svg" alt="WeChat">
</p>

**AutoRepo** is a geek-style vehicle lifecycle management tool. It borrows the concepts of **Git Version Control** to provide a structured, visualized way to track every "change" to your car.

- **Repo** = Your Vehicle
- **Commit** = Maintenance/Modification Record
- **HEAD** = Current Status (Current Mileage/Condition)

---

## ✨ Key Features

*   **📅 Visual Git-Style Timeline**: View your car's history (customizations, repairs, maintenance) as a Git commit log.
*   **💰 Detailed Cost Tracking**: Record labor costs, parts fees, and automatically calculate total investment.
*   **🔄 Auto-State Management**: Committing a maintenance record automatically updates the vehicle's "HEAD" (current mileage & condition).
*   **🎨 Premium UI/UX**: Dark mode, glassmorphism design, and fluid animations for a high-end experience.
*   **🚙 Multi-Vehicle Support**: Manage multiple "Repositories" (cars) in one app.
*   **📝 Edit & Delete Records**: Edit existing maintenance records or delete them with confirmation.
*   **📅 Custom Timestamps**: Set custom date/time for each record (not just auto-generated).
*   **⛽ Extended Templates**: 12 templates including fuel costs and parking fees.
*   **💰 Purchase Cost Tracking**: Track vehicle purchase cost in total statistics.
*   **❓ Built-in Help**: Quick help guide accessible from main menu.

## 🛠 Tech Stack

### Frontend (WeChat Mini Program)
*   **Language**: TypeScript
*   **Styling**: SCSS (Sass), Custom UI Components
*   **Features**: Custom Navigation Bar, Responsive Layout, Interactive Animations

### Backend (Server)
*   **Framework**: FastAPI (Python 3.9+)
*   **Database**: MongoDB (via Motor async driver)
*   **Deployment**: Docker & Docker Compose
*   **API**: RESTful API design

## 🚀 Quick Start

### Prerequisites
*   Docker & Docker Compose
*   WeChat Developer Tools

### 1. Start the Backend (Local Mode)
Since Docker might be unstable on some Windows environments, we recommend running locally with the built-in Mock Database (File-based).

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*   The system will automatically use `MockDB` (saved to local JSON) if MongoDB is not detected.
*   API docs: `http://localhost:8000/docs`.

### 2. Run the Frontend
1. Open **WeChat Developer Tools**.
2. Import the project directory: `auto-repo/miniprogram`.
3. Set your AppID (or use Test ID).
4. Compile and Run.

## 📂 Project Structure

```
auto-repo/
├── backend/                # FastAPI Backend
│   ├── main.py             # Entry point
│   ├── mock_db.py          # Local File Database (New!)
│   ├── models.py           # Data Models
│   ├── routes.py           # API Routes
│   └── ...
├── miniprogram/            # WeChat Mini Program Source
│   ├── pages/              # UI Pages
│   │   ├── repo-detail/    # Detail View (Timeline + Insights)
│   │   ├── issue-create/   # Issue Creation (New!)
│   │   └── ...
│   ├── components/         # Reusable Components
│   │   ├── insights-view/  # Data Viz & Tasks
│   │   ├── dashboard-widget/ # High Priority Alerts
│   │   └── ...
│   └── ...
└── docker-compose.yml      # (Optional) Container Orchestration
```

## 🛣 Roadmap

- [x] **Phase 1**: Core UI/UX implementation & Backend Integration
- [ ] **Phase 2**: Cloud Deployment (WeChat Cloud Hosting)
- [x] **Phase 3**: Data Visualization, Costs & Task Management
- [x] **Phase 3.5**: Bug Fixes & UX Improvements (2026-01)
- [ ] **Phase 4**: Social Sharing Features

## 🔧 Recent Updates (2026-01-28)

### Round 3: Deep Code Audit & Optimization
**Security Fixes** (9 critical vulnerabilities):
- ✅ ObjectId injection prevention with input validation
- ✅ Mass assignment protection via Pydantic Patch models
- ✅ Regex injection defense (escaping + length limits)
- ✅ Cross-repository data access prevention
- ✅ Network layer timeout & retry mechanism
- ✅ Fixed Pydantic mutable default values
- ✅ Statistics API null value handling (`$ifNull`)
- ✅ Reactive state updates (`setData` fixes)
- ✅ UTC timezone bug correction

**Performance Optimizations** (67% query reduction):
- ✅ Database queries optimized (3 queries → 1 via `$facet`)
- ✅ List scroll performance improved 100% (throttle + deduplication)
- ✅ Atomic operations for monotonic mileage updates
- ✅ Database-level sorting (eliminated application-layer sorting)

**Code Quality** (171 new lines, ~150 removed):
- ✅ New utility modules: `utils/date.ts`, `utils/vehicle.ts`, `types/index.ts`
- ✅ Network layer refactoring (config extraction + structured errors)
- ✅ Immutable state updates (replaced mutation patterns)
- ✅ Data consistency: delete_commit now recalculates HEAD

### Round 2: Bug Fixes (2026-01-27)
- ✅ Implemented full data pre-fill for edit mode (including insurance field parsing)
- ✅ Removed redundant time picker, simplified date entry
- ✅ Fixed CSV export showing zero costs
- ✅ Fixed chart max value calculation and month display issues
- ✅ Timeline cards now show cost and date (no longer display database ID)
- ✅ Template system reorganization: added insurance template, simplified cost input
- ✅ Unified mileage label terminology to eliminate user confusion
- ✅ Purchase cost now correctly included in total cost statistics
- ✅ Fixed help icon being obscured by navigation bar

### Round 1 Bug Fixes & Improvements
- ✅ Added date/time pickers for custom record timestamps
- ✅ Implemented edit/delete functionality for maintenance records
- ✅ Made mileage field optional (useful for parking/fuel records)
- ✅ Extended templates to 12 (added fuel & parking cost templates)
- ✅ Fixed CSV export sharing on WeChat (.xls format)
- ✅ Dynamic vehicle color theming in detail pages
- ✅ Added purchase cost tracking
- ✅ Improved mileage display (shows driven distance)
- ✅ Added in-app help documentation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
