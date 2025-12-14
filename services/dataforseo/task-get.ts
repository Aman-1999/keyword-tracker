// Task Get API Service
// Retrieve results from submitted tasks

import { getDataForSEOClient } from './base';
import { SERPResult, TaskResult, APIResult } from './types';

/**
 * Get list of ready tasks
 * No additional cost - just checking status
 */
export async function getTasksReady(): Promise<APIResult<string[]>> {
    try {
        const client = getDataForSEOClient();

        const response = await client.makeRequest(
            '/serp/google/organic/tasks_ready',
            'GET'
        );

        if (response.tasks && response.tasks.length > 0) {
            const taskIds = response.tasks
                .filter(task => task.result && task.result.length > 0)
                .map(task => task.id);

            return {
                success: true,
                data: taskIds,
                cost: 0, // No cost for checking ready tasks
            };
        }

        return {
            success: true,
            data: [],
            cost: 0,
        };
    } catch (error: any) {
        console.error('Get ready tasks error:', error);
        return {
            success: false,
            error: error.message || 'Failed to get ready tasks',
        };
    }
}

/**
 * Get specific task result by ID
 * No additional cost - already paid in task_post
 */
export async function getTaskResult(taskId: string): Promise<APIResult<SERPResult>> {
    try {
        const client = getDataForSEOClient();

        const response = await client.makeRequest<SERPResult>(
            `/serp/google/organic/task_get/advanced/${taskId}`,
            'GET'
        );

        if (response.tasks && response.tasks[0] && response.tasks[0].result) {
            const result = response.tasks[0].result[0];

            return {
                success: true,
                data: result,
                cost: 0, // No additional cost
            };
        }

        return {
            success: false,
            error: 'No result found for task',
        };
    } catch (error: any) {
        console.error(`Get task result error for ${taskId}:`, error);
        return {
            success: false,
            error: error.message || 'Failed to get task result',
        };
    }
}

export async function getBatchTaskResults(
    taskIds: string[],
    chunkSize: number = 10
): Promise<APIResult<Map<string, SERPResult>>> {
    try {
        const results = new Map<string, SERPResult>();
        const errors: string[] = [];

        // Process in chunks
        for (let i = 0; i < taskIds.length; i += chunkSize) {
            const chunk = taskIds.slice(i, i + chunkSize);

            const promises = chunk.map(async (taskId) => {
                const result = await getTaskResult(taskId);
                return { taskId, result };
            });

            const chunkResults = await Promise.all(promises);
            console.log('Chunk results:', JSON.stringify(chunkResults, null, 2));
            chunkResults.forEach(({ taskId, result }) => {
                if (result.success) {
                    results.set(taskId, result.data);
                } else {
                    errors.push(`${taskId}: ${result.error}`);
                }
            });

            // Small delay between chunks
            if (i + chunkSize < taskIds.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        if (results.size === 0 && errors.length > 0) {
            return {
                success: false,
                error: `All requests failed: ${errors.join(', ')}`,
            };
        }

        return {
            success: true,
            data: results,
            cost: 0, // No additional cost
        };
    } catch (error: any) {
        console.error('Batch get task results error:', error);
        return {
            success: false,
            error: error.message || 'Failed to get batch task results',
        };
    }
}

/**
 * Wait for task to complete and return result
 * Polls until task is ready or timeout
 */
export async function waitForTaskCompletion(
    taskId: string,
    options: {
        maxWaitTime?: number; // milliseconds
        pollInterval?: number; // milliseconds
    } = {}
): Promise<APIResult<SERPResult>> {
    const maxWaitTime = options.maxWaitTime || 300000; // 5 minutes default
    const pollInterval = options.pollInterval || 5000; // 5 seconds default
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
        // Check if task is ready
        const readyTasks = await getTasksReady();

        if (readyTasks.success && readyTasks.data.includes(taskId)) {
            // Task is ready, get result
            return await getTaskResult(taskId);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return {
        success: false,
        error: 'Task completion timeout',
    };
}

/**
 * Wait for multiple tasks to complete
 * Returns results as they become available
 */
export async function waitForBatchTaskCompletion(
    taskIds: string[],
    options: {
        maxWaitTime?: number;
        pollInterval?: number;
        onTaskComplete?: (taskId: string, result: SERPResult) => void;
    } = {}
): Promise<APIResult<Map<string, SERPResult>>> {
    const maxWaitTime = options.maxWaitTime || 600000; // 10 minutes default
    const pollInterval = options.pollInterval || 10000; // 10 seconds default
    const startTime = Date.now();

    const results = new Map<string, SERPResult>();
    const pendingTaskIds = new Set(taskIds);

    while (pendingTaskIds.size > 0 && Date.now() - startTime < maxWaitTime) {
        // Check for ready tasks
        const readyTasks = await getTasksReady();

        if (readyTasks.success) {
            // Get results for ready tasks
            const readyPendingTasks = readyTasks.data.filter(id => pendingTaskIds.has(id));

            for (const taskId of readyPendingTasks) {
                const result = await getTaskResult(taskId);

                if (result.success) {
                    results.set(taskId, result.data);
                    pendingTaskIds.delete(taskId);

                    // Call callback if provided
                    if (options.onTaskComplete) {
                        options.onTaskComplete(taskId, result.data);
                    }
                }
            }
        }

        // Wait before next poll if there are still pending tasks
        if (pendingTaskIds.size > 0) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
    }

    if (pendingTaskIds.size > 0) {
        console.warn(`${pendingTaskIds.size} tasks did not complete within timeout`);
    }

    return {
        success: true,
        data: results,
        cost: 0,
    };
}

/**
 * Check task status without retrieving full result
 */
export async function checkTaskStatus(taskId: string): Promise<APIResult<{
    taskId: string;
    status: 'pending' | 'processing' | 'ready' | 'failed';
    statusCode: number;
}>> {
    try {
        const readyTasks = await getTasksReady();

        if (readyTasks.success && readyTasks.data.includes(taskId)) {
            return {
                success: true,
                data: {
                    taskId,
                    status: 'ready',
                    statusCode: 20000,
                },
                cost: 0,
            };
        }

        // Task is not ready yet
        return {
            success: true,
            data: {
                taskId,
                status: 'processing',
                statusCode: 20100,
            },
            cost: 0,
        };
    } catch (error: any) {
        console.error(`Check task status error for ${taskId}:`, error);
        return {
            success: false,
            error: error.message || 'Failed to check task status',
        };
    }
}
