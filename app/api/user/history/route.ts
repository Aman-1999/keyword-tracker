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
        // Fetch location models
        const Location = (await import('@/models/Location')).default;
        const MasterSERP = (await import('@/models/MasterSERP')).default;

        let enrichedHistory;
        let pagination;

        if (viewMode === 'keywords') {
            // Aggregation Pipeline for Keyword view
            const pipeline: any[] = [
                // 1. Initial Match (Search Filters)
                { $match: query },

                // 2. Project fields needed for unwind
                {
                    $project: {
                        userId: 1,
                        domain: 1,
                        location_code: 1,
                        location: 1,
                        createdAt: 1,
                        keywords: 1,
                        taskIds: 1
                    }
                },

                // 3. Unwind keywords and taskIds in sync
                {
                    $addFields: {
                        results: {
                            $map: {
                                input: { $range: [0, { $size: "$keywords" }] },
                                as: "index",
                                in: {
                                    keyword: { $arrayElemAt: ["$keywords", "$$index"] },
                                    taskId: { $arrayElemAt: ["$taskIds", "$$index"] }
                                }
                            }
                        }
                    }
                },
                { $unwind: "$results" },

                // 4. Flatten structure
                {
                    $addFields: {
                        keyword: "$results.keyword",
                        taskId: "$results.taskId",
                        _parentId: "$_id"
                    }
                },

                // 5. Keyword Filter (if applied)
                ...(keyword ? [{ $match: { keyword: { $regex: keyword, $options: 'i' } } }] : []),
                ...(search ? [{
                    $match: {
                        $or: [
                            { domain: { $regex: search, $options: 'i' } },
                            { keyword: { $regex: search, $options: 'i' } }
                        ]
                    }
                }] : []),

                // 6. Sort
                { $sort: sort },

                // 7. Facet for Pagination & Data
                {
                    $facet: {
                        metadata: [{ $count: "total" }],
                        data: [
                            { $skip: skip },
                            { $limit: limit },

                            // 8. Lookup Ranking Result
                            {
                                $lookup: {
                                    from: "rankingresults",
                                    localField: "taskId",
                                    foreignField: "taskId",
                                    as: "rankingData"
                                }
                            },
                            {
                                $unwind: {
                                    path: "$rankingData",
                                    preserveNullAndEmptyArrays: true
                                }
                            },

                            // 9. Lookup Location
                            {
                                $lookup: {
                                    from: "locations",
                                    localField: "location_code",
                                    foreignField: "location_code",
                                    as: "locationData"
                                }
                            },
                            {
                                $unwind: {
                                    path: "$locationData",
                                    preserveNullAndEmptyArrays: true
                                }
                            },

                            // 10. Format Output
                            {
                                $project: {
                                    _id: { $concat: [{ $toString: "$_parentId" }, "-", { $toString: "$taskId" }] },
                                    searchId: "$_parentId",
                                    domain: 1,
                                    keyword: 1,
                                    location: { $ifNull: ["$locationData.location_name", "$location"] },
                                    location_code: 1,
                                    createdAt: 1,
                                    taskId: 1,

                                    // Ranking Data
                                    rank: "$rankingData.rank",
                                    landingUrl: "$rankingData.url",
                                    totalResults: "$rankingData.se_results_count",
                                    totalItems: "$rankingData.items_count",
                                    search_volume: "$rankingData.search_volume",
                                    cpc: "$rankingData.cpc",
                                    competition: "$rankingData.competition",
                                    title: "$rankingData.title",
                                    description: "$rankingData.description",

                                    // Features logic
                                    hasPAA: {
                                        $or: [
                                            "$rankingData.isPeopleAlsoAsk",
                                            { $gt: [{ $size: { $ifNull: ["$rankingData.people_also_ask", []] } }, 0] }
                                        ]
                                    },
                                    hasAIOverview: {
                                        $or: [
                                            "$rankingData.isAiOverview",
                                            { $gt: [{ $size: { $ifNull: ["$rankingData.ai_overview", []] } }, 0] }
                                        ]
                                    },
                                    featureCounts: {
                                        paa: { $size: { $ifNull: ["$rankingData.people_also_ask", []] } },
                                        aiOverview: { $size: { $ifNull: ["$rankingData.ai_overview", []] } },
                                        relatedSearches: { $size: { $ifNull: ["$rankingData.related_searches", []] } },
                                        refinementChips: { $size: { $ifNull: ["$rankingData.refinement_chips", []] } },
                                        topRankers: { $size: { $ifNull: ["$rankingData.top_rankers", []] } }
                                    },
                                    metadata: {
                                        language: "$rankingData.language",
                                        device: "$rankingData.device",
                                        os: "$rankingData.os",
                                        checkType: { $cond: [{ $ifNull: ["$rankingData.check_url", false] }, 'url', 'regular'] }
                                    }
                                }
                            }
                        ]
                    }
                }
            ];

            const aggregationResult = await SearchHistory.aggregate(pipeline);

            const result = aggregationResult[0];
            const totalKeywords = result.metadata[0]?.total || 0;
            enrichedHistory = result.data;
            const computedTotalPages = Math.ceil(totalKeywords / limit);

            // Build pagination for keywords mode
            pagination = {
                page,
                limit,
                pageSize: limit,
                currentPage: page,
                total: totalKeywords,
                totalCount: totalKeywords,
                totalPages: computedTotalPages,
                hasNext: page < computedTotalPages,
                hasPrev: page > 1,
                from: skip + 1,
                to: Math.min(skip + limit, totalKeywords)
            };

        } else {
            // Grouped by search (original format)
            // Get total count for grouped mode
            const total = await SearchHistory.countDocuments(query);

            // Calculate pagination for grouped mode
            const skip = (page - 1) * limit;
            const totalPages = Math.ceil(total / limit);

            // Fetch history with pagination for grouped mode
            const history = await SearchHistory.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit);

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

            // Build pagination metadata for grouped mode
            pagination = {
                page,
                limit,
                pageSize: limit,
                currentPage: page,
                total,
                totalCount: total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
                from: skip + 1,
                to: Math.min(skip + limit, total)
            };
        }

        return NextResponse.json({
            success: true,
            history: enrichedHistory,
            pagination
        });

    } catch (error: any) {
        console.error('Get user history error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
