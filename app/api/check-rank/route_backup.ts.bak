import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import RankingResult from '@/models/RankingResult';
import SearchHistory from '@/models/SearchHistory';
import { verifyToken } from '@/lib/jwt';

// Helper function to extract basic SERP data for regular mode
function extractBasicSERPData(item: any) {
    return {
        rank: item.rank_group || null,
        url: item.url || null,
        title: item.title || null,
        description: item.description || null,
    };
}

export async function POST(request: Request) {
    try {
        await dbConnect();

        // Get user from token using Next.js cookies
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            console.error('Check rank (regular) error: No authentication token found');
            return NextResponse.json(
                { error: 'Authentication required. Please log in to continue.' },
                { status: 401 }
            );
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.userId) {
            console.error('Check rank (regular) error: Invalid or expired token');
            return NextResponse.json(
                { error: 'Invalid or expired session. Please log in again.' },
                { status: 401 }
            );
        }

        const userId = payload.userId;

        const {
            domain,
            location,
            location_code,
            location_name,
            keywords,
            filters,
        } = await request.json();

        // Validation
        if (!domain) {
            return NextResponse.json(
                { error: 'Domain is required.' },
                { status: 400 }
            );
        }

        if (!keywords || !Array.isArray(keywords)) {
            return NextResponse.json(
                { error: 'Keywords must be provided as an array.' },
                { status: 400 }
            );
        }

        if (keywords.length === 0) {
            return NextResponse.json(
                { error: 'At least one keyword is required.' },
                { status: 400 }
            );
        }

        // Default filters
        const searchFilters = {
            language: filters?.language || 'en',
            device: filters?.device || 'desktop',
            os: filters?.os || 'windows',
        };

        // Regular mode: fixed depth of 20 for faster results
        const regularParams = {
            depth: 20,
            max_crawl_pages: 1,
            stop_crawl_on_match: true, // Stop when found for efficiency
        };

        // Use provided location_code or default to US (2840)
        const finalLocationCode = location_code || (location_name ? null : 2840);

        // Save Search History with userId
        await SearchHistory.create({
            userId,
            domain,
            location: location_name || location || 'Unknown',
            location_code: finalLocationCode || 0,
            keywords,
            filters: searchFilters,
        });

        const results = [];
        const toFetch = [];

        // 1. Check Cache
        for (const keyword of keywords) {
            const query: any = {
                domain,
                keyword,
                language: searchFilters.language,
                device: searchFilters.device,
                os: searchFilters.os,
            };

            if (location_name) {
                query.location = location_name;
            } else {
                query.location_code = finalLocationCode;
            }

            const cached = await RankingResult.findOne(query).sort({ createdAt: -1 });

            // Cache valid for 7 days
            const cacheExpiry = 7 * 24 * 60 * 60 * 1000;
            if (cached && (Date.now() - new Date(cached.createdAt).getTime()) < cacheExpiry) {
                results.push({
                    keyword,
                    rank: cached.rank,
                    url: cached.url,
                    title: cached.title,
                    description: cached.description,
                    source: 'cache',
                    message: cached.rank
                        ? `Found at position ${cached.rank}`
                        : `Not found in top ${regularParams.depth} results`,
                });
            } else {
                toFetch.push(keyword);
            }
        }

        // 2. Fetch from API
        if (toFetch.length > 0) {
            const apiResults = await fetchRankingsFromAPI(
                domain,
                finalLocationCode,
                location_name,
                toFetch,
                searchFilters,
                regularParams
            );

            for (const result of apiResults) {
                // Save basic data to database with userId
                const savedResult = await RankingResult.create({
                    userId,
                    domain,
                    keyword: result.keyword,
                    location: location_name || location || 'Unknown',
                    location_code: finalLocationCode || 0,
                    language: searchFilters.language,
                    device: searchFilters.device,
                    os: searchFilters.os,
                    rank: result.data.rank,
                    url: result.data.url,
                    title: result.data.title,
                    description: result.data.description,
                });

                results.push({
                    keyword: result.keyword,
                    rank: result.data.rank,
                    url: result.data.url,
                    title: result.data.title,
                    description: result.data.description,
                    source: 'api',
                    message: result.message,
                });
            }
        }

        return NextResponse.json({
            success: true,
            mode: 'regular',
            results,
        });
    } catch (error: any) {
        console.error('Check rank (regular) error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

async function fetchRankingsFromAPI(
    domain: string,
    locationCode: number | null,
    locationName: string | null,
    keywords: string[],
    filters: any,
    params: any
) {
    const cleanDomain = domain.replace(/^www\./, '');
    const results = [];

    for (const keyword of keywords) {
        try {
            const postData: any = {
                language_code: filters.language,
                keyword: keyword,
                device: filters.device,
                os: filters.os,
                depth: params.depth,
                max_crawl_pages: params.max_crawl_pages,
            };

            if (locationName) {
                postData.location_name = locationName;
            } else if (locationCode) {
                postData.location_code = locationCode;
            }

            // Add stop_crawl_on_match for efficiency
            if (params.stop_crawl_on_match) {
                postData.stop_crawl_on_match = [
                    {
                        match_value: cleanDomain,
                        match_type: "with_subdomains"
                    }
                ];
            }

            const response = await fetch(
                'https://api.dataforseo.com/v3/serp/google/organic/live/advanced',
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

                // Find our domain's ranking
                let foundRank = null;
                let foundUrl = null;
                let basicData = {
                    rank: null,
                    url: null,
                    title: null,
                    description: null,
                };

                for (const item of items) {
                    if (item.type === 'organic' && item.domain) {
                        const itemDomain = item.domain.replace(/^www\./, '');
                        if (itemDomain === cleanDomain || itemDomain.includes(cleanDomain)) {
                            foundRank = item.rank_group;
                            foundUrl = item.url;
                            basicData = extractBasicSERPData(item);
                            break;
                        }
                    }
                }

                results.push({
                    keyword,
                    data: basicData,
                    message: foundRank
                        ? `Found at position ${foundRank}`
                        : `Not found in top ${params.depth} results`,
                });
            } else {
                results.push({
                    keyword,
                    data: { rank: null, url: null, title: null, description: null },
                    message: 'No results from API',
                });
            }
        } catch (error: any) {
            console.error(`Error fetching ranking for keyword "${keyword}":`, error);
            results.push({
                keyword,
                data: { rank: null, url: null, title: null, description: null },
                message: `Error: ${error.message}`,
            });
        }
    }

    return results;
}
