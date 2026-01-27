# Commit Data Structure - Quick Reference Card

## COMPLETE FIELD SUMMARY

| # | Field Name | Type | Required | Searchable | Filterable | Notes |
|---|------------|------|----------|-----------|-----------|-------|
| 1 | `_id` (id) | ObjectId → str | Generated | ✓ Exact | ✗ | MongoDB generated |
| 2 | `repo_id` | str | ✅ | ✓ | ✅ | Vehicle ID, required |
| 3 | `title` | str | ✅ | ✓ Keyword | ✗ | "更换机油", max 200 chars |
| 4 | `message` | str \| null | ✗ | ✓ Keyword | ✗ | Details, max 2000 chars |
| 5 | `mileage` | int | ✅ | ✗ | ✅ Range | km, immutable |
| 6 | `type` | str | ✅ | ✗ | ✅ Enum | maintenance / repair / modification |
| 7 | `cost.parts` | float | ✗ | ✗ | ✅ Range | CNY, ≥ 0 |
| 8 | `cost.labor` | float | ✗ | ✗ | ✅ Range | CNY, ≥ 0 |
| 9 | `cost.currency` | str | ✗ | ✗ | ✗ | Always "CNY" |
| 10 | `closes_issues` | list[str] | ✗ | ✗ | ✗ | Issue IDs closed |
| 11 | `timestamp` | float (ms) | Generated | ✗ | ✅ Range | Unix × 1000, auto-set |

---

## TYPE ENUM (Only 3 Valid Values)

```
Key              │ Chinese Label    │ Description
─────────────────┼──────────────────┼─────────────────────────
maintenance      │ 常规保养         │ Regular service, oil change
repair           │ 故障维修         │ Broken part fixes
modification     │ 改装升级         │ Upgrades, customizations
```

---

## TIMESTAMP REFERENCE

| Format | Value | Example |
|--------|-------|---------|
| Storage (DB) | float (milliseconds) | `1706333127000` |
| JavaScript Date | `new Date(1706333127000)` | `Wed Jan 27 2026 10:35:27` |
| ISO String | `.toISOString()` | `2026-01-27T10:35:27.000Z` |
| Display (Full) | Formatted | `2026/01/27 10:35:27` |
| Display (Date) | Formatted | `2026-01-27` |

**Conversion**: `new Date(timestamp_ms).getTime()` ↔️ `timestamp_ms / 1000`

---

## API ENDPOINTS (Current + Proposed)

### Current Endpoints

```http
GET    /commits?repo_id=XXX
       → List commits (newest first)

GET    /commits/{commit_id}
       → Get single commit detail

POST   /commits
       → Create commit (auto HEAD update, issue closing)

GET    /repos/{repo_id}/stats
       → Aggregated cost by type
```

### Proposed Endpoints (for search/filter/export)

```http
GET    /commits?repo_id=XXX&type_filter=maintenance&min_mileage=40000
       → Filtered list

GET    /commits/search?repo_id=XXX&q=oil
       → Text search in title/message

GET    /commits/export?repo_id=XXX&format=csv
       → Export as CSV/JSON
```

---

## STORAGE: Cost Object Structure

```json
{
  "parts": 150.5,
  "labor": 80.0,
  "currency": "CNY"
}
```

**Display Calculation**: `total = parts + labor = 230.5 CNY`

---

## EXAMPLE: Complete Commit Record

```json
{
  "_id": "67950a1c2b6e4a1234567890",
  "repo_id": "67950a1b2b6e4a0987654321",
  "title": "更换机油和滤芯",
  "message": "使用壳牌Helix Ultra 5W-30全合成机油",
  "mileage": 50000,
  "type": "maintenance",
  "cost": {
    "parts": 150,
    "labor": 80,
    "currency": "CNY"
  },
  "closes_issues": ["67950a1b2b6e4a3456789abc"],
  "timestamp": 1706333127000
}
```

**Display in Timeline**:
```
┌─ 更换机油和滤芯              50000 km
│  67950a1c... | 2026/01/27 10:35:27
└─ (Git-style timeline)
```

**Display in Detail Page**:
```
更换机油和滤芯  [maintenance]
───────────────────────────
ID:      67950a1c...
里程:    50000 km
日期:    2026/01/27 10:35:27

详细描述:
使用壳牌Helix Ultra 5W-30全合成机油

配件费:  ¥ 150.00
工时费:  ¥ 80.00
─────────────────
总计:    ¥ 230.00
```

---

## FRONTEND DISPLAY FIELDS

### Timeline View (repo-detail)
- `title` - Main heading
- `mileage` - Km indicator
- `_id` - Short commit hash
- `date` - Formatted timestamp

### Detail View (commit-detail)
- `title` - Heading with type tag
- `_id` - Full ID (monospace)
- `mileage` - Km
- `date` - Formatted datetime
- `message` - Description text
- `cost.parts` - Parts fee
- `cost.labor` - Labor fee
- Total cost (calculated)

---

## FILTERING GUIDE

### By Type (Enum)

```
GET /commits?repo_id=123&type_filter=maintenance
GET /commits?repo_id=123&type_filter=repair
GET /commits?repo_id=123&type_filter=modification
```

### By Mileage Range

```
GET /commits?repo_id=123&min_mileage=40000&max_mileage=60000
```

### By Date Range

```
GET /commits?repo_id=123&start_date=2026-01-01&end_date=2026-01-31
```

### By Cost Range

```
GET /commits?repo_id=123&min_cost=100&max_cost=500
```

### Combine Filters

```
GET /commits?repo_id=123&type_filter=repair&min_mileage=40000&min_cost=200
```

### Text Search

```
GET /commits/search?repo_id=123&q=oil+filter
```

---

## VALIDATION CHECKLIST

### On Create (POST /commits)

- [ ] `repo_id` not empty, exists in repos
- [ ] `title` not empty (1-200 chars)
- [ ] `mileage` non-negative integer
- [ ] `type` is valid enum (or log warning)
- [ ] `message` max 2000 chars (if provided)
- [ ] `cost.parts` ≥ 0 (if provided)
- [ ] `cost.labor` ≥ 0 (if provided)
- [ ] `closes_issues` array of valid IDs (optional)
- [ ] `timestamp` within ±10 years of now

### On Update (PUT)

- [ ] Prevent changing `mileage` (immutable)
- [ ] Prevent changing `repo_id` (immutable)
- [ ] Prevent changing `timestamp` (immutable)

---

## EXPORT FORMATS

### CSV Header

```
ID,标题,类型,里程(km),日期,配件费,工时费,总计,备注
67950a1c,更换机油,常规保养,50000,2026-01-27,150.00,80.00,230.00,新机油...
```

### JSON Structure

```json
{
  "vehicle": {
    "name": "特斯拉 Model 3",
    "current_mileage": 120000,
    "export_date": "2026-01-27T10:35:27Z"
  },
  "commits": [
    {
      "id": "67950a1c",
      "title": "更换机油",
      "type": "maintenance",
      "date": "2026-01-27",
      "cost_total": 230
    }
  ],
  "summary": {
    "total_records": 45,
    "total_cost": 5230,
    "cost_per_km": 0.044
  }
}
```

---

## COMMON QUERIES (MongoDB)

### Find all repairs > ¥500
```javascript
db.commits.find({
  "repo_id": "123",
  "type": "repair",
  "$expr": {"$gte": [{"$add": ["$cost.parts", "$cost.labor"]}, 500]}
})
```

### Find by date range
```javascript
db.commits.find({
  "repo_id": "123",
  "timestamp": {
    "$gte": 1704067200000,
    "$lte": 1706745599000
  }
})
```

### Text search
```javascript
db.commits.find({
  "repo_id": "123",
  "$text": {"$search": "spark"}
})
```

---

## PERFORMANCE NOTES

### Recommended Indexes

```javascript
// Primary query pattern (by repo + time)
db.commits.createIndex({ repo_id: 1, timestamp: -1 })

// Type filtering
db.commits.createIndex({ repo_id: 1, type: 1 })

// Mileage range queries
db.commits.createIndex({ repo_id: 1, mileage: 1 })

// Text search (optional)
db.commits.createIndex({ title: "text", message: "text" })
```

### Query Performance

| Query | Time | Index |
|-------|------|-------|
| Get all commits for repo | ~10ms | repo_id + timestamp |
| Filter by type | ~5ms | repo_id + type |
| Date range | ~8ms | repo_id + timestamp |
| Text search | ~20ms | text index |
| Cost calculation (aggregation) | ~15ms | — |

---

## FIELD SIZE ESTIMATES

| Field | Max Size | Notes |
|-------|----------|-------|
| `title` | 200 chars (~400 bytes) | UI picker limits |
| `message` | 2000 chars (~4 KB) | Long-form notes |
| `_id` | 24 chars (12 bytes) | ObjectId hex |
| `repo_id` | 24 chars (12 bytes) | ObjectId hex |
| `type` | 20 chars (~40 bytes) | Fixed enum |
| Full document | ~5 KB average | — |
| All commits (1000 records) | ~5 MB | — |

---

## QUICK FACTS

✅ **Timestamp** is milliseconds (not seconds!)  
✅ **Type** only has 3 valid values (but backend accepts all)  
✅ **Cost** split into `parts` and `labor` (sum = total)  
✅ **Mileage** is immutable (one-way time direction)  
✅ **Commits** auto-update repo `current_mileage` and `current_head`  
✅ **Export** ready for CSV/JSON (no endpoint yet)  
❌ **Text search** not implemented (needs MongoDB text index)  
❌ **Pagination** not implemented (all results returned)  
❌ **Search/filter endpoints** don't exist yet  

---

## USE CASE EXAMPLES

### "Show me all maintenance records this year"
```
Type: maintenance
Date: 2026-01-01 to 2026-12-31
```

### "Find expensive repairs (> ¥1000) in last 6 months"
```
Type: repair
Cost: > 1000
Date: 2025-08-01 to 2026-01-27
```

### "Search for 'transmission' work"
```
Search: transmission (title + message)
```

### "Timeline between 30k-60k km"
```
Mileage: 30000 to 60000
```

### "Export all 2025 maintenance for record"
```
Format: CSV
Type: maintenance
Date: 2025-01-01 to 2025-12-31
```

