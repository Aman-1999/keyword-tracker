import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import SearchHistory from '@/models/SearchHistory';
import RankingResult from '@/models/RankingResult';
import { verifyToken } from '@/lib/jwt';
import { getBatchTaskResults } from '@/services/dataforseo';

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
            console.log(`History not found: ${historyId}`);
            return NextResponse.json({ error: 'History not found' }, { status: 404 });
        }

        if (!history.taskIds || history.taskIds.length === 0) {
            console.log(`History ${historyId} has no taskIds`);
            return NextResponse.json({
                success: true,
                status: 'completed',
                results: []
            });
        }

        console.log(`Fetching results for ${history.taskIds.length} tasks:`, history.taskIds);

        // 1. Check Database for existing results
        const existingResults = await RankingResult.find({
            taskId: { $in: history.taskIds }
        });

        const existingTaskIds = new Set(existingResults.map((r: any) => r.taskId));
        const missingTaskIds = history.taskIds.filter(id => !existingTaskIds.has(id));

        console.log(`Found ${existingResults.length} cached results. Missing ${missingTaskIds.length} tasks.`);

        const resultsMap = new Map();

        // Add existing results to map
        for (const result of existingResults) {
            resultsMap.set(result.taskId, {
                taskId: result.taskId,
                keyword: result.keyword,

                // User's Domain Ranking
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

                // Keyword Metrics
                search_volume: result.search_volume,
                cpc: result.cpc,
                competition: result.competition,

                // SERP Metadata
                se_results_count: result.se_results_count,
                items_count: result.items_count,
                item_types: result.item_types,
                serp_item_types: result.serp_item_types,
                check_url: result.check_url,

                // SERP Features
                is_featured_snippet: result.is_featured_snippet,
                is_malicious: result.is_malicious,
                is_web_story: result.is_web_story,
                amp_version: result.amp_version,

                // Content
                highlighted: result.highlighted,
                links: result.links,
                faq: result.faq,
                extended_snippet: result.extended_snippet,

                // ALL Organic Results (competitors + user's domain)
                top_rankers: result.top_rankers,

                // Related Content
                related_searches: result.related_searches,
                people_also_ask: result.people_also_ask,
                refinement_chips: result.refinement_chips,

                status: 'completed'
            });
        }

        // 2. Fetch missing tasks from DataForSEO
        if (missingTaskIds.length > 0) {
            const taskResults = await getBatchTaskResults(missingTaskIds);
            console.log('Batch fetch results:', JSON.stringify(taskResults, null, 20));
            if (!taskResults.success) {
                console.error('Batch fetch failed for missing tasks:', taskResults.error);
                // If we have some cached results, we might still want to return them?
                // But if the fetch failed, the overall status for those tasks is 'processing' or 'error'.

                // For now, let's just log it. We will handle the missing ones in the loop below.
            } else {
                const fetchedResultsMap = taskResults.data;
                console.log(`Received ${fetchedResultsMap.size} new results from DataForSEO`);

                // 3. Save new results to Database
                for (const taskId of missingTaskIds) {
                    const result = fetchedResultsMap.get(taskId);
                    if (!result) continue;

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

                    if (!userDomainItem) {
                        console.log(`Domain "${history.domain}" not found in SERP results for keyword "${result.keyword}"`);
                    }

                    // Extract top 3 organic results for top_rankers (only store top 3)
                    const topRankers = items
                        .filter((item: any) => item.type === 'organic')
                        .slice(0, 3)  // Only store top 3 rankers
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

                            // SERP Metadata
                            se_results_count: result.se_results_count || 0,
                            items_count: result.items_count || 0,
                            item_types: itemTypes,
                            serp_item_types: itemTypes,
                            check_url: result.check_url || null,

                            // SERP Features (for user's domain if found)
                            is_featured_snippet: userDomainItem?.is_featured_snippet || false,
                            is_malicious: userDomainItem?.is_malicious || false,
                            is_web_story: userDomainItem?.is_web_story || false,
                            amp_version: userDomainItem?.amp_version || false,

                            // Highlighted text (for user's domain if found)
                            highlighted: userDomainItem?.highlighted || [],

                            // Links (for user's domain if found)
                            links: userDomainItem?.links || [],

                            // FAQ (for user's domain if found)
                            faq: userDomainItem?.faq?.items || [],

                            // Extended snippet (for user's domain if found)
                            extended_snippet: userDomainItem?.extended_snippet || null,

                            // ALL Organic Results (competitors + user's domain)
                            top_rankers: topRankers,

                            // Related Searches
                            related_searches: relatedSearches,

                            // People Also Ask
                            people_also_ask: peopleAlsoAsk,

                            // Refinement chips
                            refinement_chips: result.refinement_chips?.items?.map((i: any) => i.title) || [],
                        });
                        console.log(`Saved result for task ${taskId}`);
                    } catch (err) {
                        console.error(`Failed to save result for task ${taskId}:`, err);
                    }

                    // Add to results map for response
                    resultsMap.set(taskId, {
                        taskId,
                        keyword: result.keyword,

                        // User's Domain Ranking
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

                        // Keyword Metrics
                        search_volume: result.keyword_info?.search_volume,
                        cpc: result.keyword_info?.cpc,
                        competition: result.keyword_info?.competition,

                        // SERP Metadata
                        se_results_count: result.se_results_count || 0,
                        items_count: result.items_count || 0,
                        item_types: itemTypes,
                        serp_item_types: itemTypes,
                        check_url: result.check_url || null,

                        // SERP Features
                        is_featured_snippet: userDomainItem?.is_featured_snippet || false,
                        is_malicious: userDomainItem?.is_malicious || false,
                        is_web_story: userDomainItem?.is_web_story || false,
                        amp_version: userDomainItem?.amp_version || false,

                        // Content
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
