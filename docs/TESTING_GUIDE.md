# AutoRepo 测试指南

> **版本**: v2.1  
> **更新日期**: 2026-01-30

---

## 📋 目录

1. [环境准备](#环境准备)
2. [后端测试](#后端测试)
3. [前端测试](#前端测试)
4. [集成测试](#集成测试)
5. [云托管部署验证](#云托管部署验证)
6. [常见问题](#常见问题)

---

## 🔧 环境准备

### 1. 后端环境配置

#### 安装依赖
```bash
cd backend
pip install -r requirements.txt
```

#### 创建环境变量文件
创建 `backend/.env` 文件：
```bash
# 微信小程序配置
WECHAT_APPID=wx1234567890abcdef
WECHAT_SECRET=your_secret_here

# JWT 配置（使用随机字符串）
JWT_SECRET=your-random-secret-key-at-least-32-characters

# 数据库配置（可选）
MONGO_URL=mongodb://localhost:27017

# 环境模式 (development/production)
ENVIRONMENT=development
```

⚠️ **注意**: 
- `WECHAT_APPID` 和 `WECHAT_SECRET` 需要从微信公众平台获取
- `JWT_SECRET` 必须是随机生成的强密码（建议 32+ 字符）

#### 启动后端服务
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

成功启动后会看到：
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
Connected to MongoDB at mongodb://localhost:27017
# 或者
Warning: Could not connect to MongoDB. Using Mock Database.
```

### 2. 前端环境配置

#### 打开微信开发者工具
1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开工具 → 导入项目
3. 项目目录选择 `auto-repo/miniprogram`
4. AppID 选择测试号或真实 AppID

#### 配置云开发环境
确保 `miniprogram/app.ts` 中的云环境 ID 正确：
```typescript
wx.cloud.init({
  // env: 'cloud1-5g2vgpovd2d7461b',  // 替换为你的云环境 ID (选填)
  traceUser: true
})
```

#### 配置环境模式
在 `miniprogram/config.ts` 中配置：
```typescript
// 模式选择: 'dev' (本地开发), 'device' (真机调试), 'prod' (云托管-生产环境)
const CURRENT_MODE: 'dev' | 'device' | 'prod' = 'dev'
```

---

## 🔬 后端测试

### 测试 1: API 文档访问

**目的**: 验证后端服务正常启动

**步骤**:
1. 启动后端服务
2. 浏览器访问 `http://localhost:8000/docs`
3. 应该看到 FastAPI 自动生成的 Swagger 文档

**预期结果**:
- ✅ 页面正常显示
- ✅ 可以看到所有 API 接口列表
- ✅ 包含 `/api/auth/login`, `/api/repos`, `/api/commits` 等

### 测试 2: 健康检查

**目的**: 验证基本路由工作正常

**步骤**:
```bash
curl http://localhost:8000/
```

**预期结果**:
```json
{"message": "AutoRepo Backend is Running"}
```

### 测试 3: 数据库连接

**目的**: 验证数据库初始化成功

**步骤**:
1. 查看启动日志
2. 确认数据库连接状态

**预期结果** (MongoDB):
```
Connected to MongoDB at mongodb://localhost:27017
```

**预期结果** (MockDB):
```
Warning: Could not connect to MongoDB. Using Mock Database.
```

### 测试 4: 认证接口测试

**目的**: 验证 JWT 认证流程

⚠️ **前提**: 需要真实的微信 AppID 和 Secret

**步骤**:
```bash
# 1. 模拟登录（需要真实的微信 code）
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code": "REAL_WECHAT_CODE"}'
```

**预期结果**:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "openid": "oXXXX-xxxxxxxxxxxxxx"
}
```

**如果没有真实 code**:
```json
{
  "detail": "WeChat login failed: invalid code"
}
```

### 测试 5: 受保护接口测试

**目的**: 验证认证保护生效

**步骤 1 - 无 Token 访问**:
```bash
curl http://localhost:8000/api/repos
```

**预期结果**:
```json
{"detail": "Not authenticated"}
```

**步骤 2 - 有 Token 访问**:
```bash
# 使用上一步获取的 token
curl http://localhost:8000/api/repos \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期结果**:
```json
[]  # 或用户的车辆列表
```

### 测试 6: PDF 导出测试

**目的**: 验证 PDF 生成功能

**前提**: 
1. 数据库中有车辆数据
2. 已登录获取 Token

**步骤**:
```bash
curl -X GET http://localhost:8000/api/repos/{repo_id}/export/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o test.pdf
```

**预期结果**:
- ✅ `test.pdf` 文件成功生成
- ✅ 文件大小 > 0
- ✅ 可以用 PDF 阅读器打开
- ✅ 包含车辆信息和维护记录

---

## 📱 前端测试

### 测试 1: 编译检查

**目的**: 验证代码无语法错误

**步骤**:
1. 微信开发者工具打开项目
2. 点击"编译"按钮
3. 查看控制台输出

**预期结果**:
- ✅ 编译成功，无错误
- ⚠️ 可能有警告（如未使用的变量）

### 测试 2: 自动登录测试

**目的**: 验证应用启动时自动登录

**步骤**:
1. 清除缓存（工具 → 清除缓存 → 清除授权数据）
2. 重新编译
3. 查看控制台

**预期结果**:
```
Auto-login successful
```

**如果失败**:
```
Auto-login failed: [错误信息]
```

**常见失败原因**:
- ❌ 后端未启动
- ❌ WECHAT_APPID 配置错误
- ❌ 网络连接问题

### 测试 3: 车辆列表加载

**目的**: 验证数据获取和展示

**步骤**:
1. 打开小程序首页（repo-list）
2. 观察是否显示车辆列表

**预期结果**:
- ✅ 显示"我的车辆"标题
- ✅ 显示车辆卡片（如果有数据）
- ✅ 显示"+ 添加车辆"按钮

**如果显示空白**:
1. 检查控制台是否有错误
2. 检查网络请求是否成功（Network 标签）
3. 验证 Token 是否有效

### 测试 4: 图片上传测试

**目的**: 验证图片上传到云存储

**步骤**:
1. 进入任一车辆详情页
2. 点击"添加记录"
3. 填写必要信息
4. 点击图片上传区域的 "+" 按钮
5. 选择 1-3 张图片
6. 观察上传进度

**预期结果**:
- ✅ 显示"上传图片..."加载提示
- ✅ 上传成功后显示缩略图
- ✅ 可以点击删除按钮移除图片
- ✅ 最多可上传 9 张

**常见问题**:
- ❌ 云环境未配置 → 检查 `app.ts` 中的 `env` 参数
- ❌ 权限不足 → 在云开发控制台配置存储权限

### 测试 5: 创建维护记录（含图片）

**目的**: 端到端测试完整流程

**步骤**:
1. 填写记录信息：
   - 标题：常规保养
   - 类型：保养
   - 日期：2026-01-29
   - 里程：50000
   - 费用：500
2. 上传 2 张图片
3. 点击"提交记录"

**预期结果**:
- ✅ 显示"提交 Commit..."加载
- ✅ 1-2 秒后显示"提交成功"
- ✅ 自动返回详情页
- ✅ 时间线中出现新记录
- ✅ 记录卡片显示费用和日期

### 测试 6: 筛选功能测试

**目的**: 验证搜索和筛选

**步骤**:
1. 进入车辆详情页（需要有多条记录）
2. 使用筛选栏（filter-bar）
3. 尝试不同筛选条件

**测试场景**:
| 筛选条件 | 预期结果 |
|---------|---------|
| 类型=保养 | 只显示保养记录 |
| 类型=维修 | 只显示维修记录 |
| 搜索"机油" | 显示标题或描述包含"机油"的记录 |
| 清除筛选 | 显示所有记录 |

---

## 🔗 集成测试

### 完整用户流程测试

**场景**: 新用户从注册到使用的完整流程

#### 步骤 1: 首次登录
1. 清除所有缓存
2. 重新打开小程序
3. **验证**: 自动完成微信登录

#### 步骤 2: 添加车辆
1. 点击"+ 添加车辆"
2. 填写信息：
   - 名称：本田雅阁
   - 车架号：LHGCP1234567890
   - 颜色：#3498db（蓝色）
   - 当前里程：30000
   - 购车费用：150000
3. 点击"保存"
4. **验证**: 
   - ✅ 自动生成"购车费用"记录
   - ✅ 返回列表页显示新车辆

#### 步骤 3: 添加维护记录
1. 进入车辆详情
2. 点击"添加记录"
3. 选择模板"常规保养"
4. 上传 2 张图片（机油照片）
5. 提交
6. **验证**:
   - ✅ 记录出现在时间线
   - ✅ 里程自动更新
   - ✅ 费用统计更新

#### 步骤 4: 查看数据统计
1. 在详情页查看"洞察"部分
2. **验证**:
   - ✅ 总费用 = 购车费用 + 维护费用
   - ✅ 费用构成饼图显示
   - ✅ 每公里成本计算正确

#### 步骤 5: 导出 PDF（需完善前端）
1. 点击"导出 PDF"按钮（待实现）
2. **预期**: 下载包含完整历史的 PDF 文件

#### 步骤 6: 退出重新登录
1. 关闭小程序
2. 重新打开
3. **验证**:
   - ✅ 自动登录成功
   - ✅ 数据完整显示
   - ✅ 之前的车辆和记录都在

---

## ☁️ 云托管部署验证

**目的**: 验证生产环境部署是否成功

**前提**: 
1. 已在微信云托管部署后端服务 (参考 `DEPLOY.md`)
2. 前端配置 `CURRENT_MODE = 'prod'`

**步骤**:
1. 开发者工具上传代码并设为体验版
2. 手机扫码打开体验版
3. 观察是否能自动登录

**预期结果**:
- ✅ 自动登录成功 (Token 获取正常)
- ✅ 车辆列表加载成功 (接口调用正常)
- ✅ 无需开启"开发调试"模式也能访问
- ✅ 速度体验：首次打开可能有几秒冷启动延迟，之后响应迅速

---

## ❓ 常见问题

### 问题 1: 401 Unauthorized 错误

**症状**: 所有 API 请求返回 401

**原因**:
- Token 已过期（7 天有效期）
- Token 格式错误
- 后端 JWT_SECRET 改变

**解决方案**:
```typescript
// 清除本地缓存重新登录
wx.removeStorageSync('autorepo_token')
wx.removeStorageSync('autorepo_openid')
// 重新编译小程序
```

### 问题 2: 图片上传失败

**症状**: 点击上传后无响应或报错

**原因**:
- 云环境未初始化
- 权限配置错误
- 网络问题

**解决方案**:
1. 检查云环境配置：
   ```typescript
   // app.ts
   wx.cloud.init({
     // env: 'cloud1-5g2vgpovd2d7461b',  // 确认正确
     traceUser: true
   })
   ```

2. 在微信云控制台检查：
   - 云存储是否开通
   - 存储权限是否配置（建议：所有用户可读，仅创建者可写）

### 问题 3: PDF 导出中文乱码

**症状**: PDF 中中文显示为方块

**原因**: ReportLab 默认不支持中文字体

**解决方案**:
```python
# 需要安装中文字体支持（当前版本已处理基础场景）
# 如果仍有问题，需要注册自定义中文字体
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# 注册字体（需要先下载 .ttf 文件）
pdfmetrics.registerFont(TTFont('SimSun', 'SimSun.ttf'))
```

### 问题 4: MockDB 数据丢失

**症状**: 重启后端后数据消失

**原因**: MockDB 数据存储在 `backend/mock_db_data.json`，可能被删除或权限问题

**解决方案**:
1. 检查文件是否存在
2. 确保后端进程有写权限
3. 考虑切换到真实 MongoDB

### 问题 5: 无法连接后端

**症状**: 前端所有请求超时

**检查清单**:
- [ ] 后端服务是否启动（`http://localhost:8000/docs` 能否访问）
- [ ] 前端配置的 baseURL 是否正确
- [ ] 端口是否被占用（改用其他端口）
- [ ] 防火墙是否阻止（临时关闭测试）

---

## 📊 测试检查清单

### 后端核心功能
- [ ] 健康检查接口正常
- [ ] 数据库连接成功（MongoDB 或 MockDB）
- [ ] 认证接口返回 Token
- [ ] 受保护接口拒绝无 Token 请求
- [ ] 受保护接口接受有效 Token
- [ ] PDF 导出生成成功

### 前端核心功能
- [ ] 编译无错误
- [ ] 自动登录成功
- [ ] 车辆列表加载
- [ ] 创建车辆成功
- [ ] 创建维护记录成功
- [ ] 图片上传成功
- [ ] 筛选功能正常
- [ ] 详情页数据展示完整

### 数据一致性
- [ ] 创建记录后里程自动更新
- [ ] 删除记录后统计数据更新
- [ ] 跨设备数据同步（同一用户）
- [ ] 多用户数据隔离（不同用户看不到彼此数据）

---

## 🚀 性能测试（可选）

### 响应时间测试

**目标**: API 响应时间 < 500ms

```bash
# 使用 Apache Bench
ab -n 100 -c 10 http://localhost:8000/api/repos \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期结果**:
```
Time per request: 200ms (平均)
Requests per second: 50 (吞吐量)
```

### 并发用户测试

**目标**: 支持 50+ 并发用户

**工具**: Locust 或 JMeter

**场景**:
- 50 个虚拟用户
- 每个用户执行：登录 → 查询车辆 → 创建记录
- 运行 5 分钟

---

## 📝 测试报告模板

```markdown
# 测试报告

**测试日期**: 2026-01-30  
**测试人员**: [姓名]  
**环境**: [开发/测试/生产]

## 测试结果

| 功能模块 | 测试项 | 状态 | 备注 |
|---------|--------|------|------|
| 认证系统 | 微信登录 | ✅ | - |
| 认证系统 | Token 验证 | ✅ | - |
| 图片上传 | 单张上传 | ✅ | - |
| 图片上传 | 多张上传 | ✅ | - |
| PDF 导出 | 生成 PDF | ❌ | 中文字体问题 |

## 发现的问题

1. **问题描述**: PDF 中文乱码
   - **严重程度**: 中
   - **复现步骤**: ...
   - **建议方案**: 注册中文字体

## 总体评价

- 核心功能正常
- 需要优化 PDF 导出
- 建议进行压力测试
```

---

*测试指南版本: v2.1*  
*最后更新: 2026-01-30*

