# AutoRepo 文档导航

欢迎查阅 AutoRepo 项目文档。所有技术文档已按类别整理到此目录。

---

## 📚 文档结构

```
docs/
├── FEATURE_SUMMARY.md                      # 功能总结与规划
│
├── technical/                              # 技术文档
│   ├── commit/                             # Commit（保养记录）相关
│   │   ├── COMMIT_DATA_ANALYSIS.md         # 完整数据结构规范
│   │   ├── COMMIT_QUICK_REFERENCE.md       # 快速参考手册
│   │   └── COMMIT_IMPLEMENTATION_GUIDE.md  # 实现指南与代码示例
│   │
│   ├── visualization/                      # 数据可视化相关
│   │   ├── VISUALIZATION_ANALYSIS.md       # 完整分析报告
│   │   ├── VISUALIZATION_QUICK_REF.md      # 快速参考
│   │   └── VISUALIZATION_CODE_REFERENCE.md # 代码示例
│   │
│   └── search/                             # 搜索与过滤相关
│       └── SEARCH_FILTER_ANALYSIS.md       # 实现指南
│
├── testing/                                # 测试文档
│   ├── 测试清单.md                          # 详细测试清单
│   └── 测试执行指南.md                      # 快速测试指南（15分钟）
│
├── development/                            # 开发文档
│   ├── AGENTS.md                           # AI 辅助开发指南
│   ├── WORK_LOG.md                         # 项目开发日志
│   ├── 工作总结.md                          # 最新会话工作总结
│   └── CLEANUP_REPORT.md                   # 目录清理报告
│
└── plans/                                  # 设计方案（原有）
    └── 2026-01-22-phase3-data-viz-design.md
```

---

## 🎯 快速导航

### 我是新开发者
1. 先读：`../README_ZH.md` - 了解项目
2. 再读：`development/AGENTS.md` - 了解代码规范
3. 然后：`development/工作总结.md` - 了解最新功能
4. 最后：根据要开发的模块查阅相应技术文档

### 我要开发 Commit 相关功能
- **完整规范**：`technical/commit/COMMIT_DATA_ANALYSIS.md`
- **快速查字段**：`technical/commit/COMMIT_QUICK_REFERENCE.md`
- **代码示例**：`technical/commit/COMMIT_IMPLEMENTATION_GUIDE.md`

### 我要开发图表/可视化
- **完整分析**：`technical/visualization/VISUALIZATION_ANALYSIS.md`
- **快速参考**：`technical/visualization/VISUALIZATION_QUICK_REF.md`
- **代码片段**：`technical/visualization/VISUALIZATION_CODE_REFERENCE.md`

### 我要开发搜索/过滤
- **实现指南**：`technical/search/SEARCH_FILTER_ANALYSIS.md`

### 我要测试功能
- **快速测试**：`testing/测试执行指南.md`（15-20分钟）
- **完整测试**：`testing/测试清单.md`（全面验证）

### 我要了解项目历史
- **开发日志**：`development/WORK_LOG.md`
- **最新进展**：`development/工作总结.md`

### 我要规划新功能
- **功能列表**：`FEATURE_SUMMARY.md`（14个未来功能建议）

---

## 📖 文档使用建议

### 开发前
1. 查阅相关技术文档了解现有实现
2. 参考代码示例了解最佳实践
3. 查看 FEATURE_SUMMARY.md 确认功能优先级

### 开发中
- 使用 QUICK_REFERENCE 系列快速查字段
- 参考 CODE_REFERENCE 系列复制代码模式
- 遵循 AGENTS.md 中的代码规范

### 开发后
1. 执行 `测试执行指南.md` 快速验证
2. 使用 `测试清单.md` 完整测试
3. 更新相关文档（如有新功能）

---

## 🔄 文档维护

### 何时更新文档

| 场景 | 更新文档 |
|------|---------|
| 添加新字段 | `technical/commit/COMMIT_DATA_ANALYSIS.md` |
| 新增图表类型 | `technical/visualization/VISUALIZATION_ANALYSIS.md` |
| 修改搜索逻辑 | `technical/search/SEARCH_FILTER_ANALYSIS.md` |
| 完成新功能 | `development/WORK_LOG.md` |
| 重大变更 | 所有相关文档 + `development/工作总结.md` |

### 文档规范
- 使用中文编写（技术术语可保留英文）
- 代码示例使用 markdown 代码块
- 保持目录结构（使用 `## ` 和 `### `）
- 添加日期和版本信息

---

## 📞 获取帮助

- **项目问题**：查看 `development/WORK_LOG.md` 了解已知问题
- **代码规范**：参考 `development/AGENTS.md`
- **功能请求**：查看 `FEATURE_SUMMARY.md` 中的规划

---

**文档版本**: 2026-01-27  
**文档总数**: 15 个  
**最后更新**: 目录重组整理
