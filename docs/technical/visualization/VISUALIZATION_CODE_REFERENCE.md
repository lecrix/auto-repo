# AutoRepo Visualization - Code Snippets Reference

## Current Implementation Details

### Frontend Component: insights-view/index.ts

**Current API Integration** (lines 1-2):
```typescript
import { getRepoStats, getIssues } from '../../services/api'
```

**Data Loading** (lines 31-51):
```typescript
async loadData(id: string) {
    if (!id) return

    this.setData({ loading: true })
    try {
        const [stats, issues] = await Promise.all([
            getRepoStats(id),
            getIssues(id, 'open')
        ])
        this.setData({ stats, issues })
    } catch (e) {
        console.error('Failed to load insights data', e)
        try {
            const stats = await getRepoStats(id)
            this.setData({ stats })
        } catch (ex) { }
    } finally {
        this.setData({ loading: false })
    }
}
```

**Component Properties:**
```typescript
properties: {
    repoId: {
        type: String,
        value: '',
        observer(newVal) {
            if (newVal) {
                this.loadData(newVal)
            }
        }
    }
}
```

**Data Object:**
```typescript
data: {
    stats: null as any,        // Holds response from /stats API
    issues: [] as any[],       // Open issues
    loading: false
}
```

---

### Template: insights-view/index.wxml

**Metrics Cards Section** (lines 4-17):
```wxml
<view class="metrics-grid">
    <view class="metric-card main">
        <view class="label">总花费</view>
        <view class="value currency">¥{{stats.total_cost || 0}}</view>
    </view>
    <view class="metric-card">
        <view class="label">总里程</view>
        <view class="value">{{stats.total_mileage || 0}}<text class="unit">km</text></view>
    </view>
    <view class="metric-card">
        <view class="label">每公里成本</view>
        <view class="value">¥{{stats.cost_per_km || 0}}</view>
    </view>
</view>
```

**Chart Section** (lines 20-38):
```wxml
<view class="chart-section">
    <view class="section-title">费用构成</view>
    <view class="chart-container">
        <!-- TODO: Integrate uCharts here later -->
        <view class="simple-chart" wx:if="{{stats.composition && stats.composition.length > 0}}">
           <view class="chart-row" wx:for="{{stats.composition}}" wx:key="name">
              <view class="row-label">{{item.name}}</view>
              <view class="row-bar-area">
                  <view class="row-bar" style="width: {{item.value / stats.total_cost * 100}}%"></view>
              </view>
              <view class="row-val">¥{{item.value}}</view>
           </view>
        </view>
        <view class="empty-state" wx:else>
            暂无数据
        </view>
    </view>
</view>
```

**Issues List Section** (lines 44-65):
```wxml
<view class="issue-list" wx:if="{{issues && issues.length > 0}}">
    <view class="issue-item" wx:for="{{issues}}" wx:key="_id">
        <view class="issue-left">
            <view class="issue-status {{item.priority}}"></view>
        </view>
        <view class="issue-content">
            <view class="issue-title">{{item.title}}</view>
            <view class="issue-meta">
                <text wx:if="{{item.due_mileage}}">目标里程: {{item.due_mileage}} km</text>
                <text wx:if="{{item.due_date}}">截止日期: {{item.due_date}}</text>
            </view>
        </view>
        <view class="issue-action">
            <text class="btn-check" bindtap="onCompleteIssue" data-issue="{{item}}">✓</text>
        </view>
    </view>
</view>
```

---

### Styles: insights-view/index.scss

**Metrics Grid** (lines 6-55):
```scss
.metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;
}

.metric-card {
    background: white;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.metric-card.main {
    background: #2c3e50;
}

.metric-card.main .label {
    color: rgba(255, 255, 255, 0.7);
}

.metric-card.main .value {
    color: white;
}

.label {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 4px;
}

.value {
    font-size: 18px;
    font-weight: 700;
    color: #333;
}
```

**Bar Chart Styles** (lines 76-116):
```scss
.simple-chart {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.chart-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.row-label {
    width: 100px;
    font-size: 13px;
    color: #666;
    text-align: right;
}

.row-bar-area {
    flex: 1;
    height: 8px;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
}

.row-bar {
    height: 100%;
    background: #3498db;
    border-radius: 4px;
}

.row-val {
    width: 60px;
    font-size: 13px;
    font-weight: 600;
    color: #333;
    text-align: right;
}
```

**Priority Indicators** (lines 152-170):
```scss
.issue-status {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #ccc;

    &.high {
        background: #e74c3c;
        box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);
    }

    &.medium {
        background: #f39c12;
    }

    &.low {
        background: #2ecc71;
    }
}
```

---

### Backend: routes.py

**Stats Endpoint Declaration** (lines 213-214):
```python
@router.get("/repos/{repo_id}/stats")
async def get_repo_stats(repo_id: str):
```

**Fetch Repo & Mileage** (lines 217-222):
```python
# 1. Basic Repo Info
repo = await db.repos.find_one({"_id": ObjectId(repo_id)})
if not repo:
    raise HTTPException(status_code=404, detail="Repo not found")
    
current_mileage = repo.get("current_mileage", 0)
```

**Total Cost Aggregation** (lines 224-245):
```python
# 2. Aggregations
pipeline = [
    {"$match": {"repo_id": repo_id}},
    {"$group": {
        "_id": None,
        "total_parts": {"$sum": "$cost.parts"},
        "total_labor": {"$sum": "$cost.labor"},
        "count": {"$sum": 1}
    }}
]

stats_result = await db.commits.aggregate(pipeline).to_list(length=1)

total_cost = 0
total_parts = 0
total_labor = 0

if stats_result:
    res = stats_result[0]
    total_parts = res.get("total_parts", 0)
    total_labor = res.get("total_labor", 0)
    total_cost = total_parts + total_labor
```

**Cost Composition Pipeline** (lines 248-258):
```python
# 3. Cost Composition (for Pie Chart)
composition_pipeline = [
    {"$match": {"repo_id": repo_id}},
    {"$group": {
        "_id": "$type",     # Group by commit type
        "value": {"$sum": {"$add": ["$cost.parts", "$cost.labor"]}}
    }}
]
composition = await db.commits.aggregate(composition_pipeline).to_list(length=10)

# Format for charts: [{"name": "Maintenance", "value": 1200}, ...]
chart_data = [{"name": item["_id"], "value": item["value"]} for item in composition]
```

**Response Format** (lines 260-265):
```python
return {
    "total_cost": total_cost,
    "total_mileage": current_mileage,
    "cost_per_km": round(total_cost / current_mileage, 2) if current_mileage > 0 else 0,
    "composition": chart_data
}
```

---

### Services: api.ts

**Stats API Wrapper** (lines 71-73):
```typescript
export const getRepoStats = (repoId: string) => {
    return request(`/repos/${repoId}/stats`, 'GET');
};
```

**Request Function** (lines 5-34):
```typescript
const request = (url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any) => {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${BASE_URL}${url}`,
            method,
            data,
            header: {
                'content-type': 'application/json'
            },
            success: (res: any) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(res.data);
                } else {
                    const detail = res.data && res.data.detail;
                    let errorMsg = '请求失败';
                    if (typeof detail === 'string') {
                        errorMsg = detail;
                    }
                    reject(new Error(errorMsg));
                }
            },
            fail: (err) => {
                console.error('API Error:', err);
                reject(new Error('网络错误'));
            }
        });
    });
};
```

---

### Models: models.py

**Cost Model** (lines 5-8):
```python
class Cost(BaseModel):
    parts: float = 0
    labor: float = 0
    currency: str = "CNY"
```

**Commit Model** (lines 28-37):
```python
class Commit(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    repo_id: str
    title: str
    message: Optional[str] = None
    mileage: int
    type: str
    cost: Optional[Cost] = None
    closes_issues: list[str] = []
    timestamp: float = Field(default_factory=lambda: datetime.now().timestamp() * 1000)
```

**Repo Model - Relevant Fields** (lines 39-51):
```python
class Repo(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    name: str
    current_mileage: int = 0
    current_head: Optional[str] = None
    created_at: float = Field(default_factory=lambda: datetime.now().timestamp() * 1000)
```

---

## Key Calculation Methods

### Frontend: Calculate Bar Width
```typescript
// From index.wxml, line 29
width: {{item.value / stats.total_cost * 100}}%
```

This displays each composition item as a percentage of total cost.

### Frontend: Format Timestamp
```typescript
// From repo-detail/index.ts, line 92
date: formatTime(new Date(c.timestamp))
```

Converts millisecond timestamp to readable date string.

### Backend: Calculate Cost Per KM
```python
# From routes.py, line 263
"cost_per_km": round(total_cost / current_mileage, 2) if current_mileage > 0 else 0
```

Prevents division by zero, rounds to 2 decimal places.

---

## Integration Points

### How insights-view is Integrated

**In repo-detail page** (repo-detail/index.wxml, line 115):
```wxml
<insights-view repoId="{{repoId}}"></insights-view>
```

**With tabbed interface** (lines 62-68):
```wxml
<view class="tab-bar">
    <view class="tab-item {{currentTab === 0 ? 'active' : ''}}" bindtap="switchTab" data-index="{{0}}">
        <text>时间线</text>
    </view>
    <view class="tab-item {{currentTab === 1 ? 'active' : ''}}" bindtap="switchTab" data-index="{{1}}">
        <text>数据统计</text>
    </view>
</view>
```

Only shows when `currentTab === 1` (Data Stats tab).

---

## Base URL Configuration

**Current**: `http://localhost:8001/api` (services/api.ts, line 3)

⚠️ **Note**: Backend runs on port 8000 by default. This might need adjustment:
```typescript
const BASE_URL = 'http://localhost:8000/api';  // Likely correct
```

