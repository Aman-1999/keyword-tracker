import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import DataForSeoTask from '@/models/DataForSeoTask';
import Job from '@/models/Job';
import RankingResult from '@/models/RankingResult';
import { getReadyTasks, getBatchTaskResults } from '@/lib/dataForSeoTaskPost';

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

/**
 * Poll DataForSEO for ready tasks and process results
 */
export async function pollDataForSeoTasks() {
    try {
        await dbConnect();

        // Get ready tasks from DataForSEO
        const readyTasks = await getReadyTasks();

        if (readyTasks.length === 0) {
            console.log('No ready tasks from DataForSEO');
            return;
        }

        console.log(`Found ${readyTasks.length} ready tasks from DataForSEO`);

        // Get task IDs
        const taskIds = readyTasks.map(t => t.taskId);

        // Find corresponding tasks in our database
        const dbTasks = await DataForSeoTask.find({
            taskId: { $in: taskIds },
            status: { $in: ['pending', 'processing'] }
        });

        if (dbTasks.length === 0) {
            console.log('No pending tasks found in database');
            return;
        }

        console.log(`Processing ${dbTasks.length} tasks`);

        // Get results for all ready tasks
        const results = await getBatchTaskResults(taskIds);

        // Process each task
        for (const dbTask of dbTasks) {
            try {
                const taskResult = results.get(dbTask.taskId);

                if (!taskResult) {
                    console.log(`No result found for task ${dbTask.taskId}`);
                    continue;
                }

                // Extract data from result
                const items = taskResult.items || [];
                const cleanDomain = dbTask.domain.replace(/^www\./, '');

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

                // Save to RankingResult
                const rankingResult = await RankingResult.create({
                    userId: (await Job.findById(dbTask.jobId))?.userId,
                    domain: dbTask.domain,
                    keyword: dbTask.keyword,
                    location_code: dbTask.location_code,
                    language: dbTask.filters.language,
                    device: dbTask.filters.device,
                    os: dbTask.filters.os,
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

                // Update DataForSeoTask
                dbTask.status = 'ready';
                dbTask.result = taskResult;
                dbTask.rankingResultId = rankingResult._id as mongoose.Types.ObjectId;
                dbTask.completedAt = new Date();
                await dbTask.save();

                // Update Job progress
                const job = await Job.findById(dbTask.jobId);
                if (job) {
                    job.progress.completed += 1;
                    job.results.push(rankingResult._id as mongoose.Types.ObjectId);
                    job.updatedAt = new Date();

                    // Check if job is complete
                    if (job.progress.completed >= job.progress.total) {
                        job.status = 'completed';
                        job.completedAt = new Date();
                    }

                    await job.save();
                    console.log(`Job ${job._id}: ${job.progress.completed}/${job.progress.total} completed`);
                }

            } catch (error) {
                console.error(`Error processing task ${dbTask.taskId}:`, error);

                // Mark task as failed
                dbTask.status = 'failed';
                dbTask.error = error instanceof Error ? error.message : 'Unknown error';
                await dbTask.save();

                // Update job failed count
                const job = await Job.findById(dbTask.jobId);
                if (job) {
                    job.progress.failed += 1;
                    await job.save();
                }
            }
        }

        console.log('Polling complete');
    } catch (error) {
        console.error('Error polling DataForSEO tasks:', error);
    }
}
