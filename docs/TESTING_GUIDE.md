# AutoRepo 测试指南

> **版本**: v2.1  
> **更新日期**: 2026-02-03

---

## 目录

1. [环境准备](#环境准备)
2. [后端测试](#后端测试)
3. [前端测试](#前端测试)
4. [常见问题](#常见问题)

---

## 环境准备

### 后端配置

```bash
cd backend
pip install -r requirements.txt
```

创建 `backend/.env` 文件：
```bash
WECHAT_APPID=你的微信AppID
WECHAT_SECRET=你的微信密钥
JWT_SECRET=至少32位的随机字符串
MONGO_URL=mongodb://localhost:27017  # 可选
ENVIRONMENT=development
```

启动服务：
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 前端配置

1. 微信开发者工具导入 `miniprogram/` 目录
2. 配置 `miniprogram/config.ts`：
   ```typescript
   const CURRENT_MODE: 'dev' | 'device' | 'prod' = 'dev'
   ```

---

## 后端测试

### API 文档

访问 `http://localhost:8000/docs` 查看 Swagger 文档。

### 健康检查

```bash
curl http://localhost:8000/
# 预期: {"message": "AutoRepo Backend is Running"}
```

### 认证测试

```bash
# 无 Token 访问（应返回 401）
curl http://localhost:8000/api/repos

# 有 Token 访问
curl http://localhost:8000/api/repos \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### PDF 导出测试

```bash
curl -X GET "http://localhost:8000/api/repos/{repo_id}/export/pdf-base64" \
  -H "Authorization: Bearer YOUR_TOKEN"
# 返回 Base64 编码的 PDF 数据
```

---

## 前端测试

### 编译检查

1. 微信开发者工具点击"编译"
2. 确认无错误输出

### 功能测试清单

| 功能 | 测试步骤 | 预期结果 |
|------|---------|---------|
| 自动登录 | 清除缓存后重新打开 | 控制台显示登录成功 |
| 车辆列表 | 打开首页 | 显示车辆卡片或空状态 |
| 添加车辆 | 点击"+"填写信息 | 保存成功，返回列表 |
| 添加记录 | 进入车辆详情，添加记录 | 时间线显示新记录 |
| 图片上传 | 创建记录时选择图片 | 显示上传进度和缩略图 |
| 待办任务 | 创建 Issue | 仪表盘显示待办 |
| 完成任务 | 点击 ✓ 按钮 | 任务标记完成 |
| 左滑删除 | 左滑车辆/任务卡片 | 显示删除按钮 |
| PDF 导出 | 设置页导出 | 文件保存成功 |
| 筛选功能 | 使用筛选栏 | 列表按条件过滤 |

### 集成测试流程

1. **首次登录** → 自动获取 Token
2. **添加车辆** → 填写信息保存
3. **添加记录** → 上传图片提交
4. **创建任务** → 设置提醒
5. **查看统计** → 费用图表正确
6. **导出 PDF** → 文件可打开
7. **退出重进** → 数据完整

---

## 常见问题

### 401 Unauthorized

**原因**: Token 过期或无效

**解决**:
```typescript
wx.removeStorageSync('autorepo_token')
wx.removeStorageSync('autorepo_openid')
// 重新编译
```

### 图片上传失败

**检查**:
1. 云环境 ID 是否正确
2. 云存储权限是否配置
3. 网络是否正常

### PDF 中文乱码

后端已内置中文字体支持，如仍有问题需检查 ReportLab 配置。

### MockDB 数据丢失

检查 `backend/mock_db_data.json` 文件权限，或切换到 MongoDB。

### 无法连接后端

检查清单：
- [ ] 后端服务是否启动
- [ ] 端口是否正确（默认 8000）
- [ ] config.ts 中 baseURL 是否匹配
- [ ] 防火墙是否阻止

---

## 测试检查清单

### 后端
- [ ] 健康检查正常
- [ ] 数据库连接成功
- [ ] 认证接口返回 Token
- [ ] 受保护接口拒绝无 Token 请求
- [ ] PDF 导出生成成功

### 前端
- [ ] 编译无错误
- [ ] 自动登录成功
- [ ] 车辆 CRUD 正常
- [ ] 记录 CRUD 正常
- [ ] 图片上传成功
- [ ] 任务 CRUD 正常
- [ ] 数据统计正确

---

## 相关文档

- [部署指南](./DEPLOY.md)
- [功能总结](./FEATURE_SUMMARY.md)
- [开发历史](./WORK_SUMMARY.md)

---

*最后更新: 2026-02-03*
