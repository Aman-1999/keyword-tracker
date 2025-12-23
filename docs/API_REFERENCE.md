# API Reference - v1

## Base URL

```
/api/v1
```

## Authentication

All protected endpoints require a valid JWT token stored in an HTTP-only cookie named `token`.

---

## Admin APIs

### Users

#### List Users

```
GET /api/v1/admin/users
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |
| search | string | Search by name or email |
| role | string | Filter by role: `user` or `admin` |
| tokensBelow | number | Filter users with tokens <= value |
| createdAfter | string | ISO date string |
| createdBefore | string | ISO date string |
| isActive | boolean | Filter by active status (last 7 days) |
| sortBy | string | Sort field (default: `createdAt`) |
| sortOrder | string | `asc` or `desc` (default: `desc`) |

**Response:**

```json
{
  "success": true,
  "data": [...users],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "stats": {
      "totalUsers": 100,
      "activeToday": 25,
      "lowTokenUsers": 10,
      "usersByRole": [...]
    }
  }
}
```

#### Get User

```
GET /api/v1/admin/users/:id
```

#### Create User

```
POST /api/v1/admin/users
```

**Body:**

```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "user|admin",
  "requestTokens": 100
}
```

#### Update User

```
PATCH /api/v1/admin/users/:id
```

**Body:**

```json
{
  "name": "string",
  "email": "string",
  "role": "user|admin",
  "requestTokens": 100,
  "password": "string"
}
```

#### Delete User

```
DELETE /api/v1/admin/users/:id
```

#### Adjust User Tokens

```
PATCH /api/v1/admin/users/:id/tokens
```

**Body:**

```json
{
  "amount": 100,
  "operation": "add|subtract|set",
  "reason": "string"
}
```

---

### System

#### Health Check

```
GET /api/v1/admin/system/health
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 12345,
    "database": {
      "status": "connected",
      "stats": {...}
    },
    "collections": {
      "users": 100,
      "searchHistory": 500,
      "rankingResults": 1000,
      "masterSerp": 800,
      "creditUsage": 2000
    },
    "memory": {...},
    "cache": {...},
    "node": {...}
  }
}
```

---

### Admin Analytics

#### Overview Dashboard

```
GET /api/v1/admin/analytics/overview
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| days | number | Period in days (default: 30) |

**Response:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "summary": {
      "totalUsers": 100,
      "newUsers": 10,
      "activeUsers": 50,
      "totalSearches": 500,
      "recentSearches": 100,
      "totalRankings": 1000,
      "totalCreditsUsed": 5000,
      "totalApiRequests": 2000
    },
    "usersByRole": {...},
    "charts": {
      "searchesByDay": [...]
    },
    "rankings": {
      "topDomains": [...],
      "topKeywords": [...],
      "distribution": {...}
    }
  }
}
```

---

## User Analytics APIs

### Dashboard

```
GET /api/v1/analytics/dashboard
```

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalKeywords": 100,
      "rankedKeywords": 80,
      "notRanked": 20,
      "avgRank": 25.5
    },
    "rankDistribution": {
      "top3": 5,
      "top10": 15,
      "top20": 25,
      "top50": 20,
      "top100": 15,
      "notRanked": 20
    },
    "recentChanges": {
      "improved": 10,
      "declined": 5,
      "unchanged": 65
    },
    "serpFeatures": {...},
    "topDomains": [...],
    "recentSearches": [...]
  }
}
```

### Ranking Trends

```
GET /api/v1/analytics/rankings/trends
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| domain | string | Filter by domain |
| keyword | string | Filter by keyword (partial match) |
| days | number | Period in days (default: 30) |
| granularity | string | `day`, `week`, or `month` (default: `day`) |

**Response:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "filters": {...},
    "summary": {
      "startAvg": 30.5,
      "endAvg": 25.2,
      "change": 5.3,
      "changePercent": 17,
      "trend": "improving"
    },
    "trends": [
      {
        "date": "2024-01-01",
        "avgRank": 25.5,
        "bestRank": 3,
        "worstRank": 85,
        "keywordCount": 50,
        "rankedCount": 45
      }
    ],
    "keywordTrends": [...]
  }
}
```

### Domain Analytics

```
GET /api/v1/analytics/domains
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| domain | string | Get detailed stats for specific domain |
| days | number | Period in days (default: 30) |
| page | number | Page number |
| limit | number | Items per page |

**Response (List):**

```json
{
  "success": true,
  "data": [
    {
      "domain": "example.com",
      "searches": 10,
      "lastSearched": "2024-01-01T00:00:00.000Z",
      "avgRank": 25.5,
      "bestRank": 3,
      "totalKeywords": 50,
      "rankedKeywords": 45
    }
  ],
  "pagination": {...}
}
```

**Response (Specific Domain):**

```json
{
  "success": true,
  "data": {
    "domain": "example.com",
    "period": {...},
    "summary": {...},
    "serpFeatures": {...},
    "keywords": [...],
    "rankHistory": [...]
  }
}
```

### SERP Features Analytics

```
GET /api/v1/analytics/serp-features
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| domain | string | Filter by domain |
| days | number | Period in days (default: 30) |

**Response:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "filters": {...},
    "summary": {
      "totalChecks": 1000,
      "features": {
        "aiOverview": { "count": 300, "percent": 30 },
        "peopleAlsoAsk": { "count": 500, "percent": 50 },
        "featuredSnippet": { "count": 100, "percent": 10 },
        "localPack": { "count": 200, "percent": 20 },
        "sitelinks": { "count": 150, "percent": 15 },
        "images": { "count": 250, "percent": 25 },
        "faq": { "count": 50, "percent": 5 }
      }
    },
    "domainPresence": {...},
    "trends": [...],
    "keywords": {
      "withAiOverview": [...],
      "withPaa": [...],
      "withFeaturedSnippet": [...]
    }
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "meta": {...}
}
```

**Common Status Codes:**
| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Shared Utilities

The new API architecture uses shared utilities located in `/lib/api/`:

- **auth.ts** - Authentication helpers (`verifyAuth`, `verifyAdmin`)
- **cache.ts** - In-memory caching (`getOrSetCache`, `invalidateUserCache`)
- **pagination.ts** - Pagination helpers (`parsePaginationParams`, `buildPagination`)
- **response.ts** - Standardized responses (`successResponse`, `errorResponse`)

---

## Database Indexes

The following indexes have been added for performance:

### User

- `{ role: 1, createdAt: -1 }`
- `{ requestTokens: 1, role: 1 }`
- `{ lastActiveAt: -1 }`

### SearchHistory

- `{ userId: 1, createdAt: -1 }`
- `{ userId: 1, domain: 1, createdAt: -1 }`
- `{ domain: 1, createdAt: -1 }`
- `{ taskIds: 1 }`

### RankingResult

- `{ userId: 1, createdAt: -1 }`
- `{ userId: 1, domain: 1, keyword: 1, createdAt: -1 }`
- `{ domain: 1, keyword: 1, createdAt: -1 }`
- `{ keyword: 1, location_code: 1, createdAt: -1 }`
- `{ taskId: 1 }` (unique)
- `{ rank: 1, createdAt: -1 }`
- `{ isAiOverview: 1, isPeopleAlsoAsk: 1 }`

### MasterSERP

- `{ domain: 1, keyword: 1, createdAt: -1 }`
- `{ isAiOverview: 1, isPeopleAlsoAsk: 1 }`
- `{ createdAt: -1 }`
