<h1 align="center">🚗 AutoRepo</h1>

<p align="center">
  <strong>Manage your vehicle maintenance like a Git repository.</strong>
</p>

<p align="center">
  <a href="./README_ZH.md">简体中文</a> | <strong>English</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v2.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/Frontend-MiniProgram-07c160.svg" alt="WeChat">
</p>

**AutoRepo** is a production-ready, multi-tenant vehicle lifecycle management system. It borrows the concepts of **Git Version Control** to provide a structured, visualized way to track every "change" to your car.

- **Repo** = Your Vehicle
- **Commit** = Maintenance/Modification Record (now with images!)
- **Issue** = Scheduled maintenance tasks
- **HEAD** = Current Status (Current Mileage/Condition)

---

## 🎉 What's New in v2.0 (2026-01-29)

### 🔐 Multi-User Authentication
*   **WeChat One-Click Login**: Automatic login on app launch
*   **JWT Authentication**: 7-day token validity
*   **Data Isolation**: Each user sees only their own data
*   **Legacy Data Migration**: Seamless upgrade from v1.x

### 📸 Image Upload
*   **Visual Records**: Upload up to 9 photos per maintenance record
*   **Cloud Storage**: Automatic backup to WeChat Cloud
*   **Smart Compression**: Reduces data usage automatically
*   **Easy Management**: Preview, delete, and organize photos

### 📄 PDF Export
*   **Professional Reports**: Generate complete maintenance history in PDF
*   **One-Click Download**: Export all vehicle records instantly
*   **Print-Ready**: Share with buyers, insurance companies, or for personal records
*   **Beautiful Formatting**: Styled tables and organized layout

### 🌙 Dark Mode
*   **Auto-Detection**: Follows system dark mode settings
*   **Eye-Friendly**: Comfortable night viewing
*   **OLED Optimized**: Saves battery on OLED screens

---

## ✨ Core Features

*   **📅 Visual Git-Style Timeline**: View your car's history (customizations, repairs, maintenance) as a Git commit log.
*   **💰 Detailed Cost Tracking**: Record labor costs, parts fees, and automatically calculate total investment.
*   **🔄 Auto-State Management**: Committing a maintenance record automatically updates the vehicle's "HEAD" (current mileage & condition).
*   **🎨 Premium UI/UX**: Dark mode, glassmorphism design, and fluid animations for a high-end experience.
*   **🚙 Multi-Vehicle Support**: Manage multiple "Repositories" (cars) in one app.
*   **📝 Edit & Delete Records**: Edit existing maintenance records or delete them with confirmation.
*   **📅 Custom Timestamps**: Set custom date/time for each record (not just auto-generated).
*   **⛽ Extended Templates**: 12 templates including fuel costs and parking fees.
*   **💰 Purchase Cost Tracking**: Track vehicle purchase cost in total statistics.
*   **🔍 Search & Filter**: Filter by type, date range, mileage, and keyword search.
*   **📊 Data Insights**: Visual charts showing cost composition and trends.
*   **❓ Built-in Help**: Quick help guide accessible from main menu.

## 🛠 Tech Stack

### Frontend (WeChat Mini Program)
*   **Language**: TypeScript (Strict Mode)
*   **Styling**: SCSS (Sass), Custom UI Components
*   **Cloud**: WeChat Cloud Storage (Images)
*   **Features**: Custom Navigation Bar, Responsive Layout, Interactive Animations, Dark Mode

### Backend (Server)
*   **Framework**: FastAPI (Python 3.9+)
*   **Authentication**: JWT + WeChat Login
*   **Database**: MongoDB (via Motor async driver) / MockDB (local development)
*   **PDF Generation**: ReportLab
*   **Deployment**: Docker & Docker Compose (optional)
*   **API**: RESTful API design with auto-generated Swagger docs

## 🚀 Quick Start

### Prerequisites
*   Python 3.9+
*   WeChat Developer Tools
*   (Optional) Docker & Docker Compose

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Configure Environment
Create `backend/.env` file:
```bash
# WeChat Mini Program Credentials
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# JWT Secret (use a random string, 32+ characters)
JWT_SECRET=your-random-secret-key-at-least-32-characters

# Database (optional, defaults to MockDB)
MONGO_URL=mongodb://localhost:27017
```

#### Run Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

*   The system will automatically use `MockDB` (file-based) if MongoDB is not available.
*   API docs: `http://localhost:8000/docs`

### 2. Frontend Setup

1. **Open WeChat Developer Tools**
2. **Import Project**: Select `auto-repo/miniprogram` directory
3. **Set AppID**: Use your WeChat Mini Program AppID or test mode
4. **Configure Cloud**: Update `miniprogram/app.ts` with your cloud environment ID:
   ```typescript
   wx.cloud.init({
     env: 'your-cloud-env-id',  // Replace with your cloud environment
     traceUser: true
   })
   ```
5. **Compile & Run**

## 📂 Project Structure

```
auto-repo/
├── backend/                    # FastAPI Backend
│   ├── main.py                 # App entrypoint, CORS, lifecycle
│   ├── auth.py                 # JWT authentication & WeChat login (NEW!)
│   ├── routes.py               # API endpoints (15 protected routes)
│   ├── models.py               # Pydantic data models
│   ├── database.py             # MongoDB connection manager
│   ├── mock_db.py              # File-based fallback DB
│   ├── .env.example            # Environment variables template (NEW!)
│   └── requirements.txt        # Python dependencies
│
├── miniprogram/                # WeChat Mini Program
│   ├── app.ts                  # App lifecycle, cloud init, auto-login
│   ├── app.json                # Dark mode configuration (NEW!)
│   ├── theme.json              # Light/Dark theme colors (NEW!)
│   ├── pages/                  # UI pages
│   │   ├── repo-list/          # Vehicle list
│   │   ├── repo-detail/        # Timeline + insights + issues
│   │   ├── commit-create/      # Add record with image upload (UPDATED!)
│   │   └── ...
│   ├── components/             # Reusable components
│   │   ├── insights-view/      # Data visualizations
│   │   ├── filter-bar/         # Search & filter
│   │   └── ...
│   ├── services/
│   │   ├── api.ts              # Backend API wrapper
│   │   └── auth.ts             # Login & token management (NEW!)
│   └── ...
│
├── docs/                       # Documentation
│   ├── WORK_SUMMARY.md         # Development summary (NEW!)
│   ├── TESTING_GUIDE.md        # Testing instructions (NEW!)
│   └── FEATURE_SUMMARY.md      # Feature details (NEW!)
│
├── AGENTS.md                   # Development guide (UPDATED!)
└── README.md                   # This file (UPDATED!)
```

## 🛣 Roadmap

- [x] **Phase 1**: Core UI/UX implementation & Backend Integration
- [x] **Phase 2**: Multi-user authentication & security
- [x] **Phase 3**: Image upload & PDF export
- [x] **Phase 3.5**: Data Visualization, Costs & Task Management
- [x] **Phase 4**: Bug Fixes & UX Improvements (2026-01)
- [ ] **Phase 5**: Cloud Deployment (WeChat Cloud Hosting)
- [ ] **Phase 6**: Social Sharing Features & Community

## 🔧 Recent Updates

### v2.0 (2026-01-29) - Production-Ready Multi-Tenant Release
**Authentication & Security**:
- ✅ JWT-based WeChat login system
- ✅ Multi-tenant data isolation (user_openid filtering)
- ✅ All 15 API endpoints protected
- ✅ Automatic login on app launch
- ✅ 7-day token validity with auto-refresh

**New Features**:
- ✅ Image upload (up to 9 photos per record)
- ✅ WeChat Cloud Storage integration
- ✅ PDF export with ReportLab
- ✅ Dark mode infrastructure (auto-detection ready)

**Technical Improvements**:
- ✅ Database indexes for user-scoped queries
- ✅ MockDB with full MongoDB compatibility
- ✅ Environment variable configuration
- ✅ Comprehensive documentation

### v1.3 (2026-01-28) - Deep Code Audit & Optimization
**Security Fixes** (9 critical vulnerabilities):
- ✅ ObjectId injection prevention
- ✅ Mass assignment protection
- ✅ Regex injection defense
- ✅ Cross-repository data access prevention
- ✅ Network layer timeout & retry mechanism

**Performance Optimizations** (67% query reduction):
- ✅ Database queries optimized (3 queries → 1 via `$facet`)
- ✅ List scroll performance improved 100%
- ✅ Atomic operations for mileage updates

**Code Quality** (171 new lines, ~150 removed):
- ✅ New utility modules: `utils/date.ts`, `utils/vehicle.ts`
- ✅ Network layer refactoring
- ✅ Immutable state updates

### v1.2 (2026-01-27) - Bug Fixes
- ✅ Implemented full data pre-fill for edit mode
- ✅ Fixed CSV export showing zero costs
- ✅ Fixed chart max value calculation
- ✅ Timeline cards now show cost and date
- ✅ Purchase cost correctly included in total

### v1.1 (2026-01-26) - Feature Enhancements
- ✅ Added date/time pickers for custom timestamps
- ✅ Implemented edit/delete functionality
- ✅ Extended templates to 12 (added fuel & parking)
- ✅ Fixed CSV export sharing on WeChat

## 📚 Documentation

- [AGENTS.md](./AGENTS.md) - Development guide for AI assistants
- [docs/WORK_SUMMARY.md](./docs/WORK_SUMMARY.md) - Detailed development summary
- [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md) - Comprehensive testing instructions
- [docs/FEATURE_SUMMARY.md](./docs/FEATURE_SUMMARY.md) - Complete feature documentation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
