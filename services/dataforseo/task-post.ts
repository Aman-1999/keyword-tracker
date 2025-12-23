// Task Post API Service
// Submit tasks for asynchronous processing

import { getDataForSEOClient } from './base';
import { TaskPostRequest, SubmittedTask, APIResult } from './types';
import { buildStopCrawlOnMatch } from './utils';

/**
 * Submit a single task to DataForSEO
 * Cost: ~$0.0006 per task (standard priority)
 */
export async function submitTask(
    params: TaskPostRequest,
    userId?: string
): Promise<APIResult<SubmittedTask>> {
    try {
        const client = getDataForSEOClient();

        // Build request payload
        const payload: any = {
            keyword: params.keyword,
            language_code: params.language_code || 'en',
            device: params.device || 'desktop',
            os: params.os || 'windows',
            depth: params.depth || 20,
            priority: params.priority || 1,
        };

        // Add location
        if (params.location_name) {
            payload.location_name = params.location_name;
        } else if (params.location_code) {
            payload.location_code = params.location_code;
        } else {
            payload.location_code = 2840; // Default to US
        }

        // Add optional parameters
        if (params.tag) {
            payload.tag = params.tag;
        }

        if (params.postback_url) {
            payload.postback_url = params.postback_url;
        }

        if (params.pingback_url) {
            payload.pingback_url = params.pingback_url;
        }

        if (params.stop_crawl_on_match) {
            payload.stop_crawl_on_match = params.stop_crawl_on_match;
        }

        // Make API request
        const response = await client.makeRequest(
            '/serp/google/organic/task_post',
            'POST',
            payload,
            userId
        );

        // Extract task ID
        if (response.tasks && response.tasks[0]) {
            const task = response.tasks[0];

            return {
                success: true,
                data: {
                    taskId: task.id,
                    keyword: params.keyword,
                    statusCode: task.status_code,
                    cost: task.cost,
                },
                cost: response.cost,
            };
        }

        return {
            success: false,
            error: 'No task ID returned from API',
        };
    } catch (error: any) {
        console.error('Task Post API error:', error);
        return {
            success: false,
            error: error.message || 'Failed to submit task',
        };
    }
}

/**
 * Submit multiple tasks in batch
 * More efficient than submitting one at a time
 */
export async function submitBatchTasks(
    tasks: TaskPostRequest[],
    userId?: string
): Promise<APIResult<SubmittedTask[]>> {
    try {
        const client = getDataForSEOClient();
        const BATCH_SIZE = 100;
        const allSubmittedTasks: SubmittedTask[] = [];
        let totalCost = 0;

        // Process in batches
        for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
            const batchTasks = tasks.slice(i, i + BATCH_SIZE);

            // Build batch payload
            const payload = batchTasks.map(task => {
                const item: any = {
                    keyword: task.keyword,
                    language_code: task.language_code || 'en',
                    device: task.device || 'desktop',
                    os: task.os || 'windows',
                    depth: task.depth || 20,
                    priority: task.priority || 1,
                };

                // Add location
                if (task.location_name) {
                    item.location_name = task.location_name;
                } else if (task.location_code) {
                    item.location_code = task.location_code;
                } else {
                    item.location_code = 2840;
                }

                // Add optional parameters
                if (task.tag) item.tag = task.tag;
                if (task.postback_url) item.postback_url = task.postback_url;
                if (task.pingback_url) item.pingback_url = task.pingback_url;
                if (task.stop_crawl_on_match) item.stop_crawl_on_match = task.stop_crawl_on_match;

                return item;
            });

            // Make API request for batch
            const response = await client.makeRequest(
                '/serp/google/organic/task_post',
                'POST',
                payload,
                userId
            );

            // Extract task IDs
            if (response.tasks && response.tasks.length > 0) {
                const batchResults: SubmittedTask[] = response.tasks.map((task, index) => ({
                    taskId: task.id,
                    keyword: batchTasks[index].keyword,
                    statusCode: task.status_code,
                    cost: task.cost,
                }));

                allSubmittedTasks.push(...batchResults);
                if (response.cost) totalCost += response.cost;
            }
        }

        if (allSubmittedTasks.length > 0) {
            return {
                success: true,
                data: allSubmittedTasks,
                cost: totalCost,
            };
        }

        return {
            success: false,
            error: 'No tasks returned from API',
        };
    } catch (error: any) {
        console.error('Batch Task Post API error:', error);
        return {
            success: false,
            error: error.message || 'Failed to submit batch tasks',
        };
    }
}

/**
 * Submit tasks for domain ranking tracking
 * Optimized with stop_crawl_on_match for efficiency
 */
export async function submitDomainRankingTasks(
    domain: string,
    keywords: string[],
    options: {
        location_code?: number;
        location_name?: string;
        language_code?: string;
        device?: 'desktop' | 'mobile' | 'tablet';
        os?: string;
        depth?: number;
        priority?: 1 | 2;
        tag?: string;
        userId?: string;
    } = {}
): Promise<APIResult<SubmittedTask[]>> {
    try {
        const stopCrawlOnMatch = buildStopCrawlOnMatch(domain);

        const tasks: TaskPostRequest[] = keywords.map(keyword => ({
            keyword,
            location_code: options.location_code,
            location_name: options.location_name,
            language_code: options.language_code || 'en',
            device: options.device || 'desktop',
            os: options.os || 'windows',
            depth: options.depth || 100,
            priority: options.priority || 1,
            tag: options.tag,
            stop_crawl_on_match: stopCrawlOnMatch,
        }));

        return await submitBatchTasks(tasks, options.userId);
    } catch (error: any) {
        console.error('Domain ranking tasks submission error:', error);
        return {
            success: false,
            error: error.message || 'Failed to submit domain ranking tasks',
        };
    }
}

/**
 * Get estimated completion time for tasks
 * Based on priority and current queue
 */
export function getEstimatedCompletionTime(priority: 1 | 2, taskCount: number): number {
    // Standard priority: ~2-3 minutes per task
    // High priority: ~30-60 seconds per task
    const timePerTask = priority === 2 ? 45 : 150; // seconds
    return timePerTask * taskCount;
}
