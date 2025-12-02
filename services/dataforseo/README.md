# DataForSEO Services

Comprehensive service layer for all DataForSEO API interactions with automatic credit tracking.

## Structure

```
services/dataforseo/
├── base.ts           # Base client with authentication & credit tracking
├── types.ts          # TypeScript interfaces for all APIs
├── utils.ts          # Utility functions
├── live-regular.ts   # Live Regular API (fast, basic data)
├── live-advanced.ts  # Live Advanced API (comprehensive data)
├── task-post.ts      # Task Post API (async task submission)
├── task-get.ts       # Task Get API (retrieve task results)
└── index.ts          # Main exports
```

## Usage

### Live Regular API (Fast & Cheap)

```typescript
import { searchDomainRankingRegular } from '@/services/dataforseo';

const result = await searchDomainRankingRegular(
    'example.com',
    'my keyword',
    {
        location_code: 2840, // US
        language_code: 'en',
        device: 'desktop',
        userId: 'user123'
    }
);

if (result.success) {
    console.log('Rank:', result.data.rank);
    console.log('Credits used:', result.cost);
}
```

### Live Advanced API (Full SERP Data)

```typescript
import { searchDomainRankingAdvanced } from '@/services/dataforseo';

const result = await searchDomainRankingAdvanced(
    'example.com',
    'my keyword',
    {
        location_code: 2840,
        depth: 100,
        userId: 'user123'
    }
);

if (result.success) {
    console.log('Ranking data:', result.data.rankingData);
    console.log('Top rankers:', result.data.topRankers);
    console.log('Metrics:', result.data.metrics);
}
```

### Task Post API (Async Batch Processing)

```typescript
import { submitDomainRankingTasks } from '@/services/dataforseo';

const result = await submitDomainRankingTasks(
    'example.com',
    ['keyword 1', 'keyword 2', 'keyword 3'],
    {
        location_code: 2840,
        priority: 1, // 1 = standard, 2 = high
        userId: 'user123'
    }
);

if (result.success) {
    console.log('Submitted tasks:', result.data);
    // Tasks will be processed asynchronously
}
```

### Task Get API (Retrieve Results)

```typescript
import { getTasksReady, getTaskResult } from '@/services/dataforseo';

// Get list of ready tasks
const readyTasks = await getTasksReady();

if (readyTasks.success) {
    for (const taskId of readyTasks.data) {
        const result = await getTaskResult(taskId);
        if (result.success) {
            console.log('Task result:', result.data);
        }
    }
}
```

## Features

### Automatic Credit Tracking

All API calls automatically track credit usage in the `CreditUsage` collection:

```typescript
{
    userId: ObjectId,
    apiEndpoint: '/serp/google/organic/live/regular',
    creditsUsed: 0.0006,
    requestParams: { keyword: 'test', ... },
    responseStatus: 20000,
    timestamp: Date
}
```

### Error Handling

All services return a consistent `APIResult` type:

```typescript
type APIResult<T> = 
    | { success: true; data: T; cost: number }
    | { success: false; error: string; errorCode?: number };
```

### Utility Functions

```typescript
import { 
    formatDomain,
    calculateEstimatedCost,
    findDomainRanking,
    extractTopRankers 
} from '@/services/dataforseo/utils';

// Clean domain
const clean = formatDomain('https://www.example.com/'); // 'example.com'

// Estimate cost
const cost = calculateEstimatedCost('live_regular', { taskCount: 5 }); // 0.003

// Find domain in SERP items
const ranking = findDomainRanking(serpItems, 'example.com');

// Extract top 3 rankers
const topRankers = extractTopRankers(serpItems, 3);
```

## API Costs

| API Type | Cost per Request | Use Case |
|----------|-----------------|----------|
| Live Regular | ~$0.0006 | Fast ranking checks, limited to top 20 |
| Live Advanced | ~$0.002 | Full SERP data with all features |
| Task Post (Standard) | ~$0.0006 | Async batch processing |
| Task Post (High Priority) | ~$0.0012 | Faster async processing |
| Task Get | $0 | Retrieve submitted task results |

## TypeScript Support

All services are fully typed with comprehensive interfaces:

```typescript
import type { 
    LiveSERPRequest,
    SERPResult,
    SERPItem,
    TaskPostRequest,
    SubmittedTask 
} from '@/services/dataforseo/types';
```

## Best Practices

1. **Use caching**: Check database cache before making API calls
2. **Batch requests**: Use task_post for multiple keywords
3. **Monitor credits**: Track usage via CreditUsage collection
4. **Handle errors**: Always check `result.success` before using data
5. **Use stop_crawl_on_match**: Optimize costs by stopping when domain is found

## Examples

See the updated routes for real-world usage:
- `app/api/check-rank/regular/route.ts` - Live Regular API
- `lib/processJobs.ts` - Task Post/Get APIs
