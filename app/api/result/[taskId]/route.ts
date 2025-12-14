import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import MasterSERP from '@/models/MasterSERP';
import RankingResult from '@/models/RankingResult';
import { verifyToken } from '@/lib/jwt';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        await dbConnect();

        const { taskId } = await params;

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

        // Try to get from MasterSERP first (new data)
        const masterResult = await MasterSERP.findOne({
            taskId: taskId
        });

        if (masterResult) {
            // Return the 'data' field which contains the raw DataForSEO response
            return NextResponse.json(masterResult.data);
        }

        // If not in MasterSERP, try to fetch fresh from DataForSEO
        try {
            // Import dynamically to avoid circular dependencies if any
            const { getTaskResult } = await import('@/services/dataforseo/task-get');
            const apiResponse = await getTaskResult(taskId);
            console.log(JSON.stringify(apiResponse, null, 5));

            if (apiResponse.success && apiResponse.data) {
                const liveResult = apiResponse.data;

                // Save complete data to MasterSERP
                const items = liveResult.items || [];
                const itemTypes = items.map((i: any) => i.type);

                await MasterSERP.create({
                    taskId: taskId,
                    data: liveResult,
                    // Metadata available from raw result
                    keyword: liveResult.keyword,
                    isAiOverview: itemTypes.includes('ai_overview'),
                    isPeopleAlsoAsk: itemTypes.includes('people_also_ask'),
                    // Domain/Ranks unknown in this generic context
                    domain: null,
                    ranks: null
                });

                return NextResponse.json(liveResult);
            }
        } catch (err) {
            // If DataForSEO fetch fails, fall back to local RankingResult
            console.warn(`Failed to fetch live result for ${taskId}, falling back to local DB:`, err);
        }

        // Fallback to RankingResult for backward compatibility (old data)
        const rankingResult = await RankingResult.findOne({
            taskId: taskId,
            userId: payload.userId,
        });

        if (!rankingResult) {
            return NextResponse.json({ error: 'Result not found' }, { status: 404 });
        }

        // Transform RankingResult to match expected structure
        // Build a synthetic response that matches DataForSEO structure
        const syntheticResponse = {
            keyword: rankingResult.keyword,
            language_code: rankingResult.language,
            location_code: rankingResult.location_code,
            se_results_count: rankingResult.se_results_count,
            items_count: rankingResult.items_count,
            check_url: rankingResult.check_url,
            items: [
                // Add AI Overview if exists
                ...(rankingResult.ai_overview && rankingResult.ai_overview.length > 0
                    ? rankingResult.ai_overview
                    : []),
                // Add organic results
                ...(rankingResult.top_rankers || []).map((ranker: any) => ({
                    type: 'organic',
                    rank_group: ranker.rank,
                    rank_absolute: ranker.rank_absolute,
                    domain: ranker.domain,
                    url: ranker.url,
                    title: ranker.title,
                    description: ranker.description,
                    breadcrumb: ranker.breadcrumb,
                    etv: ranker.etv,
                    is_featured_snippet: ranker.is_featured_snippet,
                    is_malicious: ranker.is_malicious,
                    is_web_story: ranker.is_web_story,
                    amp_version: ranker.amp_version,
                })),
                // Add People Also Ask if exists
                ...(rankingResult.people_also_ask && rankingResult.people_also_ask.length > 0
                    ? [{
                        type: 'people_also_ask',
                        items: rankingResult.people_also_ask
                    }]
                    : [])
            ]
        };

        return NextResponse.json(syntheticResponse);

    } catch (error: any) {
        console.error('Get result error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
