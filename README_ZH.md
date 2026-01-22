# 🚗 AutoRepo

> **像管理代码一样，管理您的爱车档案。**

[![English](https://img.shields.io/badge/Language-English-blue.svg)](README.md) ![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Python](https://img.shields.io/badge/Backend-FastAPI-009688.svg) ![WeChat](https://img.shields.io/badge/Frontend-MiniProgram-07c160.svg)

**AutoRepo** 是一款极客风格的车辆全生命周期管理工具。它巧妙地借用了 **Git 版本控制** 的概念，为汽车爱好者提供了一种结构化、可视化的方式来记录和回溯车辆的每一次“改变”。

- **Repo (仓库)** = 您的爱车
- **Commit (提交)** = 维修、保养或改装记录
- **HEAD (指针)** = 车辆当前状态（当前里程、车况等）

---

## ✨ 核心功能

*   **📅 可视化 Git 风格时间轴**: 以 Git commit log 的形式查看车辆的历史记录（改装、维修、保养）。
*   **💰 精细化费用追踪**: 记录详细的工时费、配件费，并自动计算总投入。
*   **🔄 自动状态管理**: 提交维修记录时，自动更新车辆的 "HEAD" 指针（当前里程 & 状态）。
*   **🎨 极致 UI/UX**: 深色模式、玻璃拟态设计以及流畅的交互动画，带来高端的使用体验。
*   **🚙 多车管理**: 在一个应用中管理多个 "Repo" (车辆)。

## 🛠 技术栈

### 前端 (微信小程序)
*   **语言**: TypeScript
*   **样式**: SCSS (Sass), 自定义 UI 组件
*   **特性**: 自定义导航栏, 响应式布局, 交互动画

### 后端 (服务器)
*   **框架**: FastAPI (Python 3.9+)
*   **数据库**: MongoDB (via Motor 异步驱动)
*   **部署**: Docker & Docker Compose
*   **API**: RESTful API 设计

## 🚀 快速开始

### 前提条件
*   Docker & Docker Compose
*   微信开发者工具

### 1. 启动后端
```bash
# 克隆仓库
git clone https://github.com/lecrix/auto-repo.git
cd auto-repo

# 使用 Docker 启动服务
docker-compose up -d --build
```
API 服务器将运行在 `http://localhost:8000`。
文档地址: `http://localhost:8000/docs`。

### 2. 运行前端
1. 打开 **微信开发者工具**。
2. 导入项目目录: `auto-repo/miniprogram`。
3. 设置您的 AppID (或使用测试号)。
4. 编译并运行。

## 📂 项目结构

```
auto-repo/
├── backend/                # FastAPI 后端
│   ├── main.py             # 入口文件
│   ├── models.py           # MongoDB 模型 (Pydantic)
│   ├── routes.py           # API 路由
│   ├── Dockerfile          # 后端 Docker 配置
│   └── ...
├── miniprogram/            # 微信小程序源码
│   ├── pages/              # UI 页面 (repo-detail, commit-create, etc.)
│   ├── components/         # 可复用组件
│   ├── app.ts              # App 入口
│   └── ...
└── docker-compose.yml      # 容器编排
```

## 🛣 路线图

- [x] **阶段 1**: 核心 UI/UX 实现 & 后端集成
- [ ] **阶段 2**: 云端部署 (微信云托管)
- [ ] **阶段 3**: 数据可视化 & 图表
- [ ] **阶段 4**: 社交分享功能

## 🤝 贡献代码

欢迎提交 Pull Request 来参与贡献！

## 📄 许可证

本项目基于 MIT 许可证开源 - 详情请参阅 [LICENSE](LICENSE) 文件。
