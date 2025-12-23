# API & Database Architecture Redesign

## Current Issues Analysis

### 🔴 Critical Performance Issues

#### 1. Database Schema Problems
| Issue | Location | Impact |
|-------|----------|--------|
| Missing compound indexes | All models | Slow queries on filtered searches |
| N+1 query problem | `/api/user/history` | Separate location lookup per item |
| No denormalization | `SearchHistory` → `RankingResult` | Multiple joins required |
| Large documents | `RankingResult` (50+ fields) | Memory pressure, slow reads |
| No pagination cursor | All list endpoints | Skip-based pagination degrades at scale |

#### 2. API Architecture Problems
| Issue | Location | Impact |
|-------|----------|--------|
| Duplicate endpoints | `/api/history` vs `/api/user/history` | Confusion, maintenance burden |
| No API versioning | All routes | Breaking changes affect all clients |
| Repeated auth checks | Every route handler | Code duplication, inconsistency |
| Dynamic imports in handlers | `check-rank/regular`, `results/[id]` | Cold start latency |
| No response caching | All GET endpoints | Unnecessary database hits |
| Polling for results | `/results/[id]` | Inefficient, wastes resources |

#### 3. Missing Features
- No user management APIs (admin)
- No credit management APIs
- No system health/metrics APIs
- Limited analytics (only ranking-history)
- No bulk operations
- No webhook support for async results

---

## Proposed New Architecture

### Database Schema Optimizations

#### 1. New Indexes to Add

```javascript
// User Model
{ email: 1 }                           // Already exists (unique)
{ role: 1, createdAt: -1 }             // Admin: list users by role
{ requestTokens: 1 }                   // Find users with low tokens

// SearchHistory Model  
{ userId: 1, createdAt: -1 }           // User's history (most common query)
{ userId: 1, domain: 1, createdAt: -1 } // Filter by domain
{ domain: 1, createdAt: -1 }           // Admin: searches by domain
{ "taskIds": 1 }                       // Lookup by taskId

// RankingResult Model
{ taskId: 1 }                          // Primary lookup (unique)
{ userId: 1, createdAt: -1 }           // User's results
{ userId: 1, domain: 1, keyword: 1, createdAt: -1 } // Trend analysis
{ domain: 1, keyword: 1, createdAt: -1 } // Cross-user analytics
{ keyword: 1, location_code: 1, createdAt: -1 } // Keyword research

// MasterSERP Model
{ taskId: 1 }                          // Already exists (unique)
{ domain: 1, keyword: 1, createdAt: -1 } // History queries
{ createdAt: 1 }                       // TTL index for cleanup

// CreditUsage Model
{ userId: 1, timestamp: -1 }           // User usage history
{ apiEndpoint: 1, timestamp: -1 }      // Endpoint analytics
{ timestamp: -1 }                      // Recent usage

// Location Model
{ location_code: 1 }                   // Already exists (unique)
{ country_iso_code: 1, location_type: 1 } // Filter by country/type
{ location_name: "text", country_iso_code: "text" } // Text search
```

#### 2. Schema Denormalization

**Option A: Embed location_name in SearchHistory**
```javascript
// Before
SearchHistory: { location_code: 2840 }
// Requires join to get name

// After  
SearchHistory: { 
  location_code: 2840,
  location_name: "United States",  // Denormalized
  country_iso_code: "US"           // Denormalized
}
```

**Option B: Create Summary Collection**
```javascript
// New: RankingSummary (for fast dashboard queries)
{
  userId: ObjectId,
  domain: String,
  keyword: String,
  latestRank: Number,
  bestRank: Number,
  worstRank: Number,
  avgRank: Number,
  rankHistory: [{ date: Date, rank: Number }], // Last 30 data points
  checkCount: Number,
  lastChecked: Date,
  location_code: Number,
  location_name: String
}
```

#### 3. Cursor-Based Pagination
```javascript
// Before (slow at scale)
.skip((page - 1) * limit).limit(limit)

// After (constant time)
.find({ _id: { $lt: lastId } }).sort({ _id: -1 }).limit(limit)
// Or for date-based:
.find({ createdAt: { $lt: lastDate } }).sort({ createdAt: -1 }).limit(limit)
```

---

### New API Structure

```
/api/v1/
├── auth/
│   ├── login          POST   - Login
│   ├── register       POST   - Signup  
│   ├── logout         POST   - Logout
│   ├── me             GET    - Current user
│   └── refresh        POST   - Refresh token
│
├── users/
│   └── me/
│       ├── profile    GET/PATCH - User profile
│       ├── tokens     GET    - Token balance
│       └── usage      GET    - Credit usage history
│
├── rankings/
│   ├── check          POST   - Submit ranking check
│   ├── [id]/          
│   │   ├── status     GET    - Job status (lightweight)
│   │   ├── results    GET    - Full results
│   │   └── export     GET    - Export (json/csv/excel)
│   └── history        GET    - User's ranking history
│
├── keywords/
│   ├── suggestions    GET    - Keyword suggestions
│   ├── volume         GET    - Search volume data
│   └── trends         GET    - Keyword trends
│
├── serp/
│   └── [taskId]/      GET    - Full SERP data
│
├── locations/
│   ├── search         GET    - Location autocomplete
│   └── popular        GET    - Popular locations
│
├── analytics/
│   ├── dashboard      GET    - Dashboard summary
│   ├── rankings/
│   │   ├── trends     GET    - Rank trends over time
│   │   ├── distribution GET  - Rank distribution
│   │   └── changes    GET    - Rank changes (up/down)
│   ├── domains/
│   │   ├── performance GET   - Domain performance
│   │   └── comparison GET    - Compare domains
│   ├── keywords/
│   │   ├── top        GET    - Top performing keywords
│   │   ├── opportunities GET - Ranking opportunities
│   │   └── competitors GET   - Competitor keywords
│   └── serp-features/
│       ├── summary    GET    - SERP feature summary
│       └── trends     GET    - Feature trends
│
├── admin/
│   ├── users/
│   │   ├── list       GET    - List all users
│   │   ├── [id]/      GET/PATCH/DELETE - User CRUD
│   │   ├── [id]/tokens PATCH - Adjust tokens
│   │   └── bulk       POST   - Bulk operations
│   ├── credits/
│   │   ├── usage      GET    - System-wide usage
│   │   ├── allocate   POST   - Allocate credits
│   │   └── history    GET    - Credit history
│   ├── system/
│   │   ├── health     GET    - System health
│   │   ├── metrics    GET    - Performance metrics
│   │   └── jobs       GET    - Background job status
│   ├── analytics/
│   │   ├── overview   GET    - Admin dashboard
│   │   ├── users      GET    - User analytics
│   │   ├── api-usage  GET    - API usage stats
│   │   └── revenue    GET    - Revenue metrics
│   └── export/
│       ├── users      GET    - Export user data
│       └── usage      GET    - Export usage data
│
└── webhooks/
    └── configure      POST   - Configure result webhooks
```

---

### New API Implementations

#### 1. Admin User Management

```typescript
// GET /api/v1/admin/users/list
interface AdminUsersListParams {
  page?: number;
  limit?: number;
  cursor?: string;          // For cursor pagination
  role?: 'user' | 'admin';
  search?: string;          // Search by name/email
  sortBy?: 'createdAt' | 'requestTokens' | 'name';
  sortOrder?: 'asc' | 'desc';
  tokensBelow?: number;     // Filter users with low tokens
  createdAfter?: string;
  createdBefore?: string;
}

interface AdminUsersListResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  };
  stats: {
    totalUsers: number;
    activeToday: number;
    lowTokenUsers: number;
  };
}
```

#### 2. Analytics APIs

```typescript
// GET /api/v1/analytics/dashboard
interface DashboardResponse {
  summary: {
    totalKeywords: number;
    avgRank: number;
    rankedKeywords: number;    // Keywords in top 100
    notRanked: number;
    checksToday: number;
    creditsUsed: number;
  };
  rankDistribution: {
    top3: number;
    top10: number;
    top20: number;
    top50: number;
    top100: number;
    notRanked: number;
  };
  recentChanges: {
    improved: number;
    declined: number;
    unchanged: number;
    new: number;
  };
  topDomains: Array<{
    domain: string;
    keywords: number;
    avgRank: number;
  }>;
  recentChecks: Array<{
    id: string;
    domain: string;
    keywords: number;
    createdAt: Date;
  }>;
}

// GET /api/v1/analytics/rankings/trends
interface RankingTrendsParams {
  domain?: string;
  keyword?: string;
  location_code?: number;
  dateFrom: string;
  dateTo: string;
  granularity?: 'day' | 'week' | 'month';
}

interface RankingTrendsResponse {
  trends: Array<{
    date: string;
    avgRank: number;
    bestRank: number;
    worstRank: number;
    keywordCount: number;
  }>;
  summary: {
    startAvg: number;
    endAvg: number;
    change: number;
    changePercent: number;
  };
}

// GET /api/v1/analytics/serp-features/summary
interface SerpFeaturesSummaryResponse {
  features: {
    aiOverview: { count: number; percent: number };
    featuredSnippet: { count: number; percent: number };
    peopleAlsoAsk: { count: number; percent: number };
    localPack: { count: number; percent: number };
    sitelinks: { count: number; percent: number };
    images: { count: number; percent: number };
    videos: { count: number; percent: number };
  };
  domainPresence: {
    inAiOverview: number;
    inFeaturedSnippet: number;
    inLocalPack: number;
  };
}
```

---

### Caching Strategy

#### 1. In-Memory Cache (for hot data)
```typescript
// lib/cache.ts
const cache = new Map<string, { data: any; expires: number }>();

export function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item || Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  return item.data as T;
}

export function setCache(key: string, data: any, ttlMs: number): void {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

// Cache keys
const CACHE_KEYS = {
  userTokens: (userId: string) => `user:${userId}:tokens`,
  locationSearch: (query: string) => `loc:${query}`,
  adminStats: () => 'admin:stats',
  userDashboard: (userId: string) => `user:${userId}:dashboard`,
};

// TTLs
const TTL = {
  userTokens: 60 * 1000,        // 1 minute
  locationSearch: 60 * 60 * 1000, // 1 hour
  adminStats: 5 * 60 * 1000,    // 5 minutes
  userDashboard: 2 * 60 * 1000, // 2 minutes
};
```

#### 2. HTTP Cache Headers
```typescript
// For static/slow-changing data
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
  }
});

// For user-specific data
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'private, max-age=60',
  }
});
```

#### 3. MongoDB Aggregation Caching
```typescript
// Store aggregation results for expensive queries
interface AggregationCache {
  key: string;           // Unique cache key
  result: any;
  computedAt: Date;
  expiresAt: Date;
}
```

---

### Performance Optimizations

#### 1. Lean Queries
```typescript
// Before
const results = await RankingResult.find({ userId });

// After (50% faster, less memory)
const results = await RankingResult.find({ userId }).lean();
```

#### 2. Projection (Select only needed fields)
```typescript
// Before
const history = await SearchHistory.find({ userId });

// After
const history = await SearchHistory.find({ userId })
  .select('domain keywords location createdAt')
  .lean();
```

#### 3. Aggregation Pipelines (instead of multiple queries)
```typescript
// Before: N+1 queries
const history = await SearchHistory.find({ userId });
for (const item of history) {
  const location = await Location.findOne({ location_code: item.location_code });
  item.locationName = location.location_name;
}

// After: Single aggregation
const history = await SearchHistory.aggregate([
  { $match: { userId: new ObjectId(userId) } },
  { $lookup: {
      from: 'locations',
      localField: 'location_code',
      foreignField: 'location_code',
      as: 'locationData'
  }},
  { $unwind: { path: '$locationData', preserveNullAndEmptyArrays: true } },
  { $project: {
      domain: 1,
      keywords: 1,
      location: { $ifNull: ['$locationData.location_name', '$location'] },
      createdAt: 1
  }}
]);
```

#### 4. Background Jobs for Heavy Operations
```typescript
// Instead of computing analytics on-demand, use scheduled jobs
// to pre-compute and store in summary collections

// scripts/compute-analytics.ts (run via cron)
async function computeDailyAnalytics() {
  // Compute rank distribution
  const distribution = await RankingResult.aggregate([...]);
  await AnalyticsCache.updateOne(
    { type: 'rank_distribution', date: today },
    { $set: { data: distribution } },
    { upsert: true }
  );
}
```

---

## Implementation Priority

### Phase 1: Critical Fixes (Week 1)
1. ✅ Add missing indexes to all models
2. ✅ Fix N+1 queries with aggregation pipelines
3. ✅ Add in-memory caching for hot paths
4. ✅ Consolidate duplicate endpoints

### Phase 2: New Admin APIs (Week 2)
1. User management (list, update, delete)
2. Credit management (allocate, history)
3. System health & metrics

### Phase 3: Analytics APIs (Week 3)
1. Dashboard summary
2. Ranking trends
3. Domain performance
4. SERP features analytics

### Phase 4: Advanced Features (Week 4)
1. Cursor-based pagination
2. Webhook support for async results
3. Bulk operations
4. Export APIs

---

## File Structure for New APIs

```
app/api/v1/
├── _lib/
│   ├── auth.ts           # Centralized auth middleware
│   ├── cache.ts          # Caching utilities
│   ├── pagination.ts     # Pagination helpers
│   ├── validation.ts     # Request validation
│   └── response.ts       # Standard response helpers
├── admin/
│   ├── users/
│   │   ├── route.ts      # GET (list), POST (create)
│   │   └── [id]/
│   │       ├── route.ts  # GET, PATCH, DELETE
│   │       └── tokens/
│   │           └── route.ts
│   ├── credits/
│   │   └── route.ts
│   ├── system/
│   │   ├── health/
│   │   │   └── route.ts
│   │   └── metrics/
│   │       └── route.ts
│   └── analytics/
│       └── route.ts
├── analytics/
│   ├── dashboard/
│   │   └── route.ts
│   ├── rankings/
│   │   ├── trends/
│   │   │   └── route.ts
│   │   ├── distribution/
│   │   │   └── route.ts
│   │   └── changes/
│   │       └── route.ts
│   ├── domains/
│   │   └── route.ts
│   ├── keywords/
│   │   └── route.ts
│   └── serp-features/
│       └── route.ts
└── ...
```
