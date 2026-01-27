# AutoRepo Search & Filter Implementation Guide

**Analysis Date**: January 27, 2026  
**Analyzed By**: Frontend Architecture Review  
**Status**: Ready for Implementation

---

## 📋 Executive Summary

AutoRepo has established patterns for data fetching, state management, and UI components. The codebase **currently lacks search/filtering logic**, but has a solid foundation to build upon. This document provides:

1. **Current data fetching patterns**
2. **Existing filtering capabilities in the backend**
3. **Reusable component patterns**
4. **Recommendations for search/filter implementation**

---

## 🔍 Files Analyzed

### Frontend (miniprogram)
- ✅ `services/api.ts` - API request layer
- ✅ `pages/repo-list/index.ts` - Vehicle list data loading
- ✅ `pages/repo-list/index.wxml` - Vehicle list rendering
- ✅ `pages/repo-detail/index.ts` - Detail page with tabs
- ✅ `pages/repo-detail/index.wxml` - Timeline + insights rendering
- ✅ `pages/commit-create/index.ts` - Form with picker input
- ✅ `pages/commit-create/index.wxml` - Form UI patterns
- ✅ `components/empty-state/index.ts` - Reusable empty state
- ✅ `components/custom-nav/index.ts` - Navigation component
- ✅ `components/dashboard-widget/index.ts` - Data fetching in component
- ✅ `utils/util.ts` - Utility functions
- ✅ `app.scss` - Design system (CSS variables)
- ✅ `pages/repo-list/index.scss` - Styling patterns

### Backend (Python)
- ✅ `backend/models.py` - Data structure definitions
- ✅ `backend/routes.py` - API endpoints (partial)

---

## 1️⃣ Current Data Fetching Patterns

### **Pattern A: Page-level Data Loading** (Used in repo-list, repo-detail)

```typescript
// pages/repo-list/index.ts
async onShow() {
  this.setData({ loading: true })
  await this.loadRepos()
}

async loadRepos() {
  try {
    const repos = await getRepos() // API call
    const formattedRepos = (repos as any[]).map(r => ({
      ...r,
      vehicle_age: calcVehicleAge(r.register_date),
      offsetX: 0 // For swipe actions
    }))
    this.setData({ repos: formattedRepos, loading: false })
  } catch (e) {
    this.setData({ loading: false })
  }
}
```

**Key Characteristics:**
- ✅ Uses `setData()` for reactive updates
- ✅ Loading state management (`loading: true/false`)
- ✅ Error handling with `try-catch`
- ✅ Data transformation/formatting happens client-side
- ✅ Called on `onShow()` (page becomes visible)

### **Pattern B: Component-level Data Loading** (Used in dashboard-widget)

```typescript
// components/dashboard-widget/index.ts
properties: {
  repoId: {
    type: String,
    observer(newVal) {
      if (newVal) this.loadIssues(newVal)
    }
  }
}

async loadIssues(id: string) {
  this.setData({ loading: true })
  try {
    const issues = await getIssues(id, 'open') // API call with filter
    if (issues?.length > 0) {
      this.setData({ topIssue: issues[0] })
    }
  } catch (e) {
    console.error(e)
  } finally {
    this.setData({ loading: false })
  }
}
```

**Key Characteristics:**
- ✅ Uses property observers to trigger data loads
- ✅ API calls happen automatically when prop changes
- ✅ Filtering done at API level (e.g., `status='open'`)
- ✅ Component manages its own state

### **Pattern C: API Request Layer** (services/api.ts)

```typescript
const request = (url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(errorMsg))
        }
      },
      fail: (err) => reject(new Error('网络错误'))
    })
  })
}

// Helper functions
export const getRepos = () => request('/repos', 'GET')
export const getCommits = (repoId: string) => request(`/commits?repo_id=${repoId}`, 'GET')
export const getIssues = (repoId: string, status?: string) => {
  let url = `/repos/${repoId}/issues`
  if (status) url += `?status=${status}`
  return request(url, 'GET')
}
```

**Key Characteristics:**
- ✅ Centralized request handler
- ✅ Query parameters built into API helpers
- ✅ Already supports filtering (e.g., `status` parameter)
- ✅ Error messages extracted from response

---

## 2️⃣ Existing Filtering Logic

### **Backend Filtering** (routes.py)

The backend **already supports filtering at the query level**:

```python
# Line 89-98: Commits are sorted by timestamp
@router.get("/commits", response_model=List[Commit])
async def get_commits(repo_id: str):
    cursor = db.commits.find({"repo_id": repo_id}).sort("timestamp", -1)
    # Returns newest first
```

```python
# Line 75-81: Issues support status filtering
@router.get("/repos/{repo_id}/issues")
async def get_issues(repoId: str, status?: str):
    # Already supports optional status parameter
    if status:
        url += `?status=${status}`
```

**Available Fields for Filtering:**
- Commits: `repo_id`, `type` (maintenance/repair/modification), `timestamp`
- Issues: `repo_id`, `status` (open/closed), `priority` (high/medium/low), `labels`
- Repos: `name`, `register_date`, `created_at`

### **Frontend Filtering** (None Currently)

There is **no client-side filtering logic** in the current codebase. All data is displayed as-is after fetching.

---

## 3️⃣ Component Patterns for Input Fields & Dropdowns

### **Pattern A: Form Input** (commit-create)

```typescript
// TypeScript: Form field management
data: {
  title: '',
  mileage: '',
  cost_parts: '',
  cost_labor: '',
  type: 'maintenance',
  typeKeys: ['maintenance', 'repair', 'modification'],
  typeLabels: ['常规保养', '故障维修', '改装升级'],
  typeIndex: 0
}

onInput(e: any) {
  const field = e.currentTarget.dataset.field
  this.setData({ [field]: e.detail.value })
}

onTypeChange(e: any) {
  this.setData({
    typeIndex: e.detail.value,
    type: this.data.typeKeys[e.detail.value]
  })
}
```

```wxml
<!-- WXML: Input markup -->
<view class="form-group">
  <view class="label">标题</view>
  <input 
    class="input" 
    placeholder="简短描述 (如: 更换机油)" 
    data-field="title" 
    bindinput="onInput" 
  />
</view>

<view class="form-group">
  <view class="label">类型</view>
  <picker bindchange="onTypeChange" value="{{typeIndex}}" range="{{typeLabels}}">
    <view class="picker">
      {{typeLabels[typeIndex]}}
    </view>
  </picker>
</view>
```

**Key Patterns:**
- ✅ `data-field` attribute for dynamic binding
- ✅ Picker component for select dropdowns
- ✅ Parallel `Keys` and `Labels` arrays for display vs. value
- ✅ Real-time state updates with `setData()`

### **Pattern B: State-Driven Rendering** (repo-detail)

```wxml
<!-- Conditional rendering based on tab state -->
<view class="tab-bar">
  <view class="tab-item {{currentTab === 0 ? 'active' : ''}}" bindtap="switchTab" data-index="{{0}}">
    <text>时间线</text>
  </view>
  <view class="tab-item {{currentTab === 1 ? 'active' : ''}}" bindtap="switchTab" data-index="{{1}}">
    <text>数据统计</text>
  </view>
</view>

<!-- Tab 1: Timeline -->
<view class="tab-content" wx:if="{{currentTab === 0}}">
  <!-- Content here -->
</view>

<!-- Tab 2: Insights -->
<view class="tab-content" wx:if="{{currentTab === 1}}">
  <!-- Content here -->
</view>
```

### **Pattern C: List Rendering with Conditional Content** (repo-list)

```wxml
<!-- Loading -->
<block wx:if="{{loading}}">
  <skeleton-loader type="card" count="3" />
</block>

<!-- Empty State -->
<block wx:elif="{{repos.length === 0}}">
  <empty-state 
    icon="🚗"
    title="还没有添加车辆"
    actionText="添加车辆"
    bind:action="goToCreate"
  />
</block>

<!-- Data List -->
<block wx:else>
  <view class="card-wrapper" wx:for="{{repos}}" wx:key="_id">
    <!-- Item content -->
  </view>
</block>
```

---

## 4️⃣ State Management Patterns

### **The AutoRepo State Management Model**

```typescript
Page({
  data: {
    // Raw data from API
    repos: [] as any[],
    commits: [] as any[],
    
    // UI state
    loading: true,
    currentTab: 0,
    
    // Form state
    title: '',
    typeIndex: 0,
    
    // Navigation state
    repoId: '',
    menuTop: 24
  },
  
  // Lifecycle methods
  async onShow() { /* triggered when page becomes visible */ }
  async onLoad(options: any) { /* triggered on page init */ }
  
  // Data methods
  async loadRepos() { /* fetch and format */ }
  
  // Event handlers
  onInput(e: any) { /* update state */ }
  switchTab(e: any) { /* update UI state */ }
})
```

**State Categories:**
1. **Data State**: Raw API responses (`repos`, `commits`)
2. **Loading State**: `loading: boolean`
3. **Form State**: User input fields (`title`, `typeIndex`)
4. **UI State**: View logic (`currentTab`, `offsetX`)
5. **Navigation State**: Route params (`repoId`)

**Updates happen via:**
- `this.setData({ key: value })` - Update single field
- `this.setData({ 'nested.key': value })` - Update nested field
- `this.setData({ [dynamicKey]: value })` - Update computed key

---

## 5️⃣ Design System & Styling

### **Color Palette** (app.scss)

```scss
--primary-color: #2c3e50;        /* Midnight Blue - main accent */
--accent-color: #3498db;         /* Bright Blue - interactive */
--success-color: #27ae60;
--bg-color: #f8f9fa;             /* Light Gray - page background */
--card-bg: #ffffff;
--text-main: #2c3e50;            /* Primary text */
--text-secondary: #7f8c8d;       /* Secondary text */
--text-light: #bdc3c7;           /* Disabled/hint text */
```

### **Spacing System**

```scss
--spacing-xs: 8rpx;              /* 4px equivalent */
--spacing-sm: 16rpx;             /* 8px equivalent */
--spacing-md: 32rpx;             /* 16px equivalent */
--spacing-lg: 48rpx;             /* 24px equivalent */
--spacing-xl: 64rpx;             /* 32px equivalent */
```

### **Shadows & Elevation**

```scss
--shadow-sm: 0 2px 4px rgba(0,0,0,0.05);
--shadow-md: 0 4px 12px rgba(44, 62, 80, 0.08);
--shadow-lg: 0 8px 24px rgba(44, 62, 80, 0.12);
--shadow-glow: 0 0 16px rgba(52, 152, 219, 0.4);
```

### **Animation Curves**

```scss
--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
--ease-elastic: cubic-bezier(0.175, 0.885, 0.32, 1.275);
--transition-fast: 0.2s var(--ease-out-expo);
--transition-normal: 0.3s var(--ease-out-expo);
```

---

## 📊 Data Model Overview

### **Repo (Vehicle)**

```typescript
{
  _id: ObjectId,
  name: string,
  vin?: string,
  color: string,
  current_mileage: number,
  current_head?: string,
  register_date?: timestamp,
  inspection_expiry?: timestamp,
  compulsory_insurance_expiry?: timestamp,
  commercial_insurance_expiry?: timestamp,
  created_at: timestamp
}
```

**Filterable Fields:**
- `name` (string search)
- `register_date` (date range)
- `current_mileage` (numeric range)

### **Commit (Maintenance Record)**

```typescript
{
  _id: ObjectId,
  repo_id: string,
  title: string,
  message?: string,
  mileage: number,
  type: 'maintenance' | 'repair' | 'modification',
  cost?: { parts: float, labor: float },
  closes_issues?: string[],
  timestamp: timestamp
}
```

**Filterable Fields:**
- `type` (enum: maintenance, repair, modification)
- `timestamp` (date range)
- `mileage` (numeric range)
- `title` (string search)

### **Issue (Maintenance Reminder)**

```typescript
{
  _id: ObjectId,
  repo_id: string,
  title: string,
  description?: string,
  status: 'open' | 'closed',
  priority: 'high' | 'medium' | 'low',
  labels: string[],
  due_date?: timestamp,
  due_mileage?: number,
  created_at: timestamp
}
```

**Filterable Fields:**
- `status` (enum)
- `priority` (enum)
- `labels` (array/tags)
- `due_date` (date range)
- `due_mileage` (numeric range)

---

## 🎯 Recommendations for Search/Filter Implementation

### **Phase 1: Commit List Filtering** (repo-detail page)

**Location**: `pages/repo-detail/index.ts` and `index.wxml`

**Implementation Strategy:**

1. **Add Filter UI** (sticky header below tabs):
   ```wxml
   <view class="filter-bar">
     <view class="filter-item" bindtap="toggleTypeFilter">
       <text class="filter-label">类型</text>
       <picker range="{{typeOptions}}" value="{{selectedType}}" bindchange="onTypeFilterChange">
         <text>{{selectedType === -1 ? '全部' : typeOptions[selectedType]}}</text>
       </picker>
     </view>
     <view class="filter-item">
       <input placeholder="搜索标题..." bindinput="onSearchChange" />
     </view>
   </view>
   ```

2. **Add Client-Side Filtering Logic**:
   ```typescript
   data: {
     allCommits: [] as any[],      // Original data from API
     filteredCommits: [] as any[],  // Filtered/searched data
     searchQuery: '',
     selectedType: -1,              // -1 = all
     typeOptions: ['常规保养', '故障维修', '改装升级']
   }
   
   onSearchChange(e: any) {
     this.setData({ searchQuery: e.detail.value })
     this.applyFilters()
   }
   
   onTypeFilterChange(e: any) {
     this.setData({ selectedType: e.detail.value })
     this.applyFilters()
   }
   
   applyFilters() {
     const { allCommits, searchQuery, selectedType } = this.data
     let filtered = allCommits
     
     // Filter by type
     if (selectedType !== -1) {
       const types = ['maintenance', 'repair', 'modification']
       filtered = filtered.filter(c => c.type === types[selectedType])
     }
     
     // Filter by search
     if (searchQuery) {
       filtered = filtered.filter(c => 
         c.title.toLowerCase().includes(searchQuery.toLowerCase())
       )
     }
     
     this.setData({ filteredCommits: filtered })
   }
   ```

3. **Use Filtered Data in Render**:
   ```wxml
   <view class="commit-list">
     <view wx:for="{{filteredCommits}}" wx:key="_id">
       <!-- Render item -->
     </view>
     
     <!-- Empty state when no results -->
     <empty-state 
       wx:if="{{filteredCommits.length === 0}}"
       title="没有搜索结果"
     />
   </view>
   ```

### **Phase 2: Repo List Search** (repo-list page)

**Location**: `pages/repo-list/index.ts`

**Similar pattern**: Search input + filter by name + mileage range

### **Phase 3: Issue Filtering** (dashboard-widget + new issues tab)

**Location**: Create new issues list component or extend dashboard-widget

**Support filtering by**: status, priority, due_date, due_mileage

---

## 🛠️ Reusable Components You Can Create

### **1. SearchInput Component**
```typescript
// components/search-input/index.ts
Component({
  properties: {
    placeholder: String,
    value: String
  },
  methods: {
    onInput(e: any) {
      this.triggerEvent('change', e.detail.value)
    }
  }
})
```

### **2. FilterBar Component**
```typescript
// components/filter-bar/index.ts
Component({
  properties: {
    filters: Array,  // [{ label: 'Type', options: [...] }]
    values: Object
  },
  methods: {
    onFilterChange(e: any) {
      this.triggerEvent('change', {
        filter: e.currentTarget.dataset.filter,
        value: e.detail.value
      })
    }
  }
})
```

### **3. Empty Result State** (Already exists!)
The `empty-state` component can be reused:
```wxml
<empty-state 
  icon="🔍"
  title="没有搜索结果"
  description="尝试调整筛选条件"
/>
```

---

## 📈 Performance Considerations

### **Don't**: Fetch all data then filter on client
```typescript
// ❌ BAD: Loads ALL commits then filters locally
const allCommits = await getCommits(repoId)
const filtered = allCommits.filter(...)
```

### **Do**: Send filter params to backend if dataset is large
```typescript
// ✅ GOOD: Let server filter
export const getCommits = (repoId: string, type?: string) => {
  let url = `/commits?repo_id=${repoId}`
  if (type) url += `&type=${type}`
  return request(url, 'GET')
}
```

**Current datasets are small**, so client-side filtering is fine for Phase 1.

---

## 💡 Implementation Checklist

### **To Add Search/Filter to Commit List:**

- [ ] Create filter bar UI below tabs
- [ ] Add search input field
- [ ] Add type dropdown (using picker)
- [ ] Maintain `allCommits` and `filteredCommits` separate
- [ ] Implement `applyFilters()` method
- [ ] Update WXML to use `filteredCommits`
- [ ] Add empty state for no results
- [ ] Test with various filter combinations

### **To Add Search to Repo List:**

- [ ] Add search input to top
- [ ] Implement name search
- [ ] Optional: Mileage range filter
- [ ] Show empty state if no matches

### **To Create Reusable Filter Component:**

- [ ] Create `components/filter-bar/` structure
- [ ] Support dynamic filter definitions
- [ ] Use event triggers to communicate changes
- [ ] Apply design system colors/spacing

---

## 🔗 Quick Links

- **API Layer**: `miniprogram/services/api.ts`
- **Design System**: `miniprogram/app.scss`
- **Form Patterns**: `pages/commit-create/index.ts`
- **List Patterns**: `pages/repo-list/index.ts`
- **Component Example**: `components/dashboard-widget/index.ts`
- **Backend Filtering Support**: `backend/routes.py` (lines 75-98)

---

## 🎓 Next Steps

1. **Decide scope**: Start with commit list filtering (smallest scope)
2. **Create UI**: Add filter bar + search input to repo-detail page
3. **Implement filtering**: Add `applyFilters()` logic
4. **Test manually**: Verify all filter combinations work
5. **Extract to component**: Create reusable `FilterBar` component
6. **Scale up**: Apply same pattern to repo list and issues list

---

*This analysis is current as of January 27, 2026.*
