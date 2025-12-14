import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import SearchHistory from '@/models/SearchHistory';
import RankingResult from '@/models/RankingResult';
import MasterSERP from '@/models/MasterSERP';
import { verifyToken } from '@/lib/jwt';
import { getBatchTaskResults } from '@/services/dataforseo';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const { id: historyId } = await params;

        // Get user from token
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch history item
        const history = await SearchHistory.findOne({
            _id: historyId,
            userId: payload.userId,
        });

        if (!history) {
            return NextResponse.json({ error: 'History not found' }, { status: 404 });
        }

        if (!history.taskIds || history.taskIds.length === 0) {
            return NextResponse.json({
                success: true,
                status: 'completed',
                results: []
            });
        }

        // 1. Check Database for existing results
        const existingResults = await RankingResult.find({
            taskId: { $in: history.taskIds }
        });

        const existingTaskIds = new Set(existingResults.map((r: any) => r.taskId));
        const missingTaskIds = history.taskIds.filter(id => !existingTaskIds.has(id));

        const resultsMap = new Map();

        // Add existing results to map
        for (const result of existingResults) {
            resultsMap.set(result.taskId, {
                taskId: result.taskId,
                keyword: result.keyword,
                rank: result.rank,
                rank_group: result.rank_group,
                rank_absolute: result.rank_absolute,
                position: result.position,
                page: result.page,
                url: result.url,
                title: result.title,
                description: result.description,
                breadcrumb: result.breadcrumb,
                etv: result.etv,
                xpath: result.xpath,
                search_volume: result.search_volume,
                cpc: result.cpc,
                competition: result.competition,
                se_results_count: result.se_results_count,
                items_count: result.items_count,
                item_types: result.item_types,
                serp_item_types: result.serp_item_types,
                check_url: result.check_url,
                ai_overview: result.ai_overview,
                isAiOverview: result.isAiOverview ?? (result.item_types || []).includes('ai_overview'),
                isPeopleAlsoAsk: result.isPeopleAlsoAsk ?? (result.item_types || []).includes('people_also_ask'),
                is_featured_snippet: result.is_featured_snippet,
                is_malicious: result.is_malicious,
                is_web_story: result.is_web_story,
                amp_version: result.amp_version,
                highlighted: result.highlighted,
                links: result.links,
                faq: result.faq,
                extended_snippet: result.extended_snippet,
                top_rankers: result.top_rankers,
                related_searches: result.related_searches,
                people_also_ask: result.people_also_ask,
                refinement_chips: result.refinement_chips,
                featureCounts: {
                    paa: result.people_also_ask?.length || 0,
                    aiOverview: result.ai_overview?.length || 0,
                    relatedSearches: result.related_searches?.length || 0,
                    refinementChips: result.refinement_chips?.length || 0,
                    topRankers: result.top_rankers?.length || 0
                },

                status: 'completed'
            });
        }
        if (missingTaskIds.length > 0) {
            const masterRecords = await MasterSERP.find({
                taskId: { $in: missingTaskIds }
            });

            const foundInMaster = new Map();
            masterRecords.forEach((record: any) => {
                foundInMaster.set(record.taskId, record.data);
            });
            const trulyMissingTaskIds = missingTaskIds.filter(id => !foundInMaster.has(id));

            const finalResultsMap = new Map();
            for (const [taskId, data] of foundInMaster.entries()) {
                finalResultsMap.set(taskId, data);
            }

            // Fetch from DataForSEO if still missing
            if (trulyMissingTaskIds.length > 0) {
                const taskResults = await getBatchTaskResults(trulyMissingTaskIds);
                if (taskResults.success) {
                    const fetchedMap = taskResults.data;
                    for (const [taskId, data] of fetchedMap.entries()) {
                        finalResultsMap.set(taskId, data);
                        try {
                            const items = data.items || [];
                            const itemTypes = items.map((i: any) => i.type);
                            const cleanDomain = history.domain.replace(/^www\./, '').toLowerCase();
                            const userItem = items.find((i: any) =>
                                i.type === 'organic' &&
                                i.domain &&
                                i.domain.toLowerCase().includes(cleanDomain)
                            );

                            await MasterSERP.create({
                                taskId: taskId,
                                data: data,
                                domain: history.domain,
                                keyword: data.keyword,
                                isAiOverview: itemTypes.includes('ai_overview'),
                                isPeopleAlsoAsk: itemTypes.includes('people_also_ask'),
                                ranks: userItem ? {
                                    rank_group: userItem.rank_group,
                                    rank_absolute: userItem.rank_absolute,
                                    position: userItem.position,
                                    url: userItem.url
                                } : null
                            });
                        } catch (err) {
                            console.error(`Failed to save to MasterSERP for ${taskId}:`, err);
                        }

                        // SAVE RAW RESPONSE TO TEMP JSON FILE FOR DEBUGGING
                        try {
                            const tempDir = path.join(process.cwd(), 'temp');
                            if (!fs.existsSync(tempDir)) {
                                fs.mkdirSync(tempDir, { recursive: true });
                            }
                            const filename = `task_get_${taskId}_${Date.now()}.json`;
                            const filepath = path.join(tempDir, filename);
                            fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
                            console.log(`✅ Saved raw API response to: ${filepath}`);
                        } catch (fileErr) {
                            console.error(`Failed to save JSON file for ${taskId}:`, fileErr);
                        }
                    }
                } else {
                    console.error('Batch fetch failed:', taskResults.error);
                }
            }


            // 3. Save new results to RankingResult (Summary Persistence) & Build Response
            // Process ALL results that were just found (either from MasterSERP or DataForSEO)
            for (const taskId of missingTaskIds) {
                // The data might be in finalResultsMap (from MasterSERP or API)
                // or it might failed.
                const result = finalResultsMap.get(taskId);
                if (!result) continue;

                // ... (Proceed with existing RankingResult saving logic)

                // Extract data for saving
                const items = result.items || [];
                const cleanDomain = history.domain.replace(/^www\./, '').toLowerCase();

                // Find user's domain ranking
                let userDomainItem = null;
                for (const item of items) {
                    if (item.type === 'organic' && item.domain) {
                        const itemDomain = item.domain.replace(/^www\./, '').toLowerCase();
                        // Check if domains match (either exact or one contains the other)
                        if (itemDomain === cleanDomain ||
                            itemDomain.includes(cleanDomain) ||
                            cleanDomain.includes(itemDomain)) {
                            userDomainItem = item;
                            console.log(`Found user's domain: ${item.domain} at rank ${item.rank_group}`);
                            break;
                        }
                    }
                }
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

                // Extract AI Overview
                const aiOverview = items
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

                // Extract all item types from SERP
                const itemTypes = [...new Set(items.map((item: any) => item.type))];

                // Extract related searches
                const relatedSearches = items
                    .filter((item: any) => item.type === 'related_searches')
                    .flatMap((item: any) => item.items?.map((i: any) => i.title) || []);

                // Extract people also ask
                const peopleAlsoAsk = items
                    .filter((item: any) => item.type === 'people_also_ask')
                    .flatMap((item: any) => item.items || [])
                    .map((paa: any) => ({
                        type: paa.type,
                        title: paa.title,
                        expanded_element: paa.expanded_element || []
                    }));

                // Save to DB with comprehensive data
                try {
                    const isAiOverview = itemTypes.includes('ai_overview');
                    const isPeopleAlsoAsk = itemTypes.includes('people_also_ask');

                    await RankingResult.create({
                        // Basic Search Parameters
                        domain: history.domain,
                        keyword: result.keyword,
                        location: history.location,
                        location_code: history.location_code,
                        userId: payload.userId,
                        taskId: taskId,
                        language: history.filters?.language || 'en',
                        device: history.filters?.device || 'desktop',
                        os: history.filters?.os || 'windows',

                        // Enhanced Boolean Flags
                        isAiOverview,
                        isPeopleAlsoAsk,

                        // Keyword Metrics
                        search_volume: result.keyword_info?.search_volume,
                        cpc: result.keyword_info?.cpc,
                        competition: result.keyword_info?.competition,

                        // User's Domain Ranking (if found)
                        rank: userDomainItem?.rank_group || null,
                        rank_group: userDomainItem?.rank_group || null,
                        rank_absolute: userDomainItem?.rank_absolute || null,
                        position: userDomainItem?.position || null,
                        page: userDomainItem?.page || null,
                        url: userDomainItem?.url || null,
                        title: userDomainItem?.title || null,
                        description: userDomainItem?.description || null,
                        breadcrumb: userDomainItem?.breadcrumb || null,
                        etv: userDomainItem?.etv || null,
                        xpath: userDomainItem?.xpath || null,
                        se_results_count: result.se_results_count || 0,
                        items_count: result.items_count || 0,
                        item_types: itemTypes,
                        serp_item_types: itemTypes,
                        check_url: result.check_url || null,
                        ai_overview: aiOverview,
                        is_featured_snippet: userDomainItem?.is_featured_snippet || false,
                        is_malicious: userDomainItem?.is_malicious || false,
                        is_web_story: userDomainItem?.is_web_story || false,
                        amp_version: userDomainItem?.amp_version || false,
                        highlighted: userDomainItem?.highlighted || [],
                        links: userDomainItem?.links || [],
                        faq: userDomainItem?.faq?.items || [],
                        extended_snippet: userDomainItem?.extended_snippet || null,
                        top_rankers: topRankers,
                        related_searches: relatedSearches,
                        people_also_ask: peopleAlsoAsk,
                        refinement_chips: result.refinement_chips?.items?.map((i: any) => i.title) || [],
                    });
                } catch (err) {
                    console.error(`Failed to save result for task ${taskId}:`, err);
                }

                // Add to results map for response
                resultsMap.set(taskId, {
                    taskId,
                    keyword: result.keyword,
                    rank: userDomainItem?.rank_group || null,
                    rank_group: userDomainItem?.rank_group || null,
                    rank_absolute: userDomainItem?.rank_absolute || null,
                    position: userDomainItem?.position || null,
                    page: userDomainItem?.page || null,
                    url: userDomainItem?.url || null,
                    title: userDomainItem?.title || null,
                    description: userDomainItem?.description || null,
                    breadcrumb: userDomainItem?.breadcrumb || null,
                    etv: userDomainItem?.etv || null,
                    xpath: userDomainItem?.xpath || null,
                    search_volume: result.keyword_info?.search_volume,
                    cpc: result.keyword_info?.cpc,
                    competition: result.keyword_info?.competition,
                    se_results_count: result.se_results_count || 0,
                    items_count: result.items_count || 0,
                    item_types: itemTypes,
                    serp_item_types: itemTypes,
                    check_url: result.check_url || null,
                    ai_overview: aiOverview,
                    isAiOverview: itemTypes.includes('ai_overview'),
                    isPeopleAlsoAsk: itemTypes.includes('people_also_ask'),
                    serpItemTypes: itemTypes,
                    featureCounts: {
                        paa: peopleAlsoAsk.length,
                        aiOverview: aiOverview.length,
                        relatedSearches: relatedSearches.length,
                        refinementChips: result.refinement_chips?.items?.length || 0,
                        topRankers: topRankers.length
                    },
                    is_featured_snippet: userDomainItem?.is_featured_snippet || false,
                    is_malicious: userDomainItem?.is_malicious || false,
                    is_web_story: userDomainItem?.is_web_story || false,
                    amp_version: userDomainItem?.amp_version || false,
                    highlighted: userDomainItem?.highlighted || [],
                    links: userDomainItem?.links || [],
                    faq: userDomainItem?.faq?.items || [],
                    extended_snippet: userDomainItem?.extended_snippet || null,

                    // ALL Organic Results (competitors + user's domain)
                    top_rankers: topRankers,

                    // Related Content
                    related_searches: relatedSearches,
                    people_also_ask: peopleAlsoAsk,
                    refinement_chips: result.refinement_chips?.items?.map((i: any) => i.title) || [],

                    status: 'completed'
                });
            }
        }

        const processedResults = [];
        let pendingCount = 0;

        // Process final list
        for (const taskId of history.taskIds) {
            const result = resultsMap.get(taskId);

            if (!result) {
                pendingCount++;
                continue;
            }
            processedResults.push(result);
        }

        // Determine overall status
        const status = pendingCount > 0 ? 'processing' : 'completed';
        const progress = {
            total: history.taskIds.length,
            completed: history.taskIds.length - pendingCount,
            pending: pendingCount
        };

        return NextResponse.json({
            success: true,
            status,
            progress,
            domain: history.domain,
            location: history.location,
            createdAt: history.createdAt,
            results: processedResults
        });

    } catch (error: any) {
        console.error('Get results error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
