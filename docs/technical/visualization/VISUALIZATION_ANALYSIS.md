# AutoRepo Data Visualization Analysis Report

**Generated**: 2026-01-27  
**Scope**: Frontend insights-view component + Backend stats API  
**Project**: AutoRepo (WeChat Mini Program + FastAPI)

---

## 1. CURRENT VISUALIZATION APPROACH

### 1.1 Component Location
- **Frontend**: `miniprogram/components/insights-view/` (4 files)
  - `index.ts` - Component logic (70 lines)
  - `index.wxml` - Template (69 lines)
  - `index.scss` - Styles (199 lines)
  - `index.json` - Config (4 lines)

- **Backend**: `backend/routes.py` - Stats endpoint (lines 213-266)

### 1.2 Current Visualization Types

#### ✅ **Implemented:**
1. **Key Metrics Cards** (3-column grid)
   - Total cost (¥)
   - Total mileage (km)
   - Cost per km (¥/km)
   - Implementation: Simple text display with no charts

2. **Cost Composition Bar Chart** (Simple horizontal bars)
   - Shows breakdown by expense type (Maintenance, Modification, Repair)
   - Manual percentage calculation: `item.value / stats.total_cost * 100`
   - Data aggregated from commits by `type` field
   - Implementation: CSS flex bars, no chart library

3. **Issues List** (Task/reminder display)
   - Priority indicators (colored dots: high=red, medium=orange, low=green)
   - Status display with due_mileage and due_date
   - Not a chart, but data visualization element

### 1.3 Chart Rendering Approach

**Current Method**: **Pure HTML/CSS (No Chart Library)**
- No external chart libraries (uCharts, Echarts, etc.)
- Comment in WXML: `<!-- TODO: Integrate uCharts here later -->`
- Implementation uses CSS flexbox for bar visualization
- Color-coded by metric type (not by data source)

**Stack:**
- Frontend: CSS3 + SCSS + WeChat WXML
- Backend: Python MongoDB aggregation pipeline
- No Canvas API used
- No SVG charts
- No third-party charting library

---

## 2. BACKEND STATS API STRUCTURE

### 2.1 Endpoint
```
GET /repos/{repo_id}/stats
```

### 2.2 Request Parameters
- `repo_id` (string, path param) - Vehicle ID (MongoDB ObjectId as string)

### 2.3 Response Schema

```json
{
  "total_cost": 5200.50,           // Sum of all (parts + labor) costs
  "total_mileage": 125000,         // Current vehicle mileage
  "cost_per_km": 0.042,            // Calculated: total_cost / total_mileage
  "composition": [
    {
      "name": "Maintenance",       // Commit type
      "value": 2100.00             // Sum of costs for this type
    },
    {
      "name": "Modification",
      "value": 1800.50
    },
    {
      "name": "Repair",
      "value": 1300.00
    }
  ]
}
```

### 2.4 Backend Data Aggregation Pipeline

**Total Cost & Count** (lines 225-235):
```python
pipeline = [
    {"$match": {"repo_id": repo_id}},
    {"$group": {
        "_id": None,
        "total_parts": {"$sum": "$cost.parts"},
        "total_labor": {"$sum": "$cost.labor"},
        "count": {"$sum": 1}
    }}
]
```

**Cost Composition** (lines 249-258):
```python
composition_pipeline = [
    {"$match": {"repo_id": repo_id}},
    {"$group": {
        "_id": "$type",  # Group by commit type
        "value": {"$sum": {"$add": ["$cost.parts", "$cost.labor"]}}
    }}
]
# Format: [{"name": "Maintenance", "value": 1200}, ...]
```

### 2.5 Available Data for Future Charts

From `Commit` model:
- `mileage` (int) - Maintenance record mileage
- `timestamp` (float ms) - When maintenance occurred
- `type` (str) - "Maintenance", "Modification", "Repair"
- `cost.parts` (float) - Parts cost
- `cost.labor` (float) - Labor cost
- `title` (str) - Description

From `Repo` model:
- `current_mileage` (int)
- `created_at` (float ms)
- `register_date` (float ms)

### 2.6 MongoDB Query Capabilities

✅ **Current**:
- Aggregation pipeline working (grouping, sum operations)
- Sorting by timestamp
- Filtering by repo_id and commit type

⚠️ **Potential Issues**:
- No pagination in stats endpoint
- No date range filtering
- No mileage range filtering

---

## 3. CURRENT COLOR SCHEME & STYLING

### 3.1 Design System (from `app.scss`)

**Primary Palette:**
```scss
--primary-color: #2c3e50;    // Midnight Blue
--accent-color: #3498db;     // Bright Blue
--success-color: #27ae60;    // Green
--bg-color: #f8f9fa;         // Light Gray
--card-bg: #ffffff;          // White
```

**Text Colors:**
```scss
--text-main: #2c3e50;        // Dark blue-gray
--text-secondary: #7f8c8d;   // Medium gray
--text-light: #bdc3c7;       // Light gray
```

**Shadows (Glassmorphism):**
```scss
--shadow-sm: 0 2px 4px rgba(0,0,0,0.05);
--shadow-md: 0 4px 12px rgba(44, 62, 80, 0.08);
--shadow-lg: 0 8px 24px rgba(44, 62, 80, 0.12);
--shadow-glow: 0 0 16px rgba(52, 152, 219, 0.4);
```

**Spacing Scale:**
```scss
--spacing-xs: 8rpx   // 8px equivalent
--spacing-sm: 16rpx  // 16px equivalent
--spacing-md: 32rpx  // 32px equivalent
--spacing-lg: 48rpx  // 48px equivalent
--spacing-xl: 64rpx  // 64px equivalent
```

### 3.2 Insights-View Component Colors

**Metric Cards:**
- Main card (Total Cost): `#2c3e50` (dark blue-gray) with white text
- Secondary cards: `#ffffff` with `#333` text
- Box shadow: `0 2px 8px rgba(0, 0, 0, 0.05)`

**Bar Chart:**
- Bar fill: `#3498db` (bright blue)
- Background: `#f0f0f0` (light gray)
- Text: `#333`, `#666`, `#999`

**Issue Priority Indicators:**
- High: `#e74c3c` (red) with glow effect
- Medium: `#f39c12` (orange)
- Low: `#2ecc71` (green)

**Container Background:**
- `#f8f9fa` (light gray)

**Card Styling:**
- `16px` border-radius
- `0 4px 12px rgba(0, 0, 0, 0.03)` shadow
- White background with 20px padding

---

## 4. AVAILABLE CHART TYPES FOR IMPLEMENTATION

### 4.1 Line Chart (Mileage Trend)
**Data Source**: Group commits by timestamp, show cumulative mileage over time
```
X-axis: Date/Time
Y-axis: Cumulative Mileage (km)
Purpose: Visualize vehicle usage patterns
```

**Backend Implementation Needed:**
```python
# Aggregate commits with mileage over time
pipeline = [
    {"$match": {"repo_id": repo_id}},
    {"$sort": {"timestamp": 1}},
    {"$group": {
        "_id": None,
        "records": {
            "$push": {
                "date": {"$dateToString": {"format": "%Y-%m-%d", "date": {"$toDate": "$timestamp"}}},
                "mileage": "$mileage",
                "timestamp": "$timestamp"
            }
        }
    }}
]
```

### 4.2 Cost Trend Line Chart
**Data Source**: Group commits by month, show cumulative/monthly costs
```
X-axis: Month/Date
Y-axis: Cost (¥)
Purpose: Visualize spending patterns over time
```

**Backend Implementation Needed:**
```python
pipeline = [
    {"$match": {"repo_id": repo_id}},
    {"$group": {
        "_id": {"$dateToString": {"format": "%Y-%m", "date": {"$toDate": "$timestamp"}}},
        "monthly_cost": {"$sum": {"$add": ["$cost.parts", "$cost.labor"]}}
    }},
    {"$sort": {"_id": 1}}
]
```

### 4.3 Cost Type Pie Chart
**Current**: Horizontal bar chart  
**Better Option**: Pie/Donut chart using canvas or SVG
```
Slices: Maintenance, Modification, Repair
Colors: Can use theme colors
Purpose: Quick visual proportion assessment
```

### 4.4 Mileage Distribution Histogram
**Data Source**: Show maintenance records by mileage intervals
```
X-axis: Mileage Range (e.g., 0-10k, 10k-20k, etc.)
Y-axis: Count of records
Purpose: Identify high-maintenance intervals
```

### 4.5 Cost vs. Mileage Scatter Plot
**Data Source**: Each commit as a point
```
X-axis: Mileage
Y-axis: Cost (single commit)
Purpose: Find expensive maintenance points
```

---

## 5. CHART LIBRARY OPTIONS FOR WEIXIN MINI PROGRAM

### 5.1 Native Options (No External Library)
- **Canvas API** (built-in WeChat capability)
- **SVG** (WXML support)
- **CSS3** (current approach)

### 5.2 Recommended Third-Party Libraries

| Library | Pros | Cons | Best For |
|---------|------|------|----------|
| **uCharts** | WeChat optimized, multiple chart types | Paid version for advanced features | Line, Pie, Bar |
| **Echarts** | Powerful, flexible, free | Larger bundle size | Complex dashboards |
| **Chart.js** | Lightweight, clean API | Not WeChat native | Simple line/bar |
| **F2** (Ant Design) | Mobile-friendly, responsive | Chinese docs focus | Mobile charts |

### 5.3 Current Project Status
- **No chart library installed**
- **Comment in WXML**: `<!-- TODO: Integrate uCharts here later -->`
- **Recommendation**: Start with uCharts (WeChat optimized) or custom Canvas implementation

---

## 6. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│           WeChat Mini Program Frontend                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  repo-detail page (shows insights-view tab)            │
│         │                                               │
│         ├─> insights-view component                    │
│             ├─> loadData()                            │
│             │   ├─> getRepoStats(repoId)  ──────┐    │
│             │   └─> getIssues(repoId)           │    │
│             │                                   │    │
│             ├─> Render:                         │    │
│             │   ├─ Metrics Cards (¥, km, ¥/km) │    │
│             │   ├─ Bar Chart (composition)      │    │
│             │   └─ Issues List                  │    │
│             │                                   │    │
└─────────────────────────────────────────────────────────┘
                                                         │
                         API calls (services/api.ts)    │
                                                         │
        ┌────────────────────────────────────────────────┘
        │
        │  GET /repos/{repo_id}/stats
        │  GET /repos/{repo_id}/issues?status=open
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  /repos/{repo_id}/stats endpoint (routes.py:213)      │
│      │                                                 │
│      ├─> db.repos.find_one(repo_id)                  │
│      │   → get current_mileage                        │
│      │                                                 │
│      ├─> Aggregation Pipeline #1: Total Cost         │
│      │   $match → $group → sum(parts + labor)        │
│      │   → total_cost, total_labor, total_parts      │
│      │                                                 │
│      └─> Aggregation Pipeline #2: Cost Composition   │
│          $match → $group by type → sum(parts+labor)  │
│          → composition: [{name, value}, ...]         │
│                                                         │
│  Response JSON:                                        │
│  {                                                     │
│    "total_cost": 5200,                               │
│    "total_mileage": 125000,                          │
│    "cost_per_km": 0.042,                             │
│    "composition": [{name, value}, ...]               │
│  }                                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
                    MongoDB
            (commits, repos collections)
```

---

## 7. RECOMMENDATIONS FOR NEW VISUALIZATIONS

### 7.1 Mileage Trend Line Chart

**What to Build:**
A line chart showing cumulative vehicle mileage over time, with peaks indicating usage intensity.

**Frontend Changes:**
```typescript
// insights-view/index.ts - Add to loadData()
const mileageHistory = await getRepoMileageHistory(id)
this.setData({ mileageHistory })

// Render with canvas or uCharts
<canvas id="mileage-chart"></canvas>
```

**Backend Changes** (new endpoint):
```python
@router.get("/repos/{repo_id}/mileage-history")
async def get_mileage_history(repo_id: str):
    # Return sorted commits with timestamp and mileage
    return [
        {"date": "2025-01-15", "mileage": 120000, "timestamp": 1705276800000},
        {"date": "2025-01-20", "mileage": 120500, "timestamp": 1705881600000},
        ...
    ]
```

**Data Requirements:**
- Commit timestamp
- Commit mileage
- Optional: Commit type (color code)

### 7.2 Monthly Cost Trend Line Chart

**What to Build:**
A line/bar chart showing spending patterns by month, identifying expensive periods.

**Backend Implementation:**
```python
@router.get("/repos/{repo_id}/cost-trend")
async def get_cost_trend(repo_id: str):
    pipeline = [
        {"$match": {"repo_id": repo_id}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m", "date": {"$toDate": "$timestamp"}}},
            "total": {"$sum": {"$add": ["$cost.parts", "$cost.labor"]}}
        }},
        {"$sort": {"_id": 1}}
    ]
    # Returns: [{"month": "2025-01", "cost": 1200}, ...]
```

### 7.3 Pie Chart for Cost Composition

**Replace Current Bar Chart:**
A pie/donut chart is more intuitive for showing proportions. Can use:
- Canvas + custom drawing
- uCharts (simplest)
- SVG

**Color Scheme:**
```
Maintenance: #3498db (Primary Blue)
Modification: #e74c3c (Red)
Repair: #f39c12 (Orange)
```

### 7.4 Dashboard Summary Enhancements

Current metrics are basic. Consider adding:
- **Maintenance Frequency**: Records per 10k km
- **Average Cost per Record**: total_cost / count
- **Most Common Type**: The maintenance type with highest count
- **Cost Efficiency**: Cost growth rate vs. mileage growth

---

## 8. IMPLEMENTATION PRIORITY

### Phase 1 (Highest Priority)
- ✅ **Fix pie chart**: Replace bar chart with proper pie/donut visualization
  - Reason: Better UX for composition data
  - Effort: Medium (if using uCharts)
  - Impact: High (immediate visual improvement)

### Phase 2 (Medium Priority)
- ⭐ **Add mileage trend line**: Show usage patterns
  - Reason: Useful for maintenance planning
  - Effort: Medium (new backend endpoint + frontend chart)
  - Impact: High (actionable insights)

- ⭐ **Add cost trend**: Monthly spending visualization
  - Reason: Financial planning feature
  - Effort: Medium
  - Impact: High

### Phase 3 (Lower Priority)
- 📊 **Advanced analytics**: Scatter plot, histogram, averages
- 📈 **Comparative analysis**: Year-over-year, cost projections
- 🔔 **Predictive alerts**: Estimate next expensive maintenance

---

## 9. TECHNICAL NOTES

### 9.1 Performance Considerations
- **Current**: Single API call for composition data (good)
- **Future**: May need caching if adding multiple trend endpoints
- **Recommendation**: Implement endpoint-level cache (Redis) for stats that don't change frequently

### 9.2 Data Type Conversions
- Backend: Timestamps in milliseconds (JavaScript compatible)
- MongoDB: Use `$dateToString` with `$toDate` conversion
- Frontend: `new Date(timestamp)` works directly

### 9.3 Responsive Design
- Current metrics use 3-column grid (works on mobile)
- Charts need mobile-friendly rendering
- Recommendation: Test on 375px width (WeChat default)

### 9.4 Browser/WeChat Compatibility
- WeChat uses Tencent's Blink engine (Chrome-based)
- Canvas API fully supported
- SVG supported
- CSS Grid supported
- No vendor prefixes needed for recent features

---

## 10. CODE REFERENCES

### Frontend Services
**File**: `miniprogram/services/api.ts`
```typescript
export const getRepoStats = (repoId: string) => {
    return request(`/repos/${repoId}/stats`, 'GET');
};
```

### Backend Endpoint
**File**: `backend/routes.py` (lines 213-266)
```python
@router.get("/repos/{repo_id}/stats")
async def get_repo_stats(repo_id: str):
    # Implementation details above
```

### Component
**File**: `miniprogram/components/insights-view/`
- Loading logic: `index.ts` (lines 31-51)
- Template: `index.wxml` (lines 19-38 for chart section)
- Styles: `index.scss` (lines 76-116 for chart styling)

---

## Summary Table

| Aspect | Current State | Limitation | Recommendation |
|--------|---------------|-----------|-----------------|
| **Chart Library** | None (CSS only) | Limited visualization types | Integrate uCharts |
| **Rendering** | CSS + WXML | No advanced effects | Use Canvas API |
| **Data Available** | Composition only | No trend data | Add time-series endpoints |
| **API Endpoints** | 1 (`/stats`) | Single aggregation | Create `/mileage-history`, `/cost-trend` |
| **Color System** | Well-defined CSS vars | Consistent but limited | Expand with data-driven colors |
| **Mobile Ready** | Partial (metrics responsive) | Charts not optimized | Test and adjust chart rendering |
| **Performance** | Good (single API call) | No caching | Add Redis caching for expensive queries |

---

**End of Analysis Report**

