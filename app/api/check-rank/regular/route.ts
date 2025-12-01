import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import RankingResult from '@/models/RankingResult';
import SearchHistory from '@/models/SearchHistory';
import { verifyToken } from '@/lib/jwt';

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

export async function POST(request: Request) {
    try {
        await dbConnect();

        // Get user from token
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Authentication required. Please log in to continue.' },
                { status: 401 }
            );
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json(
                { error: 'Invalid or expired session. Please log in again.' },
                { status: 401 }
            );
        }

        const userId = payload.userId;

        // Check user's available tokens
        const User = (await import('@/models/User')).default;
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found.' },
                { status: 404 }
            );
        }

        if (user.requestTokens <= 0) {
            return NextResponse.json(
                {
                    error: 'Insufficient request tokens. Please contact support to purchase more tokens.',
                    tokensRemaining: 0
                },
                { status: 403 }
            );
        }

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

        const finalLocationCode = location_code || (location_name ? null : 2840);

        // Save search history
        await SearchHistory.create({
            userId: new mongoose.Types.ObjectId(userId),
            domain,
            location: location_name || location || 'Unknown',
            location_code: finalLocationCode || 0,
            keywords,
            filters: searchFilters,
        });

        const results = [];
        const cleanDomain = domain.replace(/^www\./, '');

        // Process each keyword with live API
        for (const keyword of keywords) {
            try {
                // Check cache first
                const query: any = {
                    domain,
                    keyword,
                    language: searchFilters.language,
                    device: searchFilters.device,
                    os: searchFilters.os,
                    location_code: finalLocationCode,
                };

                const cached = await RankingResult.findOne(query).sort({ createdAt: -1 });
                const cacheExpiry = 7 * 24 * 60 * 60 * 1000;

                if (cached && (Date.now() - new Date(cached.createdAt).getTime()) < cacheExpiry) {
                    results.push({
                        keyword,
                        rank: cached.rank,
                        url: cached.url,
                        title: cached.title,
                        description: cached.description,
                        source: 'cache',
                    });
                    continue;
                }

                // Fetch from live API
                const postData: any = {
                    language_code: searchFilters.language,
                    keyword: keyword,
                    device: searchFilters.device,
                    os: searchFilters.os,
                    depth: 20,
                    max_crawl_pages: 1,
                    location_code: finalLocationCode,
                };

                postData.stop_crawl_on_match = [{
                    match_value: cleanDomain,
                    match_type: "with_subdomains"
                }];

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

                    // Extract top rankers
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

                    // Extract metrics
                    const metrics = {
                        se_results_count: taskResult.se_results_count,
                        spell: taskResult.spell,
                        refinement_chips: taskResult.refinement_chips?.items?.map((chip: any) => chip.title) || []
                    };

                    // Find our domain
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
                    await RankingResult.create({
                        userId: new mongoose.Types.ObjectId(userId),
                        domain,
                        keyword,
                        location: location_name || location || 'Unknown',
                        location_code: finalLocationCode || 0,
                        language: searchFilters.language,
                        device: searchFilters.device,
                        os: searchFilters.os,
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

                    results.push({
                        keyword,
                        rank: basicData.rank,
                        url: basicData.url,
                        title: basicData.title,
                        description: basicData.description,
                        source: 'api',
                    });
                }
            } catch (error: any) {
                console.error(`Error processing keyword "${keyword}":`, error);
                results.push({
                    keyword,
                    rank: null,
                    url: null,
                    title: null,
                    description: null,
                    source: 'error',
                    error: error.message,
                });
            }
        }

        // Deduct one token from user's account
        user.requestTokens -= 1;
        await user.save();

        console.log(`User ${userId} used 1 token. Remaining: ${user.requestTokens}`);

        return NextResponse.json({
            success: true,
            results,
            tokensRemaining: user.requestTokens,
        });
    } catch (error: any) {
        console.error('Check rank (regular) error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
