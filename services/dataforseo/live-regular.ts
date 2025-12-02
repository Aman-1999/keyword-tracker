// Live Regular API Service
// Optimized for speed with limited depth (20 results)

import { getDataForSEOClient } from './base';
import { LiveSERPRequest, SERPResult, APIResult } from './types';
import { buildStopCrawlOnMatch, findDomainRanking, extractBasicSERPData } from './utils';

/**
 * Search using Live Regular API
 * Fast results with basic ranking data
 * Cost: ~$0.0006 per request
 */
export async function searchLiveRegular(
    params: LiveSERPRequest,
    userId?: string
): Promise<APIResult<SERPResult>> {
    try {
        const client = getDataForSEOClient();

        // Build request payload
        const payload: any = {
            keyword: params.keyword,
            language_code: params.language_code || 'en',
            device: params.device || 'desktop',
            os: params.os || 'windows',
            depth: 100, // Fixed for regular mode
            max_crawl_pages: 1,
        };

        if (params.location_code) {
            payload.location_code = params.location_code;
        } else if (params.location_name) {
            payload.location_name = params.location_name;
        } else {
            payload.location_code = 2840; // Default to US
        }

        // Add stop_crawl_on_match if provided
        if (params.stop_crawl_on_match) {
            payload.stop_crawl_on_match = params.stop_crawl_on_match;
        }

        // Make API request
        const response = await client.makeRequest<SERPResult>(
            '/serp/google/organic/live/regular',
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
        console.error('Live Regular API error:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch ranking data',
        };
    }
}

/**
 * Search for domain ranking using Live Regular API
 * Returns basic ranking data for the specified domain
 */
export async function searchDomainRankingRegular(
    domain: string,
    keyword: string,
    options: {
        location_code?: number;
        location_name?: string;
        language_code?: string;
        device?: 'desktop' | 'mobile' | 'tablet';
        os?: string;
        userId?: string;
    } = {}
): Promise<APIResult<{
    keyword: string;
    rank: number | null;
    url: string | null;
    title: string | null;
    description: string | null;
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
            stop_crawl_on_match: buildStopCrawlOnMatch(domain),
        };

        const result = await searchLiveRegular(request, options.userId);

        if (!result.success) {
            return result as any;
        }

        // Find domain in results
        const items = result.data.items || [];
        const domainItem = findDomainRanking(items, domain);

        if (domainItem) {
            const basicData = extractBasicSERPData(domainItem);
            return {
                success: true,
                data: {
                    keyword,
                    ...basicData,
                    found: true,
                },
                cost: result.cost,
            };
        }

        // Not found in top 20
        return {
            success: true,
            data: {
                keyword,
                rank: null,
                url: null,
                title: null,
                description: null,
                found: false,
            },
            cost: result.cost,
        };
    } catch (error: any) {
        console.error('Domain ranking search error:', error);
        return {
            success: false,
            error: error.message || 'Failed to search domain ranking',
        };
    }
}

/**
 * Batch search for multiple keywords using Live Regular API
 */
export async function batchSearchLiveRegular(
    keywords: string[],
    options: {
        location_code?: number;
        location_name?: string;
        language_code?: string;
        device?: 'desktop' | 'mobile' | 'tablet';
        os?: string;
        userId?: string;
    } = {}
): Promise<APIResult<SERPResult[]>> {
    try {
        const results: SERPResult[] = [];
        const errors: string[] = [];

        // Process keywords sequentially to avoid overwhelming the API
        for (const keyword of keywords) {
            const result = await searchLiveRegular({
                keyword,
                ...options,
            }, options.userId);

            if (result.success) {
                results.push(result.data);
            } else {
                errors.push(`${keyword}: ${result.error}`);
            }

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (results.length === 0) {
            return {
                success: false,
                error: `All requests failed: ${errors.join(', ')}`,
            };
        }

        return {
            success: true,
            data: results,
            cost: results.length * 0.0006, // Estimated
        };
    } catch (error: any) {
        console.error('Batch search error:', error);
        return {
            success: false,
            error: error.message || 'Batch search failed',
        };
    }
}
