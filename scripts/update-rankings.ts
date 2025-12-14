import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Import Models directly to avoid TS path alias issues in standalone script if paths not mapped
// Using relative paths assuming script is in /scripts
// Note: We need to define schema inline or import. Attempting import first.
// If typical next.js ts-node setup isn't perfect, relative imports might fail if they use @/. 
// I will try to use relative imports to models.

import RankingResult from '../models/RankingResult';
import MasterSERP from '../models/MasterSERP';
import { getTaskResult } from '../lib/dataForSeoTaskPost';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

// Re-implement dbConnect for script
async function connectDB() {
    if (mongoose.connection.readyState >= 1) return;
    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log('📦 Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

async function updateRankings() {
    await connectDB();

    try {
        console.log('🔄 Starting RankingResult update using Advanced DataForSEO API...');

        // Find all records (or you can filter { isAiOverview: { $exists: false } })
        const results = await RankingResult.find({});
        console.log(`Found ${results.length} ranking results to check.`);

        let updatedCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (const result of results) {
            const { taskId, domain } = result;
            console.log(`\nProcessing Task: ${taskId} for domain: ${domain}`);

            try {
                // 1. Try to get data (this calls the /advanced endpoint)
                // Note: getTaskResult throws if valid result not found
                let apiData = null;

                // Optional: Check MasterSERP first to save API credits?
                // User said "using the advanced dataforseo api". 
                // But if MasterSERP has it, it IS the data from API.
                // Re-fetching from API is safer to ensure we get "Advanced" if MasterSERP was "Regular".
                // But if task is old, API might fail.

                try {
                    apiData = await getTaskResult(taskId);
                    console.log('   ✅ Fetched fresh Advanced data from API');

                    // Update MasterSERP with this fresh data
                    await MasterSERP.findOneAndUpdate(
                        { taskId: taskId },
                        {
                            data: apiData,
                            taskId: taskId,
                            keyword: apiData.keyword,
                            // Add metadata to MasterSERP too
                            isAiOverview: (apiData.items || []).some((i: any) => i.type === 'ai_overview'),
                            isPeopleAlsoAsk: (apiData.items || []).some((i: any) => i.type === 'people_also_ask')
                        },
                        { upsert: true, new: true }
                    );

                } catch (apiErr: any) {
                    console.warn(`   ⚠️ API fetch failed (${apiErr.message}). Checking MasterSERP fallback...`);
                    const masterRecord = await MasterSERP.findOne({ taskId });
                    if (masterRecord) {
                        apiData = masterRecord.data;
                        console.log('   ✅ Loaded data from MasterSERP');
                    } else {
                        console.error('   ❌ No data available/recoverable for this task.');
                        errorCount++;
                        continue;
                    }
                }

                if (!apiData) continue;

                // 2. Process Data
                const items = apiData.items || [];
                const itemTypes = items.map((i: any) => i.type);

                const isAiOverview = itemTypes.includes('ai_overview');
                const isPeopleAlsoAsk = itemTypes.includes('people_also_ask');

                // Extract AI Overview Data
                const aiOverviewData = items
                    .filter((item: any) => item.type === 'ai_overview')
                    .map((item: any) => ({
                        type: item.type,
                        asynchronous_ai_overview: item.asynchronous_ai_overview,
                        items: item.items?.map((i: any) => ({
                            title: i.title,
                            url: i.url,
                            domain: i.domain,
                            description: i.description
                        })) || [],
                        references: item.references?.map((r: any) => ({
                            title: r.title,
                            url: r.url,
                            domain: r.domain,
                            source: r.source
                        })) || []
                    }));

                // Extract PAA Data
                const paaData = items
                    .filter((item: any) => item.type === 'people_also_ask')
                    .flatMap((item: any) => item.items || [])
                    .map((paa: any) => ({
                        type: paa.type,
                        title: paa.title,
                        expanded_element: paa.expanded_element || []
                    }));

                // Refinement Chips
                const refinementChips = apiData.refinement_chips?.items?.map((i: any) => i.title) || [];

                // Related Searches
                const relatedSearches = items
                    .filter((item: any) => item.type === 'related_searches')
                    .flatMap((item: any) => item.items?.map((i: any) => i.title) || []);

                // Extract top organic results
                const topRankers = items
                    .filter((item: any) => item.type === 'organic')
                    .map((item: any) => ({
                        rank: item.rank_group,
                        rank_absolute: item.rank_absolute,
                        page: item.page,
                        domain: item.domain,
                        url: item.url,
                        title: item.title,
                        description: item.description,
                        breadcrumb: item.breadcrumb,
                        etv: item.etv,
                        is_featured_snippet: item.is_featured_snippet || false,
                        is_malicious: item.is_malicious || false,
                        is_web_story: item.is_web_story || false,
                        amp_version: item.amp_version || false,
                    }));

                // 3. Update RankingResult
                // We use updateOne to set specific fields without overwriting everything blindly
                await RankingResult.updateOne(
                    { _id: result._id },
                    {
                        $set: {
                            // Boolean Flags
                            isAiOverview,
                            isPeopleAlsoAsk,

                            // Rich Data Arrays
                            ai_overview: aiOverviewData,
                            people_also_ask: paaData,
                            refinement_chips: refinementChips,
                            related_searches: relatedSearches,
                            top_rankers: topRankers,

                            // Update counts/types just in case
                            item_types: itemTypes,
                            serp_item_types: itemTypes,
                            se_results_count: apiData.se_results_count,
                            items_count: apiData.items_count,
                        }
                    }
                );

                console.log('   ✨ Database updated successfully');
                updatedCount++;

                // Delay to be nice to API rate limits
                await new Promise(r => setTimeout(r, 200));

            } catch (err: any) {
                console.error(`   ❌ Unexpected error processing task ${taskId}:`, err.message);
                errorCount++;
            }
        }

        console.log('\n--- Update Complete ---');
        console.log(`Updated: ${updatedCount}`);
        console.log(`Errors:  ${errorCount}`);
        console.log(`Skipped: ${skippedCount}`);

    } catch (error) {
        console.error('Fatal script error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from DB');
        process.exit(0);
    }
}

// Execute
updateRankings();
