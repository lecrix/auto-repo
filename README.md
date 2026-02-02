<h1 align="center">
  <br>
  🚗 AutoRepo
  <br>
</h1>

<h4 align="center">A Git-style vehicle maintenance tracking system for car enthusiasts.</h4>

<p align="center">
  <a href="./README_ZH.md">简体中文</a> •
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v2.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/Python-3.9+-3776ab.svg" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/WeChat_MiniProgram-07c160.svg" alt="WeChat">
  <img src="https://img.shields.io/badge/MongoDB-47A248.svg" alt="MongoDB">
</p>

<!-- 
📸 SCREENSHOT PLACEHOLDER
Add your app screenshots here. Recommended: Create an `assets/` folder and add:
- assets/screenshot-timeline.png (Main timeline view)
- assets/screenshot-dashboard.png (Statistics dashboard)  
- assets/screenshot-dark-mode.png (Dark mode showcase)

Example:
<p align="center">
  <img src="assets/screenshot-timeline.png" width="250" alt="Timeline">
  <img src="assets/screenshot-dashboard.png" width="250" alt="Dashboard">
  <img src="assets/screenshot-dark-mode.png" width="250" alt="Dark Mode">
</p>
-->

---

## What is AutoRepo?

**AutoRepo** transforms vehicle maintenance tracking into an intuitive, developer-friendly experience by borrowing concepts from Git version control:

| Git Concept          | AutoRepo Equivalent                |
| -------------------- | ---------------------------------- |
| **Repository** | Your Vehicle                       |
| **Commit**     | Maintenance/Repair Record          |
| **Issue**      | Scheduled Maintenance Task         |
| **HEAD**       | Current Status (Mileage/Condition) |

Perfect for car enthusiasts who want to:

- 📊 Track every modification, repair, and maintenance
- 💰 Monitor total investment and cost breakdown
- 📸 Document with photos (up to 9 per record)
- 📄 Export professional PDF reports
- 🔄 Never lose your vehicle's history

---

## Features

### Core Functionality

- **Git-Style Timeline** — Visual commit history of all vehicle changes
- **Multi-Vehicle Support** — Manage multiple cars in one app
- **Cost Tracking** — Labor costs, parts fees, automatic totals
- **Image Upload** — Up to 9 photos per maintenance record
- **PDF Export** — Professional reports for insurance or resale
- **Search & Filter** — By type, date range, mileage, or keywords

### User Experience

- **🌙 Dark Mode** — Auto-detects system preference
- **⚡ Real-time Sync** — WeChat Cloud Run powered
- **🔐 Secure** — JWT authentication, data isolation per user
- **📱 Native Feel** — Custom navigation, smooth animations

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     WeChat Mini Program                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Timeline   │  │  Dashboard  │  │  Settings   │              │
│  │   (Repo)    │  │   (Stats)   │  │   (Theme)   │              │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘              │
│         │                │                                       │
│  ┌──────┴────────────────┴──────┐                               │
│  │       api.ts (HTTP Client)    │                               │
│  │   • JWT Auth • Retry Logic    │                               │
│  └──────────────┬───────────────┘                               │
└─────────────────┼───────────────────────────────────────────────┘
                  │ wx.cloud.callContainer (No domain required)
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   WeChat Cloud Run (Docker)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    FastAPI Backend                        │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │   │
│  │  │ /repos │  │/commits│  │/issues │  │ /auth  │          │   │
│  │  └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘          │   │
│  │       └───────────┴───────────┴───────────┘               │   │
│  │                       │                                    │   │
│  │              ┌────────┴────────┐                          │   │
│  │              │   MongoDB/Mock  │                          │   │
│  │              │   (Motor Async) │                          │   │
│  │              └─────────────────┘                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer                | Technology                            |
| -------------------- | ------------------------------------- |
| **Frontend**   | TypeScript, SCSS, WeChat Mini Program |
| **Backend**    | Python 3.9+, FastAPI, Pydantic        |
| **Database**   | MongoDB (Motor async driver)          |
| **Auth**       | JWT + WeChat Login                    |
| **PDF**        | ReportLab (Chinese font support)      |
| **Deployment** | Docker, WeChat Cloud Run              |

---

## Quick Start

### Prerequisites

- Python 3.9+
- WeChat Developer Tools
- (Optional) Docker, MongoDB

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/lecrix/auto-repo.git
cd auto-repo/backend

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from example)
cp .env.example .env
# Edit .env with your credentials

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Environment Variables** (`.env`):

```bash
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret
JWT_SECRET=your-random-secret-key-at-least-32-characters
MONGO_URL=mongodb://localhost:27017  # Optional, defaults to MockDB
```

> 💡 Without MongoDB, the system automatically uses MockDB (file-based) for local development.

### 2. Frontend Setup

1. Open **WeChat Developer Tools**
2. Import `miniprogram/` directory
3. Set AppID (or use test mode)
4. Update cloud env in `miniprogram/config.ts`:
   ```typescript
   export const CLOUD_ENV_ID = 'your-cloud-env-id'
   ```
5. Compile and preview

---

## Deployment

### WeChat Cloud Run (Recommended)

See [DEPLOY.md](./DEPLOY.md) for detailed instructions.

```bash
# Build and push Docker image
cd backend
docker build -t autorepo-backend .

# Deploy via WeChat Cloud Console
# 1. Create Cloud Run service
# 2. Upload container image
# 3. Configure environment variables
```

**Key Benefits:**

- ✅ No domain registration/ICP required
- ✅ Auto-scaling (scale to zero when idle)
- ✅ Built-in HTTPS
- ✅ Direct internal network access

---

## Project Structure

```
auto-repo/
├── backend/                 # FastAPI Backend
│   ├── main.py              # App entrypoint, CORS
│   ├── auth.py              # JWT + WeChat login
│   ├── routes.py            # API endpoints (15 routes)
│   ├── models.py            # Pydantic schemas
│   ├── database.py          # MongoDB connection
│   ├── mock_db.py           # Development fallback DB
│   ├── Dockerfile           # Cloud Run optimized
│   └── requirements.txt
│
├── miniprogram/             # WeChat Mini Program
│   ├── app.ts               # Lifecycle, cloud init
│   ├── config.ts            # Environment configuration
│   ├── pages/               # UI pages
│   ├── components/          # Reusable components
│   └── services/            # API client, auth
│
├── docs/                    # Documentation
├── AGENTS.md                # AI assistant guide
├── DEPLOY.md                # Deployment guide
└── CONTRIBUTING.md          # Contribution guide
```

---

## API Overview

| Endpoint               | Method         | Description              |
| ---------------------- | -------------- | ------------------------ |
| `/auth/login`        | POST           | WeChat code → JWT token |
| `/repos`             | GET/POST       | List/Create vehicles     |
| `/repos/{id}`        | GET/PUT/DELETE | Vehicle CRUD             |
| `/commits`           | GET/POST       | List/Create records      |
| `/commits/{id}`      | GET/PUT/DELETE | Record CRUD              |
| `/repos/{id}/issues` | GET/POST       | Maintenance tasks        |
| `/repos/{id}/stats`  | GET            | Cost statistics          |
| `/repos/{id}/trends` | GET            | Monthly trends           |
| `/repos/{id}/export` | GET            | PDF export               |

Full API docs available at `http://localhost:8000/docs` when running locally.

---

## Roadmap

- [X] Core UI/UX & Backend Integration
- [X] Multi-user Authentication
- [X] Image Upload & PDF Export
- [X] Data Visualization & Statistics
- [X] WeChat Cloud Run Deployment
- [ ] Social Sharing & Community Features
- [ ] OCR for Receipt Scanning
- [ ] Maintenance Reminders (Push Notifications)

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

```bash
# Fork the repo, then:
git checkout -b feature/amazing-feature
git commit -m 'Add amazing feature'
git push origin feature/amazing-feature
# Open a Pull Request
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ for car enthusiasts
  <br>
  <a href="https://github.com/yourusername/auto-repo/issues">Report Bug</a> •
  <a href="https://github.com/yourusername/auto-repo/issues">Request Feature</a>
</p>
