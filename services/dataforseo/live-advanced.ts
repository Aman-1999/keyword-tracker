// Live Advanced API Service
// Full SERP data with all features and advanced parameters

import { getDataForSEOClient } from './base';
import { LiveSERPRequest, SERPResult, APIResult } from './types';
import { buildStopCrawlOnMatch, findDomainRanking, extractComprehensiveSERPData } from './utils';

/**
 * Search using Live Advanced API
 * Full SERP data with comprehensive features
 * Cost: ~$0.002 per request (live)
 */
export async function searchLiveAdvanced(
    params: LiveSERPRequest,
    userId?: string
): Promise<APIResult<SERPResult>> {
    try {
        const client = getDataForSEOClient();

        // Build request payload with all advanced parameters
        const payload: any = {
            keyword: params.keyword,
            language_code: params.language_code || 'en',
            device: params.device || 'desktop',
            os: params.os || 'windows',
            depth: params.depth || 100,
            max_crawl_pages: params.max_crawl_pages || 10,
            calculate_rectangles: params.calculate_rectangles || false,
        };

        // Add location
        if (params.location_name) {
            payload.location_name = params.location_name;
        } else if (params.location_code) {
            payload.location_code = params.location_code;
        } else {
            payload.location_code = 2840; // Default to US
        }

        // Add optional parameters
        if (params.search_param) {
            payload.search_param = params.search_param;
        }

        if (params.browser_screen_width) {
            payload.browser_screen_width = params.browser_screen_width;
        }

        if (params.browser_screen_height) {
            payload.browser_screen_height = params.browser_screen_height;
        }

        if (params.browser_screen_resolution_ratio) {
            payload.browser_screen_resolution_ratio = params.browser_screen_resolution_ratio;
        }

        // Add stop_crawl_on_match if provided
        if (params.stop_crawl_on_match) {
            payload.stop_crawl_on_match = params.stop_crawl_on_match;
        }

        // Make API request
        const response = await client.makeRequest<SERPResult>(
            '/serp/google/organic/live/advanced',
            'POST',
            payload,
            userId
        );

        // Extract result
        if (response.tasks && response.tasks[0] && response.tasks[0].result) {
            const result = response.tasks[0].result[0];

            return {
                success: true,
                data: result,
                cost: response.cost,
            };
        }

        return {
            success: false,
            error: 'No results returned from API',
        };
    } catch (error: any) {
        console.error('Live Advanced API error:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch advanced ranking data',
        };
    }
}

/**
 * Search for domain ranking using Live Advanced API
 * Returns comprehensive ranking data for the specified domain
 */
export async function searchDomainRankingAdvanced(
    domain: string,
    keyword: string,
    options: {
        location_code?: number;
        location_name?: string;
        language_code?: string;
        device?: 'desktop' | 'mobile' | 'tablet';
        os?: string;
        depth?: number;
        max_crawl_pages?: number;
        userId?: string;
    } = {}
): Promise<APIResult<{
    keyword: string;
    rankingData: any;
    topRankers: any[];
    metrics: {
        se_results_count: number;
        spell: any;
        refinement_chips: any;
    };
    found: boolean;
}>> {
    try {
        // Build request with stop_crawl_on_match for efficiency
        const request: LiveSERPRequest = {
            keyword,
            location_code: options.location_code,
            location_name: options.location_name,
            language_code: options.language_code || 'en',
            device: options.device || 'desktop',
            os: options.os || 'windows',
            depth: options.depth || 100,
            max_crawl_pages: options.max_crawl_pages || 10,
            stop_crawl_on_match: buildStopCrawlOnMatch(domain),
        };

        const result = await searchLiveAdvanced(request, options.userId);

        if (!result.success) {
            return result as any;
        }

        // Find domain in results
        const items = result.data.items || [];
        const domainItem = findDomainRanking(items, domain);

        // Extract top rankers
        const topRankers = items
            .filter(item => item.type === 'organic')
            .slice(0, 3)
            .map(item => ({
                rank: item.rank_group,
                domain: item.domain,
                url: item.url,
                title: item.title,
                description: item.description,
            }));

        // Extract metrics
        const metrics = {
            se_results_count: result.data.se_results_count || 0,
            spell: result.data.spell,
            refinement_chips: result.data.refinement_chips,
        };

        if (domainItem) {
            const comprehensiveData = extractComprehensiveSERPData(domainItem);
            return {
                success: true,
                data: {
                    keyword,
                    rankingData: comprehensiveData,
                    topRankers,
                    metrics,
                    found: true,
                },
                cost: result.cost,
            };
        }

        // Not found
        return {
            success: true,
            data: {
                keyword,
                rankingData: null,
                topRankers,
                metrics,
                found: false,
            },
            cost: result.cost,
        };
    } catch (error: any) {
        console.error('Advanced domain ranking search error:', error);
        return {
            success: false,
            error: error.message || 'Failed to search domain ranking',
        };
    }
}

/**
 * Get full SERP analysis with all features
 */
export async function getFullSERPAnalysis(
    keyword: string,
    options: {
        location_code?: number;
        location_name?: string;
        language_code?: string;
        device?: 'desktop' | 'mobile' | 'tablet';
        os?: string;
        depth?: number;
        userId?: string;
    } = {}
): Promise<APIResult<{
    keyword: string;
    totalResults: number;
    organicResults: any[];
    featuredSnippets: any[];
    peopleAlsoAsk: any[];
    relatedSearches: any[];
    images: any[];
    videos: any[];
}>> {
    try {
        const result = await searchLiveAdvanced({
            keyword,
            ...options,
            calculate_rectangles: true,
        }, options.userId);

        if (!result.success) {
            return result as any;
        }

        const items = result.data.items || [];

        // Categorize results by type
        const organicResults = items.filter(item => item.type === 'organic');
        const featuredSnippets = items.filter(item => item.is_featured_snippet);
        const peopleAlsoAsk = items.filter(item => item.type === 'people_also_ask');
        const relatedSearches = items.filter(item => item.type === 'related_searches');
        const images = items.filter(item => item.type === 'images');
        const videos = items.filter(item => item.type === 'video');

        return {
            success: true,
            data: {
                keyword,
                totalResults: result.data.se_results_count || 0,
                organicResults,
                featuredSnippets,
                peopleAlsoAsk,
                relatedSearches,
                images,
                videos,
            },
            cost: result.cost,
        };
    } catch (error: any) {
        console.error('Full SERP analysis error:', error);
        return {
            success: false,
            error: error.message || 'Failed to get SERP analysis',
        };
    }
}
