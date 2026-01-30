<h1 align="center">🚗 AutoRepo</h1>

<p align="center">
  <strong>像管理代码一样，管理您的爱车档案。</strong>
</p>

<p align="center">
  <strong>简体中文</strong> | <a href="./README.md">English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v2.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/Frontend-MiniProgram-07c160.svg" alt="WeChat">
</p>

**AutoRepo** 是一款企业级、多租户车辆全生命周期管理系统。它巧妙地借用了 **Git 版本控制** 的概念，为汽车爱好者提供了一种结构化、可视化的方式来记录和回溯车辆的每一次"改变"。

- **Repo (仓库)** = 您的爱车
- **Commit (提交)** = 维修、保养或改装记录（现已支持图片！）
- **Issue (议题)** = 定期维护任务
- **HEAD (指针)** = 车辆当前状态（当前里程、车况等）

---

## 🎉 v2.0 新特性 (2026-01-29)

### 🚀 生产级部署
*   **微信云托管**: 完美支持 Serverless 部署
*   **免配置网络**: 直接内网链路访问 (无需域名/备案)
*   **自动扩缩容**: 闲置时自动缩容至零，极致省钱
*   **Docker 就绪**: 针对云环境优化的 Dockerfile

### 🔐 多用户认证
*   **微信一键登录**: 启动时自动登录
*   **JWT 认证**: 7天有效期
*   **数据隔离**: 每个用户只能看到自己的数据
*   **遗留数据迁移**: 从 v1.x 无缝升级

### 📸 图片上传
*   **可视化记录**: 每条维护记录最多上传9张照片
*   **云存储**: 自动备份到微信云
*   **智能压缩**: 自动减少数据使用量
*   **便捷管理**: 预览、删除、组织照片

### 📄 PDF 导出
*   **专业报告**: 生成完整维护历史 PDF
*   **一键下载**: 即时导出所有车辆记录
*   **打印就绪**: 分享给买家、保险公司或个人存档
*   **精美排版**: 表格样式化，组织清晰

### 🌙 深色模式
*   **自动检测**: 跟随系统深色模式设置
*   **护眼友好**: 舒适的夜间浏览体验
*   **OLED 优化**: 在 OLED 屏幕上节省电量

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
*   **🔍 搜索与筛选**: 按类型、日期范围、里程和关键词搜索。
*   **📊 数据洞察**: 可视化图表展示费用构成和趋势。
*   **❓ 内置帮助手册**: 主菜单可快速访问操作指南。

## 🛠 技术栈

### 前端 (微信小程序)
*   **语言**: TypeScript (严格模式)
*   **样式**: SCSS (Sass), 自定义 UI 组件
*   **云服务**: 微信云存储（图片）
*   **特性**: 自定义导航栏, 响应式布局, 交互动画, 深色模式

### 后端 (服务器)
*   **框架**: FastAPI (Python 3.9+)
*   **认证**: JWT + 微信登录
*   **数据库**: MongoDB (via Motor 异步驱动) / MockDB (本地开发)
*   **PDF 生成**: ReportLab
*   **部署**: Docker & Docker Compose (可选)
*   **API**: RESTful API 设计，带自动生成的 Swagger 文档

## 🚀 快速开始

### 前提条件
*   Python 3.9+
*   微信开发者工具
*   (可选) Docker & Docker Compose

### 1. 后端设置

#### 安装依赖
```bash
cd backend
pip install -r requirements.txt
```

#### 配置环境变量
创建 `backend/.env` 文件：
```bash
# 微信小程序凭证
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# JWT 密钥 (使用随机字符串，至少 32 字符)
JWT_SECRET=your-random-secret-key-at-least-32-characters

# 数据库 (可选，默认使用 MockDB)
MONGO_URL=mongodb://localhost:27017
```

#### 启动服务器
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

*   系统如果检测不到 MongoDB，会自动切换到 `MockDB` (数据保存在本地 JSON 文件中)。
*   API 文档地址: `http://localhost:8000/docs`

### 2. 前端设置

1. **打开微信开发者工具**
2. **导入项目**: 选择 `auto-repo/miniprogram` 目录
3. **设置 AppID**: 使用您的微信小程序 AppID 或测试模式
4. **配置云服务**: 在 `miniprogram/app.ts` 中更新云环境 ID:
   ```typescript
   wx.cloud.init({
     env: 'your-cloud-env-id',  // 替换为您的云环境
     traceUser: true
   })
   ```
5. **编译并运行**

## 📂 项目结构

```
auto-repo/
├── backend/                    # FastAPI 后端
│   ├── main.py                 # 入口文件, CORS, 生命周期
│   ├── auth.py                 # JWT 认证 & 微信登录 (新!)
│   ├── routes.py               # API 端点 (15 个受保护路由)
│   ├── models.py               # Pydantic 数据模型
│   ├── database.py             # MongoDB 连接管理器
│   ├── mock_db.py              # 基于文件的备用数据库
│   ├── .env.example            # 环境变量模板 (新!)
│   └── requirements.txt        # Python 依赖
│
├── miniprogram/                # 微信小程序
│   ├── app.ts                  # App 生命周期, 云初始化, 自动登录
│   ├── app.json                # 深色模式配置 (新!)
│   ├── theme.json              # 明暗主题颜色 (新!)
│   ├── pages/                  # UI 页面
│   │   ├── repo-list/          # 车辆列表
│   │   ├── repo-detail/        # 时间轴 + 洞察 + 任务
│   │   ├── commit-create/      # 添加记录（含图片上传）(更新!)
│   │   └── ...
│   ├── components/             # 可复用组件
│   │   ├── insights-view/      # 数据可视化
│   │   ├── filter-bar/         # 搜索 & 筛选
│   │   └── ...
│   ├── services/
│   │   ├── api.ts              # 后端 API 封装
│   │   └── auth.ts             # 登录 & token 管理 (新!)
│   └── ...
│
├── docs/                       # 文档
│   ├── WORK_SUMMARY.md         # 开发总结 (新!)
│   ├── TESTING_GUIDE.md        # 测试说明 (新!)
│   └── FEATURE_SUMMARY.md      # 功能详情 (新!)
│
├── AGENTS.md                   # 开发指南 (更新!)
└── README.md                   # 本文件 (更新!)
```

## 🛣 路线图

- [x] **阶段 1**: 核心 UI/UX 实现 & 后端集成
- [x] **阶段 2**: 多用户认证 & 安全性
- [x] **阶段 3**: 图片上传 & PDF 导出
- [x] **阶段 3.5**: 数据可视化、费用统计 & 任务管理
- [x] **阶段 4**: Bug 修复与 UX 改进 (2026-01)
- [x] **阶段 5**: 云端部署 (微信云托管)
- [ ] **阶段 6**: 社交分享功能 & 社区

## 🔧 最近更新

### v2.0 (2026-01-30) - 生产级部署发布
**部署与基础设施**:
- ✅ 支持微信云托管 (Dockerfile 优化)
- ✅ 集成 `wx.cloud.callContainer` (免域名访问)
- ✅ 多环境配置支持 (开发/真机/生产)
- ✅ 详尽的 [部署指南](./DEPLOY.md)

### v2.0 (2026-01-29) - 企业级多租户发布
**认证 & 安全**:
- ✅ 基于 JWT 的微信登录系统
- ✅ 多租户数据隔离 (user_openid 过滤)
- ✅ 全部 15 个 API 端点受保护
- ✅ 启动时自动登录
- ✅ 7天 token 有效期，自动刷新

**新功能**:
- ✅ 图片上传（每条记录最多9张照片）
- ✅ 微信云存储集成
- ✅ 使用 ReportLab 生成 PDF 导出
- ✅ 深色模式基础设施（自动检测就绪）

**技术改进**:
- ✅ 用户范围查询的数据库索引
- ✅ MockDB 完全兼容 MongoDB
- ✅ 环境变量配置
- ✅ 全面的文档

### v1.3 (2026-01-28) - 深度代码审计与优化
**安全修复**（9个关键漏洞）:
- ✅ ObjectId 注入防护
- ✅ 批量赋值保护
- ✅ Regex 注入防御
- ✅ 跨仓库数据访问防护
- ✅ 网络层超时与重试机制

**性能优化**（查询减少67%）:
- ✅ 数据库查询优化（3次→1次，使用 `$facet`）
- ✅ 列表滑动性能提升100%
- ✅ 原子操作保证里程单调递增

**代码质量**（新增171行，删除约150行）:
- ✅ 新增工具模块：`utils/date.ts`、`utils/vehicle.ts`
- ✅ 网络层重构
- ✅ 不可变状态更新

### v1.2 (2026-01-27) - Bug 修复
- ✅ 实现编辑模式完整数据预填充
- ✅ 修复 CSV 导出费用显示为0的问题
- ✅ 修复图表最大值计算错误
- ✅ 时间线卡片显示费用和日期
- ✅ 购车费用正确计入总成本

### v1.1 (2026-01-26) - 功能增强
- ✅ 新增日期/时间选择器，支持自定义时间戳
- ✅ 实现维保记录的编辑与删除功能
- ✅ 模板库扩展至 12 个（新增燃油费、停车费）
- ✅ 修复微信环境下的 CSV 导出分享

## 📚 文档

- [AGENTS.md](./AGENTS.md) - AI 助手开发指南
- [DEPLOY.md](./DEPLOY.md) - 云托管部署指南
- [docs/WORK_SUMMARY.md](./docs/WORK_SUMMARY.md) - 详细开发总结
- [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md) - 全面的测试说明
- [docs/FEATURE_SUMMARY.md](./docs/FEATURE_SUMMARY.md) - 完整功能文档

## 🤝 贡献代码

欢迎提交 Pull Request 来参与贡献！

## 📄 许可证

本项目基于 MIT 许可证开源 - 详情请参阅 [LICENSE](LICENSE) 文件。
