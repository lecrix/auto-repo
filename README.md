# 🚗 AutoRepo

> **Manage your vehicle maintenance like a Git repository.**

[![中文文档](https://img.shields.io/badge/Language-中文-red.svg)](README_ZH.md) ![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Python](https://img.shields.io/badge/Backend-FastAPI-009688.svg) ![WeChat](https://img.shields.io/badge/Frontend-MiniProgram-07c160.svg)

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

### 1. Start the Backend
```bash
# Clone the repository
git clone https://github.com/lecrix/auto-repo.git
cd auto-repo

# Start services with Docker
docker-compose up -d --build
```
The API server will run at `http://localhost:8000`.  
Docs available at: `http://localhost:8000/docs`.

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
│   ├── models.py           # MongoDB Models (Pydantic)
│   ├── routes.py           # API Routes
│   ├── Dockerfile          # Backend Docker config
│   └── ...
├── miniprogram/            # WeChat Mini Program Source
│   ├── pages/              # UI Pages (repo-detail, commit-create, etc.)
│   ├── components/         # Reusable Components
│   ├── app.ts              # App Entry
│   └── ...
└── docker-compose.yml      # Container Orchestration
```

## 🛣 Roadmap

- [x] **Phase 1**: Core UI/UX implementation & Backend Integration
- [ ] **Phase 2**: Cloud Deployment (WeChat Cloud Hosting)
- [ ] **Phase 3**: Data Visualization & Charts
- [ ] **Phase 4**: Social Sharing Features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
