import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import SearchHistory from '@/models/SearchHistory';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: Request) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ history: [], pagination: null });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ history: [], pagination: null });
        }

        const userId = payload.userId;

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const viewMode = searchParams.get('viewMode') || 'grouped';
        const maxLimit = viewMode === 'keywords' ? 500 : 100;
        const limit = Math.min(parseInt(searchParams.get('limit') || searchParams.get('pageSize') || '50'), maxLimit);
        const search = searchParams.get('search') || '';
        const domain = searchParams.get('domain') || '';
        const keyword = searchParams.get('keyword') || '';
        const location = searchParams.get('location') || '';
        const dateFrom = searchParams.get('dateFrom') || '';
        const dateTo = searchParams.get('dateTo') || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Build query
        const query: any = { userId };

        // Search filter (domain or keywords)
        if (search) {
            query.$or = [
                { domain: { $regex: search, $options: 'i' } },
                { keywords: { $elemMatch: { $regex: search, $options: 'i' } } }
            ];
        }

        // Domain filter
        if (domain) {
            query.domain = { $regex: domain, $options: 'i' };
        }

        // Keyword filter
        if (keyword) {
            query.keywords = { $elemMatch: { $regex: keyword, $options: 'i' } };
        }

        // Location filter
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        // Date range filter
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) {
                query.createdAt.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                query.createdAt.$lte = new Date(dateTo);
            }
        }

        // Get total count
        const total = await SearchHistory.countDocuments(query);

        // Calculate pagination
        const skip = (page - 1) * limit;
        const totalPages = Math.ceil(total / limit);

        // Build sort object
        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Fetch history with pagination
        const history = await SearchHistory.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        // Fetch location names and transform data based on viewMode
        const Location = (await import('@/models/Location')).default;
        const MasterSERP = (await import('@/models/MasterSERP')).default;

        let enrichedHistory;

        if (viewMode === 'keywords') {
            // Flatten to keyword-level data with ranking details
            const keywordData = [];
            const RankingResult = (await import('@/models/RankingResult')).default;

            for (const item of history) {
                // Fetch location name
                let locationName = item.location;
                if ((!locationName || locationName === 'Unknown') && item.location_code) {
                    try {
                        const locationDoc = await Location.findOne({ location_code: item.location_code });
                        if (locationDoc) {
                            locationName = locationDoc.location_name;
                        }
                    } catch (err) {
                        console.error('Failed to fetch location for code:', item.location_code, err);
                    }
                }

                // Fetch ranking data for each keyword
                const keywords = item.keywords || [];
                const taskIds = item.taskIds || [];

                for (let i = 0; i < keywords.length; i++) {
                    const keyword = keywords[i];
                    const taskId = taskIds[i];

                    let rankingData: any = {
                        _id: `${item._id}-${i}`,
                        searchId: item._id,
                        domain: item.domain,
                        keyword,
                        location: locationName || 'Unknown',
                        location_code: item.location_code,
                        createdAt: item.createdAt,
                        taskId,
                        rank: null,
                        landingUrl: null,
                        totalResults: null,
                        hasPAA: false,
                        hasAIOverview: false,
                        totalItems: 0,
                        search_volume: null,
                        cpc: null,
                        competition: null,
                        title: null,
                        description: null,
                        metadata: {}
                    };

                    // Try to fetch detailed ranking data from RankingResult
                    try {
                        const resultDoc: any = await RankingResult.findOne({ taskId }).lean();

                        if (resultDoc) {
                            rankingData.rank = resultDoc.rank;
                            rankingData.landingUrl = resultDoc.url;
                            rankingData.totalResults = resultDoc.se_results_count;
                            rankingData.totalItems = resultDoc.items_count;

                            // Metrics
                            rankingData.search_volume = resultDoc.search_volume;
                            rankingData.cpc = resultDoc.cpc;
                            rankingData.competition = resultDoc.competition;

                            // Content
                            rankingData.title = resultDoc.title;
                            rankingData.description = resultDoc.description;

                            // Features
                            const itemTypes = resultDoc.item_types || [];
                            rankingData.hasPAA = resultDoc.isPeopleAlsoAsk ?? ((resultDoc.people_also_ask && resultDoc.people_also_ask.length > 0) || itemTypes.includes('people_also_ask'));
                            rankingData.hasAIOverview = resultDoc.isAiOverview ?? ((resultDoc.ai_overview && resultDoc.ai_overview.length > 0) || itemTypes.includes('ai_overview'));
                            rankingData.serpItemTypes = itemTypes;

                            // Feature Counts & Details
                            rankingData.featureCounts = {
                                paa: resultDoc.people_also_ask?.length || 0,
                                aiOverview: resultDoc.ai_overview?.length || 0,
                                relatedSearches: resultDoc.related_searches?.length || 0,
                                refinementChips: resultDoc.refinement_chips?.length || 0,
                                topRankers: resultDoc.top_rankers?.length || 0
                            };

                            // Extended Data
                            rankingData.refinementChips = resultDoc.refinement_chips || [];
                            rankingData.relatedSearches = resultDoc.related_searches || [];

                            // Additional metadata
                            rankingData.metadata = {
                                language: resultDoc.language,
                                device: resultDoc.device,
                                os: resultDoc.os,
                                checkType: resultDoc.check_url ? 'url' : 'regular'
                            };
                        } else {
                            // Fallback to MasterSERP if RankingResult not found (backward compatibility)
                            const masterData = await MasterSERP.findOne({ taskId }).lean();
                            if (masterData && masterData.data) {
                                const serpData = masterData.data;

                                if (serpData.items && Array.isArray(serpData.items)) {
                                    rankingData.totalItems = serpData.items.length;
                                    rankingData.hasPAA = serpData.items.some((item: any) => item.type === 'people_also_ask');
                                    rankingData.hasAIOverview = serpData.items.some((item: any) => item.type === 'ai_overview');

                                    const domainPattern = item.domain.replace('www.', '').toLowerCase();
                                    const organicResults = serpData.items.filter((item: any) => item.type === 'organic');
                                    const userResult = organicResults.find((result: any) =>
                                        result.url && result.url.toLowerCase().includes(domainPattern)
                                    );

                                    if (userResult) {
                                        rankingData.rank = userResult.rank_absolute || userResult.rank_group;
                                        rankingData.landingUrl = userResult.url;
                                        rankingData.title = userResult.title;
                                        rankingData.description = userResult.description;
                                    }
                                }
                                if (serpData.se_results_count) {
                                    rankingData.totalResults = serpData.se_results_count;
                                }
                                rankingData.metadata = {
                                    language: serpData.language_code,
                                    device: serpData.device,
                                    os: serpData.os,
                                    checkType: serpData.check_url ? 'url' : 'regular'
                                };
                            }
                        }
                    } catch (err) {
                        console.error(`Failed to fetch ranking data for task ${taskId}:`, err);
                    }

                    keywordData.push(rankingData);
                }
            }

            enrichedHistory = keywordData;
        } else {
            // Grouped by search (original format)
            enrichedHistory = await Promise.all(
                history.map(async (item) => {
                    let locationName = item.location;

                    if ((!locationName || locationName === 'Unknown') && item.location_code) {
                        try {
                            const locationDoc = await Location.findOne({ location_code: item.location_code });
                            if (locationDoc) {
                                locationName = locationDoc.location_name;
                            }
                        } catch (err) {
                            console.error('Failed to fetch location for code:', item.location_code, err);
                        }
                    }

                    return {
                        ...item.toObject(),
                        location: locationName || 'Unknown',
                        keywords: item.keywords || []
                    };
                })
            );
        }

        // Build pagination metadata
        const pagination = {
            page,
            limit,
            pageSize: limit, // Alias for limit
            currentPage: page, // Alias for page
            total,
            totalCount: total, // Alias for total
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
            from: skip + 1,
            to: Math.min(skip + limit, total)
        };

        return NextResponse.json({
            history: enrichedHistory,
            pagination,
            viewMode,
            meta: {
                total,
                page,
                limit,
                totalPages
            }
        });

    } catch (error) {
        console.error('Fetch history error:', error);
        return NextResponse.json({ history: [], pagination: null }, { status: 500 });
    }
}
