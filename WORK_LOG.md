# AutoRepo 项目工作日志与文档

**最后更新时间**: 2026-01-23
**当前状态**: Phase 3 完成 (数据洞察、MockDB 增强、UI 优化)

## 1. 项目概述
AutoRepo 是一个基于 "Git for Cars" 概念的车辆整备管理系统。它将车辆视为仓库 (Repo)，将维修保养记录视为提交 (Commit)，提供了完整的车辆生命周期管理功能。

### 技术栈
- **前端**: 微信小程序 (TypeScript + SCSS + WXML)
- **后端**: FastAPI (Python)
- **数据库**: MongoDB (目前回退使用基于文件的 MockDB)
- **部署**: Docker & Docker Compose

---

## 2. 文件结构说明

### 📂 Backend (`/backend`)
提供 RESTful API 服务，运行于 Docker 容器中 (Port: 8001)。

| 文件名 | 用途 |
|--------|------|
| `main.py` | 程序入口，配置跨域 (CORS) 和路由挂载。 |
| `routes.py` | 核心业务逻辑，定义了 `/repos`, `/commits`, `/issues` 等 API 接口。 |
| `models.py` | Pydantic 数据模型定义 (Repo, Commit, Issue 等)。 |
| `database.py` | 数据库连接管理，包含自动回退到 MockDB 的逻辑。 |
| `mock_db.py` | **核心模拟组件**。实现了类似 MongoDB 的 CRUD 接口 (包括 `find`, `insert_one`, `delete_one`, `aggregate`)，数据持久化到 JSON 文件。 |
| `mock_db_data.json` | 模拟数据库的存储文件，包含车辆、记录和问题数据。 |
| `docker-compose.yml` | 容器编排配置，定义了 Backend 和 MongoDB 服务。已配置端口映射 `8001:8000` 和热重载。 |
| `Dockerfile` | Python 环境构建文件。 |

### 📂 Miniprogram (`/miniprogram`)
微信小程序客户端。

#### 页面 (`/pages`)
| 页面 | 说明 | 关键功能 |
|------|------|----------|
| `repo-list` | **首页/车辆列表** | 列表展示、左滑删除、添加车辆入口。支持显示车龄和里程。 |
| `repo-create` | **新建/编辑车辆** | 表单页，支持 VIN、颜色选择、重要日期（保险/年检）输入。 |
| `repo-detail` | **车辆详情** | 双 Tab 设计：<br>1. **时间线**: 显示 `dashboard-widget` 和整备记录列表。<br>2. **数据统计**: 加载 `insights-view` 组件。 |
| `commit-create` | **提交记录** | 创建新的维修/保养记录，支持关联关闭 Issue。 |
| `commit-detail` | **记录详情** | 展示单次记录的费用、里程和备注。 |
| `issue-create` | **新建提醒** | 创建待办事项（如"下次保养"），支持设定目标里程或日期。 |

#### 组件 (`/components`)
- **`dashboard-widget`**: 首页顶部的高优先级警报组件（如"今日年检到期"），支持点击"处理"直接跳转解决。
- **`insights-view`**: 数据洞察组件，展示总花费、每公里成本、费用构成图表以及待办事项列表。支持点击"✓"快速完成待办。

#### 服务 (`/services`)
- **`api.ts`**: 封装所有后端请求。`BASE_URL` 配置为 `http://localhost:8001/api`。

---

## 3. 开发日志与里程碑

### Phase 1: 基础架构 (已完成)
- [x] 搭建 FastAPI 后端与 Docker 环境。
- [x] 实现 Repo (车辆) 和 Commit (记录) 的 CRUD。
- [x] 完成小程序基础页面 (List, Detail, Create)。

### Phase 2: 自动化与逻辑增强 (已完成)
- [x] 实现 Commit 提交时自动更新车辆里程和 HEAD 指针。
- [x] 引入 Issue (问题/提醒) 系统。

### Phase 3: 数据洞察与体验优化 (本次完成)
- [x] **数据洞察**: 实现了 `insights-view`，提供费用统计和直观的图表数据。
- [x] **交互优化**: 
    - 列表页支持流畅的左滑删除交互。
    - 优化了 Tab Bar 样式（磨砂玻璃效果）。
    - 优化了标题字体（更粗、更大）。
- [x] **MockDB 增强**: 
    - 为 MockDB 添加了 `delete_one`, `delete_many` 和聚合查询 (`aggregate`) 支持，使其功能更接近真实 MongoDB。
- [x] **Bug 修复**:
    - 解决了后端端口冲突 (8000 -> 8001)。
    - 修复了删除车辆时的 405 Method Not Allowed 错误。
    - 修复了卡片颜色保存问题。

---

### Phase 3.5: UI 标准化与细节打磨 (本次完成)
- [x] **全局导航栏 (Custom Nav)**:
    - 实现了 `custom-nav` 全局组件，替代了系统原生导航栏。
    - **点击回城**: 点击顶部的 "AutoRepo" 标题现在可以快速返回首页。
    - **样式统一**: 所有子页面应用统一的 "AutoRepo" 品牌标题 (加粗、紧凑间距)。
    - **自动适配**: 自动处理 iPhone 胶囊按钮对齐和安全区域。
- [x] **车辆列表 (Home) 优化**:
    - **卡片样式**: 将车辆卡片和"添加车辆"按钮高度统一增加至 **140px**，视觉更饱满。
    - **按钮增强**: "添加车辆"按钮的加号图标大小增至 36px，文字加粗，层级更清晰。
    - **布局调整**: 恢复了舒适的页面左右边距，移除不必要的紧凑感。
- [x] **详情页 (Detail) 修复**:
    - 修复了 `repo-detail` 和 `repo-create` 页面内容距离顶部导航栏间距过大的问题 (由重复 padding 导致)。
    - 为卡片增加了合适的顶部呼吸间距。

---


## 4. 维护指南

### 启动项目
1. **后端**: 
   在 `/backend` 目录下运行：
   ```bash
   docker-compose up -d
   ```
   服务运行在 `http://localhost:8001`。

2. **前端**:
   使用微信开发者工具导入 `/miniprogram` 目录。

### 常见问题
- **API 报错 405**: 检查是否访问了正确的端口 (8001)，确认为最新 Docker 镜像。
- **数据不保存**: 检查 `mock_db_data.json` 权限。Docker 模式下该文件通过 Volume 挂载，修改会自动同步。
