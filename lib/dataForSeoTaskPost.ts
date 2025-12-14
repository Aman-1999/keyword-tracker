// DataForSEO Task Post API Helper Functions

const DATAFORSEO_API_BASE = 'https://api.dataforseo.com/v3';
const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

const auth = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');

interface TaskSubmission {
    keyword: string;
    domain: string;
    location_code: number;
    language_code: string;
    device: string;
    os: string;
    depth?: number;
}

interface SubmittedTask {
    taskId: string;
    keyword: string;
    statusCode: number;
}

interface TaskResult {
    taskId: string;
    keyword: string;
    result: any;
}

/**
 * Submit keywords as tasks to DataForSEO
 */
export async function submitDataForSeoTasks(
    tasks: TaskSubmission[]
): Promise<SubmittedTask[]> {
    try {
        // Build request payload
        const payload = tasks.map(task => ({
            keyword: task.keyword,
            location_code: task.location_code,
            language_code: task.language_code,
            device: task.device,
            os: task.os,
            depth: task.depth || 20,
            // Add stop_crawl_on_match for efficiency
            stop_crawl_on_match: [{
                match_value: task.domain.replace(/^www\./, ''),
                match_type: "with_subdomains"
            }]
        }));

        const response = await fetch(
            `${DATAFORSEO_API_BASE}/serp/google/organic/task_post`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            throw new Error(`DataForSEO API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.tasks || data.tasks.length === 0) {
            throw new Error('No tasks returned from DataForSEO');
        }

        // Map response to our format
        const submittedTasks: SubmittedTask[] = data.tasks.map((task: any, index: number) => ({
            taskId: task.id,
            keyword: tasks[index].keyword,
            statusCode: task.status_code,
        }));

        return submittedTasks;
    } catch (error: any) {
        console.error('Error submitting DataForSEO tasks:', error);
        throw error;
    }
}

/**
 * Get ready tasks from DataForSEO
 */
export async function getReadyTasks(): Promise<TaskResult[]> {
    try {
        const response = await fetch(
            `${DATAFORSEO_API_BASE}/serp/google/organic/tasks_ready`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`DataForSEO API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.tasks || data.tasks.length === 0) {
            return [];
        }

        // Return array of ready task IDs
        return data.tasks.map((task: any) => ({
            taskId: task.id,
            keyword: task.data?.keyword || '',
            result: null, // We'll fetch full results separately
        }));
    } catch (error: any) {
        console.error('Error getting ready tasks:', error);
        throw error;
    }
}

/**
 * Get specific task result by ID
 */
export async function getTaskResult(taskId: string): Promise<any> {
    try {
        const response = await fetch(
            `${DATAFORSEO_API_BASE}/serp/google/organic/task_get/advanced/${taskId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`DataForSEO API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.tasks || data.tasks.length === 0 || !data.tasks[0].result) {
            throw new Error('No result found for task');
        }

        return data.tasks[0].result[0];
    } catch (error: any) {
        console.error(`Error getting task result for ${taskId}:`, error);
        throw error;
    }
}

/**
 * Get multiple task results in batch
 */
export async function getBatchTaskResults(taskIds: string[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    // Process in chunks of 10 to avoid overwhelming the API
    const chunkSize = 10;
    for (let i = 0; i < taskIds.length; i += chunkSize) {
        const chunk = taskIds.slice(i, i + chunkSize);

        const promises = chunk.map(async (taskId) => {
            try {
                const result = await getTaskResult(taskId);
                return { taskId, result };
            } catch (error) {
                console.error(`Failed to get result for task ${taskId}:`, error);
                return { taskId, result: null };
            }
        });

        const chunkResults = await Promise.all(promises);

        chunkResults.forEach(({ taskId, result }) => {
            if (result) {
                results.set(taskId, result);
            }
        });

        // Small delay between chunks
        if (i + chunkSize < taskIds.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return results;
}
