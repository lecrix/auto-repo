# AutoRepo 开发历史

> **版本**: v2.1  
> **更新日期**: 2026-02-03

---

## 版本记录

### v2.1 (2026-02-03) - 功能完善

#### 新功能
- **Issue 详情页**: 查看和编辑待办任务详情
- **左滑删除**: 车辆列表和任务列表支持左滑删除
- **任务状态管理**: 支持完成/重新打开任务

#### 修复
- **PDF 导出**: 修复 `wx.cloud.callContainer` 不支持二进制响应的问题
  - 新增 `/export/pdf-base64` 端点返回 Base64 编码
  - 前端使用 `wx.base64ToArrayBuffer()` 解码
- **时间显示**: 时间线和详情页仅显示日期，不显示时间
- **UI 修复**: 移除 insights-view 底部多余空白

#### 项目清理
- 删除 `docs/technical/` 过时文档（7个文件，88KB）
- 清理 `node_modules/` 多余依赖
- 移动 `DEPLOY.md` 到 `docs/` 文件夹
- 更新 README 项目结构

---

### v2.0 (2026-01-29) - 生产级升级

#### 新功能
- **用户认证**: JWT + 微信登录 + 多租户数据隔离
- **图片上传**: 每条记录最多 9 张图片，云存储持久化
- **PDF 导出**: 一键导出完整维护历史报告
- **深色模式**: 自动跟随系统设置

#### 技术实现
- 后端: `auth.py` 认证模块，15 个 API 接口保护
- 前端: `services/auth.ts` 登录服务，自动注入 Token
- 数据库: 用户索引优化

---

### v1.3 (2026-01-28) - 安全与性能

- 修复 9 个安全漏洞
- 查询性能提升 67%
- 代码质量优化

---

### v1.2 (2026-01-27) - Bug 修复

- 编辑模式数据预填充
- CSV 导出费用显示
- 图表显示优化

---

### v1.1 (2026-01-26) - 功能增强

- 日期时间选择器
- 记录编辑删除
- 12 个维护模板

---

### v1.0 (2026-01-25) - 首次发布

- 核心功能上线
- 数据可视化
- 多车辆支持

---

## 代码统计

### v2.1 变更

| 类型 | 文件数 | 说明 |
|------|--------|------|
| 新增 | 4 | issue-detail 页面 |
| 修改 | 12 | 路由、组件、样式 |
| 删除 | 8 | 过时文档、冗余配置 |

### 项目结构

```
auto-repo/
├── backend/           # FastAPI 后端 (8 个核心文件)
├── miniprogram/       # 微信小程序 (40+ 文件)
├── docs/              # 文档 (4 个文件)
├── AGENTS.md          # AI 助手指南
├── CONTRIBUTING.md    # 贡献指南
└── README.md          # 项目说明
```

---

## 技术亮点

### 依赖注入认证
```python
async def get_repos(user_openid: str = Depends(get_current_user)):
    repos = await db.repos.find({"user_openid": user_openid})
```

### PDF Base64 导出
```python
@router.get("/repos/{repo_id}/export/pdf-base64")
async def export_pdf_base64(repo_id: str):
    # 生成 PDF 并返回 Base64 编码
    return {"data": base64.b64encode(buffer.getvalue()).decode()}
```

### 左滑删除组件
```xml
<movable-area>
  <movable-view direction="horizontal" x="{{item.offsetX}}">
    <!-- 内容 -->
  </movable-view>
</movable-area>
<view class="delete-action">删除</view>
```

---

## 相关文档

- [功能总结](./FEATURE_SUMMARY.md)
- [部署指南](./DEPLOY.md)
- [测试指南](./TESTING_GUIDE.md)

---

*最后更新: 2026-02-03*
