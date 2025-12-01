import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Job from '@/models/Job';
import RankingResult from '@/models/RankingResult';
import SearchHistory from '@/models/SearchHistory';

// Batch size for processing keywords
const BATCH_SIZE = 50;

// Helper function to extract basic SERP data
function extractBasicSERPData(item: any) {
    return {
        rank: item.rank_group || null,
        rank_absolute: item.rank_absolute || item.rank_group || null,
        page: item.page || 1,
        url: item.url || null,
        title: item.title || null,
        description: item.description || null,
    };
}

// Process a single keyword
async function processKeyword(
    domain: string,
    keyword: string,
    locationCode: number,
    locationName: string,
    filters: any,
    userId: mongoose.Types.ObjectId
): Promise<mongoose.Types.ObjectId | null> {
    try {
        const cleanDomain = domain.replace(/^www\./, '');

        const postData: any = {
            language_code: filters.language,
            keyword: keyword,
            device: filters.device,
            os: filters.os,
            depth: 20,
            max_crawl_pages: 1,
        };

        if (locationCode) {
            postData.location_code = locationCode;
        } else if (locationName) {
            postData.location_name = locationName;
        }

        postData.stop_crawl_on_match = [
            {
                match_value: cleanDomain,
                match_type: "with_subdomains"
            }
        ];

        const response = await fetch(
            'https://api.dataforseo.com/v3/serp/google/organic/live/regular',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(
                        `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
                    ).toString('base64'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([postData]),
            }
        );

        if (!response.ok) {
            throw new Error(`DataForSEO API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.tasks && data.tasks[0] && data.tasks[0].result) {
            const taskResult = data.tasks[0].result[0];
            const items = taskResult.items || [];

            // Extract Top 3 Rankers
            const topRankers = items
                .filter((item: any) => item.type === 'organic')
                .slice(0, 3)
                .map((item: any) => ({
                    rank: item.rank_group,
                    domain: item.domain,
                    url: item.url,
                    title: item.title,
                    description: item.description
                }));

            // Extract Key Metrics
            const metrics = {
                se_results_count: taskResult.se_results_count,
                spell: taskResult.spell,
                refinement_chips: taskResult.refinement_chips?.items?.map((chip: any) => chip.title) || []
            };

            // Find our domain's ranking
            let basicData = {
                rank: null,
                rank_absolute: null,
                page: null,
                url: null,
                title: null,
                description: null,
            };

            for (const item of items) {
                if (item.type === 'organic' && item.domain) {
                    const itemDomain = item.domain.replace(/^www\./, '');
                    if (itemDomain === cleanDomain || itemDomain.includes(cleanDomain)) {
                        basicData = extractBasicSERPData(item);
                        break;
                    }
                }
            }

            // Save to database
            const result = await RankingResult.create({
                userId,
                domain,
                keyword,
                location: locationName,
                location_code: locationCode,
                language: filters.language,
                device: filters.device,
                os: filters.os,
                rank: basicData.rank,
                rank_absolute: basicData.rank_absolute,
                page: basicData.page,
                depth: 20,
                url: basicData.url,
                title: basicData.title,
                description: basicData.description,
                top_rankers: topRankers,
                se_results_count: metrics.se_results_count,
                spell: metrics.spell,
                refinement_chips: metrics.refinement_chips,
            });

            return result._id as mongoose.Types.ObjectId;
        }

        return null;
    } catch (error: any) {
        console.error(`Error processing keyword "${keyword}":`, error);
        throw error;
    }
}

// Process a batch of keywords for a job
async function processBatch(
    job: any,
    keywords: string[],
    startIndex: number
): Promise<{ completed: number; failed: number; resultIds: mongoose.Types.ObjectId[] }> {
    const batch = keywords.slice(startIndex, startIndex + BATCH_SIZE);
    let completed = 0;
    let failed = 0;
    const resultIds: mongoose.Types.ObjectId[] = [];

    for (const keyword of batch) {
        try {
            // Check if job was cancelled
            const currentJob = await Job.findById(job._id);
            if (currentJob?.status === 'cancelled') {
                console.log(`Job ${job._id} was cancelled, stopping processing`);
                break;
            }

            const resultId = await processKeyword(
                job.domain,
                keyword,
                job.location_code,
                job.location,
                job.filters,
                job.userId
            );

            if (resultId) {
                resultIds.push(resultId);
                completed++;
            } else {
                failed++;
            }

            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            failed++;
            console.error(`Failed to process keyword "${keyword}":`, error);
        }
    }

    return { completed, failed, resultIds };
}

// Main job processor
export async function processJob(jobId: string) {
    try {
        await dbConnect();

        const job = await Job.findById(jobId);
        if (!job) {
            console.error(`Job ${jobId} not found`);
            return;
        }

        // Check if job is already being processed or completed
        if (job.status !== 'pending') {
            console.log(`Job ${jobId} is already ${job.status}`);
            return;
        }

        // Update status to processing
        job.status = 'processing';
        await job.save();

        console.log(`Starting to process job ${jobId} with ${job.keywords.length} keywords`);

        // Deduplicate keywords
        const uniqueKeywords: string[] = [...new Set(job.keywords as string[])];
        console.log(`After deduplication: ${uniqueKeywords.length} unique keywords`);

        // Update total count to reflect unique keywords
        job.progress.total = uniqueKeywords.length;
        await job.save();

        // Save search history
        await SearchHistory.create({
            userId: job.userId as mongoose.Types.ObjectId,
            domain: job.domain as string,
            location: job.location as string,
            location_code: job.location_code as number,
            keywords: uniqueKeywords as string[],
            filters: job.filters as { language: string; device: string; os: string },
        });

        // Check cache for existing results
        const keywordsToFetch: string[] = [];
        const cachedResults: mongoose.Types.ObjectId[] = [];
        let cachedCount = 0;

        for (const keyword of uniqueKeywords) {
            const query: any = {
                domain: job.domain,
                keyword,
                language: job.filters.language,
                device: job.filters.device,
                os: job.filters.os,
                location_code: job.location_code,
            };

            const cached = await RankingResult.findOne(query).sort({ createdAt: -1 });

            // Cache valid for 7 days
            const cacheExpiry = 7 * 24 * 60 * 60 * 1000;
            if (cached && (Date.now() - new Date(cached.createdAt).getTime()) < cacheExpiry) {
                cachedResults.push(cached._id as mongoose.Types.ObjectId);
                cachedCount++;
            } else {
                keywordsToFetch.push(keyword);
            }
        }

        // Update progress with cached results
        if (cachedCount > 0) {
            job.progress.completed = cachedCount;
            job.results.push(...cachedResults);
            await job.save();
            console.log(`Job ${jobId}: Found ${cachedCount} cached results`);
        }

        if (keywordsToFetch.length === 0) {
            // All results from cache, mark as completed
            job.status = 'completed';
            job.completedAt = new Date();
            await job.save();
            console.log(`Job ${jobId} completed (all from cache)`);
            return;
        }

        // Submit tasks to DataForSEO task_post API
        console.log(`Submitting ${keywordsToFetch.length} tasks to DataForSEO`);

        const taskSubmissions = keywordsToFetch.map(keyword => ({
            keyword,
            domain: job.domain,
            location_code: job.location_code,
            language_code: job.filters.language,
            device: job.filters.device,
            os: job.filters.os,
            depth: 20,
        }));

        const { submitDataForSeoTasks } = await import('@/lib/dataForSeoTaskPost');
        const submittedTasks = await submitDataForSeoTasks(taskSubmissions);

        console.log(`Received ${submittedTasks.length} task IDs from DataForSEO`);

        // Save tasks to database
        const DataForSeoTask = (await import('@/models/DataForSeoTask')).default;

        for (let i = 0; i < submittedTasks.length; i++) {
            const task = submittedTasks[i];
            const submission = taskSubmissions[i];

            const savedTask = await DataForSeoTask.create({
                taskId: task.taskId,
                jobId: job._id,
                keyword: submission.keyword, // Use keyword from submission
                domain: job.domain,
                location_code: job.location_code,
                filters: job.filters,
                status: 'pending',
            });

            console.log(`Saved task ${task.taskId} for keyword "${submission.keyword}" to database`);
        }

        console.log(`Job ${jobId}: Submitted ${submittedTasks.length} tasks to DataForSEO`);
        console.log(`Job ${jobId}: ${cachedCount} from cache, ${submittedTasks.length} pending from API`);

        // Trigger polling to start checking for results
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dataforseo/poll`, {
            method: 'GET',
        }).catch(error => {
            console.error('Failed to trigger DataForSEO polling:', error);
        });

        console.log(`Job ${jobId} tasks submitted, waiting for results...`);
    } catch (error: any) {
        console.error(`Error processing job ${jobId}:`, error);

        // Mark job as failed
        try {
            await Job.findByIdAndUpdate(jobId, {
                status: 'failed',
                error: error.message,
                updatedAt: new Date(),
            });
        } catch (updateError) {
            console.error(`Failed to update job ${jobId} status:`, updateError);
        }
    }
}

// Poll for pending jobs and process them
export async function pollAndProcessJobs() {
    try {
        await dbConnect();

        // Find one pending job
        const job = await Job.findOne({ status: 'pending' }).sort({ createdAt: 1 });

        if (job) {
            console.log(`Found pending job ${job._id}, starting processing...`);
            // Process asynchronously (don't await)
            processJob(job._id.toString()).catch(error => {
                console.error(`Error in processJob:`, error);
            });
        }

        // Also trigger DataForSEO task polling
        const { pollDataForSeoTasks } = await import('@/lib/pollDataForSeoTasks');
        pollDataForSeoTasks().catch(error => {
            console.error(`Error in pollDataForSeoTasks:`, error);
        });
    } catch (error) {
        console.error('Error polling for jobs:', error);
    }
}
