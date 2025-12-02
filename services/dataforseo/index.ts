// DataForSEO Services - Main Export File

// Base client
export { DataForSEOClient, getDataForSEOClient } from './base';

// Types
export * from './types';

// Utilities
export * from './utils';

// Live Regular API
export {
    searchLiveRegular,
    searchDomainRankingRegular,
    batchSearchLiveRegular,
} from './live-regular';

// Live Advanced API
export {
    searchLiveAdvanced,
    searchDomainRankingAdvanced,
    getFullSERPAnalysis,
} from './live-advanced';

// Task Post API
export {
    submitTask,
    submitBatchTasks,
    submitDomainRankingTasks,
    getEstimatedCompletionTime,
} from './task-post';

// Task Get API
export {
    getTasksReady,
    getTaskResult,
    getBatchTaskResults,
    waitForTaskCompletion,
    waitForBatchTaskCompletion,
    checkTaskStatus,
} from './task-get';
