<h1 align="center">🚗 AutoRepo</h1>

<p align="center">
  <strong>像管理代码一样，管理您的爱车档案。</strong>
</p>

<p align="center">
  <strong>简体中文</strong> | <a href="./README.md">English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/Frontend-MiniProgram-07c160.svg" alt="WeChat">
</p>

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
*   **📝 编辑与删除记录**: 支持对现有维保记录进行修改或确认删除。
*   **📅 自定义时间戳**: 支持为每条记录设置自定义日期和时间（不仅限于自动生成）。
*   **⛽ 扩展模板库**: 包含燃油费、停车费在内的 12 种常用维保模板。
*   **💰 购车成本追踪**: 在资产统计中追踪车辆的初始购买成本。
*   **❓ 内置帮助手册**: 主菜单可快速访问操作指南。

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

### 1. 启动后端 (本地模式)
由于 Docker 在部分 Windows 环境下可能不稳定，我们在本地开发时推荐直接运行 Python 后端，并使用内置的 Mock 数据库 (基于文件)。

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动服务器
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*   系统如果检测不到 MongoDB，会自动切换到 `MockDB` (数据保存在本地 JSON 文件中)。
*   API 文档地址: `http://localhost:8000/docs`.

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
│   ├── mock_db.py          # 本地 Mock 数据库 (新!)
│   ├── models.py           # 数据模型
│   ├── routes.py           # API 路由
│   └── ...
├── miniprogram/            # 微信小程序源码
│   ├── pages/              # UI 页面
│   │   ├── repo-detail/    # 详情页 (时间轴 + 数据概览)
│   │   ├── issue-create/   # 创建提醒 (新!)
│   │   └── ...
│   ├── components/         # 可复用组件
│   │   ├── insights-view/  # 数据可视化 & 任务列表
│   │   ├── dashboard-widget/ # 首页高优先级提醒
│   │   └── ...
│   └── ...
└── docker-compose.yml      # (可选) 容器编排
```

## 🛣 路线图

- [x] **阶段 1**: 核心 UI/UX 实现 & 后端集成
- [ ] **阶段 2**: 云端部署 (微信云托管)
- [x] **阶段 3**: 数据可视化、费用统计 & 任务管理
- [x] **阶段 3.5**: Bug 修复与 UX 改进 (2026-01)
- [ ] **阶段 4**: 社交分享功能

## 🔧 最近更新 (2026-01-27)

### 第二轮Bug修复 (Round 2)
- ✅ 实现编辑模式完整数据预填充（含保险字段解析）
- ✅ 移除冗余时间选择器，简化日期录入
- ✅ 修复CSV导出费用显示为0的问题
- ✅ 修复图表最大值计算错误和月份显示问题
- ✅ 时间线卡片显示费用和日期（不再显示ID）
- ✅ 模板系统重组：新增保险模板，简化费用输入
- ✅ 统一里程标签术语，消除用户困惑
- ✅ 购车费用正确计入总成本统计
- ✅ 修复帮助图标被导航栏遮挡问题

### 第一轮Bug修复与改进
- ✅ 新增日期/时间选择器，支持自定义记录时间戳
- ✅ 实现维保记录的编辑与删除功能
- ✅ 里程字段设为可选（适用于停车、加油等场景）
- ✅ 模板库扩展至 12 个（新增燃油费、停车费模板）
- ✅ 修复微信环境下的 CSV 导出分享（采用 .xls 格式）
- ✅ 详情页支持车辆自定义颜色动态主题
- ✅ 新增购车成本追踪功能
- ✅ 优化里程显示（展示购车后的行驶距离）
- ✅ 新增应用内帮助文档

## 🤝 贡献代码

欢迎提交 Pull Request 来参与贡献！

## 📄 许可证

本项目基于 MIT 许可证开源 - 详情请参阅 [LICENSE](LICENSE) 文件。
