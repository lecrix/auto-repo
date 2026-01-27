# AutoRepo Visualization Quick Reference

## Current Implementation Status

### ✅ What's Implemented
1. **Metrics Cards** - 3 KPI displays (total cost, mileage, cost/km)
2. **Simple Bar Chart** - Horizontal bars for cost composition by type
3. **Issues List** - Color-coded priority indicators
4. **No external chart library** - Pure CSS + SCSS

### ⚠️ What's Missing
- [ ] Pie/Donut chart for cost composition
- [ ] Mileage trend line chart
- [ ] Cost trend over time
- [ ] Advanced aggregations on backend
- [ ] Chart library integration

---

## Backend API Response Example

```json
GET /repos/{repo_id}/stats

{
  "total_cost": 5200.50,
  "total_mileage": 125000,
  "cost_per_km": 0.042,
  "composition": [
    { "name": "Maintenance", "value": 2100.00 },
    { "name": "Modification", "value": 1800.50 },
    { "name": "Repair", "value": 1300.00 }
  ]
}
```

---

## Data Flow

```
Page: repo-detail (Tab: "数据统计")
  ↓
Component: insights-view
  ↓
Services: getRepoStats() + getIssues()
  ↓
Backend API: GET /repos/{repo_id}/stats
  ↓
MongoDB: Aggregation pipeline
  ├─ Match: repo_id
  ├─ Group: by type + sum costs
  └─ Return: composition array
```

---

## Color Palette

| Use Case | Color | Hex | CSS Var |
|----------|-------|-----|---------|
| Primary | Midnight Blue | #2c3e50 | --primary-color |
| Accent | Bright Blue | #3498db | --accent-color |
| Success/Low | Green | #27ae60 | --success-color |
| High Priority | Red | #e74c3c | Custom |
| Medium Priority | Orange | #f39c12 | Custom |
| Background | Light Gray | #f8f9fa | --bg-color |

---

## Chart Data Structure Format

### Composition (Current)
```typescript
composition: [
  { name: "Maintenance", value: 2100 },
  { name: "Modification", value: 1800 }
]
```

### Mileage History (Proposed)
```typescript
mileageHistory: [
  { date: "2025-01-15", mileage: 120000 },
  { date: "2025-01-20", mileage: 120500 }
]
```

### Cost Trend (Proposed)
```typescript
costTrend: [
  { month: "2025-01", total: 1200 },
  { month: "2025-02", total: 1500 }
]
```

---

## File Locations

| Component | Path | Lines |
|-----------|------|-------|
| Logic | `miniprogram/components/insights-view/index.ts` | 70 |
| Template | `miniprogram/components/insights-view/index.wxml` | 69 |
| Styles | `miniprogram/components/insights-view/index.scss` | 199 |
| Backend | `backend/routes.py` (lines 213-266) | 54 |

---

## Chart Types to Implement (Priority Order)

1. **Pie Chart** (Cost Composition) - EASY
2. **Line Chart** (Mileage Trend) - MEDIUM
3. **Area/Bar Chart** (Monthly Costs) - MEDIUM
4. **Scatter Plot** (Cost vs Mileage) - HARD

---

## Key Data Points Available

| Field | Source | Type | Example |
|-------|--------|------|---------|
| `mileage` | Commit | int | 125000 |
| `timestamp` | Commit | float (ms) | 1705881600000 |
| `type` | Commit | str | "Maintenance" |
| `cost.parts` | Commit.cost | float | 500.50 |
| `cost.labor` | Commit.cost | float | 300.00 |
| `current_mileage` | Repo | int | 125000 |
| `created_at` | Repo | float (ms) | 1703001600000 |

---

## Next Steps

1. **Choose Chart Library**: uCharts (WeChat native) recommended
2. **Backend Enhancement**: Add `/mileage-history` and `/cost-trend` endpoints
3. **Frontend Integration**: Replace bar chart with pie chart, add new chart components
4. **Testing**: Verify on WeChat DevTools simulator (375px width)
5. **Performance**: Monitor API response times, add caching if needed

