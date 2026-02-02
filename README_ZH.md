<h1 align="center">
  <br>
  🚗 AutoRepo
  <br>
</h1>

<h4 align="center">用 Git 的方式，管理你的爱车档案</h4>

<p align="center">
  <strong>简体中文</strong> •
  <a href="./README.md">English</a> •
  <a href="#功能特性">功能</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#系统架构">架构</a> •
  <a href="#部署指南">部署</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/版本-v2.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/许可证-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/Python-3.9+-3776ab.svg" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/微信小程序-07c160.svg" alt="WeChat">
  <img src="https://img.shields.io/badge/MongoDB-47A248.svg" alt="MongoDB">
</p>

<!-- 
📸 截图占位符
请在此添加应用截图。建议：创建 `assets/` 文件夹并添加：
- assets/screenshot-timeline.png (主时间轴视图)
- assets/screenshot-dashboard.png (统计仪表盘)  
- assets/screenshot-dark-mode.png (深色模式展示)

示例:
<p align="center">
  <img src="assets/screenshot-timeline.png" width="250" alt="时间轴">
  <img src="assets/screenshot-dashboard.png" width="250" alt="仪表盘">
  <img src="assets/screenshot-dark-mode.png" width="250" alt="深色模式">
</p>
-->

---

## AutoRepo 是什么？

**AutoRepo** 借用 Git 版本控制的概念，将车辆维保记录转化为直观、开发者友好的体验：

| Git 概念 | AutoRepo 对应 |
|---------|---------------|
| **Repository (仓库)** | 你的爱车 |
| **Commit (提交)** | 维修/保养记录 |
| **Issue (议题)** | 定期维护任务 |
| **HEAD (指针)** | 当前状态（里程/车况） |

适合以下用户：
- 📊 追踪每一次改装、维修和保养
- 💰 监控总投入和费用构成
- 📸 用照片记录（每条记录最多9张）
- 📄 导出专业 PDF 报告
- 🔄 永不丢失车辆历史记录

---

## 功能特性

### 核心功能
- **Git 风格时间轴** — 可视化展示车辆变更历史
- **多车管理** — 一个应用管理多辆车
- **费用追踪** — 工时费、配件费、自动汇总
- **图片上传** — 每条记录最多9张照片
- **PDF 导出** — 专业报告，用于保险或转售
- **搜索筛选** — 按类型、日期、里程或关键词

### 用户体验
- **🌙 深色模式** — 自动检测系统偏好
- **⚡ 实时同步** — 微信云托管驱动
- **🔐 安全可靠** — JWT 认证，用户数据隔离
- **📱 原生体验** — 自定义导航，流畅动画

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        微信小程序                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   时间轴    │  │   仪表盘    │  │    设置     │              │
│  │   (Repo)    │  │   (Stats)   │  │   (Theme)   │              │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘              │
│         │                │                                       │
│  ┌──────┴────────────────┴──────┐                               │
│  │      api.ts (HTTP 客户端)     │                               │
│  │   • JWT 认证 • 重试逻辑       │                               │
│  └──────────────┬───────────────┘                               │
└─────────────────┼───────────────────────────────────────────────┘
                  │ wx.cloud.callContainer (免域名)
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  微信云托管 (Docker)                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   FastAPI 后端                            │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │   │
│  │  │ /repos │  │/commits│  │/issues │  │ /auth  │          │   │
│  │  └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘          │   │
│  │       └───────────┴───────────┴───────────┘               │   │
│  │                       │                                    │   │
│  │              ┌────────┴────────┐                          │   │
│  │              │   MongoDB/Mock  │                          │   │
│  │              │   (Motor 异步)  │                          │   │
│  │              └─────────────────┘                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | TypeScript, SCSS, 微信小程序 |
| **后端** | Python 3.9+, FastAPI, Pydantic |
| **数据库** | MongoDB (Motor 异步驱动) |
| **认证** | JWT + 微信登录 |
| **PDF** | ReportLab (中文字体支持) |
| **部署** | Docker, 微信云托管 |

---

## 快速开始

### 前提条件
- Python 3.9+
- 微信开发者工具
- （可选）Docker, MongoDB

### 1. 后端配置

```bash
# 克隆仓库
git clone https://github.com/yourusername/auto-repo.git
cd auto-repo/backend

# 安装依赖
pip install -r requirements.txt

# 创建 .env 文件
cp .env.example .env
# 编辑 .env 填入你的凭证

# 启动开发服务器
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**环境变量** (`.env`):
```bash
WECHAT_APPID=你的微信AppID
WECHAT_SECRET=你的微信密钥
JWT_SECRET=至少32位的随机字符串
MONGO_URL=mongodb://localhost:27017  # 可选，默认使用 MockDB
```

> 💡 没有 MongoDB 时，系统会自动使用 MockDB（基于文件）进行本地开发。

### 2. 前端配置

1. 打开 **微信开发者工具**
2. 导入 `miniprogram/` 目录
3. 设置 AppID（或使用测试模式）
4. 在 `miniprogram/config.ts` 中更新云环境：
   ```typescript
   export const CLOUD_ENV_ID = '你的云环境ID'
   ```
5. 编译预览

---

## 部署指南

### 微信云托管（推荐）

详细说明请参阅 [DEPLOY.md](./DEPLOY.md)。

```bash
# 构建并推送 Docker 镜像
cd backend
docker build -t autorepo-backend .

# 通过微信云托管控制台部署
# 1. 创建云托管服务
# 2. 上传容器镜像
# 3. 配置环境变量
```

**主要优势：**
- ✅ 无需域名备案
- ✅ 自动扩缩容（闲置时缩至零）
- ✅ 内置 HTTPS
- ✅ 内网直连访问

---

## 项目结构

```
auto-repo/
├── backend/                 # FastAPI 后端
│   ├── main.py              # 应用入口, CORS
│   ├── auth.py              # JWT + 微信登录
│   ├── routes.py            # API 端点 (15个路由)
│   ├── models.py            # Pydantic 数据模型
│   ├── database.py          # MongoDB 连接
│   ├── mock_db.py           # 开发用备用数据库
│   ├── Dockerfile           # 云托管优化版
│   └── requirements.txt
│
├── miniprogram/             # 微信小程序
│   ├── app.ts               # 生命周期, 云初始化
│   ├── config.ts            # 环境配置
│   ├── pages/               # UI 页面
│   ├── components/          # 可复用组件
│   └── services/            # API 客户端, 认证
│
├── docs/                    # 文档
├── AGENTS.md                # AI 助手指南
├── DEPLOY.md                # 部署指南
└── CONTRIBUTING.md          # 贡献指南
```

---

## API 概览

| 端点 | 方法 | 说明 |
|------|------|------|
| `/auth/login` | POST | 微信 code → JWT token |
| `/repos` | GET/POST | 列出/创建车辆 |
| `/repos/{id}` | GET/PUT/DELETE | 车辆增删改查 |
| `/commits` | GET/POST | 列出/创建记录 |
| `/commits/{id}` | GET/PUT/DELETE | 记录增删改查 |
| `/repos/{id}/issues` | GET/POST | 维护任务 |
| `/repos/{id}/stats` | GET | 费用统计 |
| `/repos/{id}/trends` | GET | 月度趋势 |
| `/repos/{id}/export` | GET | PDF 导出 |

本地运行时可访问 `http://localhost:8000/docs` 查看完整 API 文档。

---

## 路线图

- [x] 核心 UI/UX 及后端集成
- [x] 多用户认证
- [x] 图片上传及 PDF 导出
- [x] 数据可视化与统计
- [x] 微信云托管部署
- [ ] 社交分享与社区功能
- [ ] OCR 票据扫描
- [ ] 保养提醒（推送通知）

---

## 参与贡献

欢迎贡献！请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

```bash
# Fork 本仓库后：
git checkout -b feature/amazing-feature
git commit -m '添加超棒的功能'
git push origin feature/amazing-feature
# 发起 Pull Request
```

---

## 许可证

本项目基于 MIT 许可证开源 - 详见 [LICENSE](LICENSE) 文件。

---

<p align="center">
  为爱车人士用 ❤️ 打造
  <br>
  <a href="https://github.com/yourusername/auto-repo/issues">报告 Bug</a> •
  <a href="https://github.com/yourusername/auto-repo/issues">功能建议</a>
</p>
