// Utility functions for DataForSEO services

import { SERPItem, BasicRankingData, ComprehensiveRankingData, StopCrawlOnMatch } from './types';

/**
 * Extract basic SERP data for regular users
 */
export function extractBasicSERPData(item: SERPItem): BasicRankingData {
    return {
        rank: item.rank_group || null,
        url: item.url || null,
        title: item.title || null,
        description: item.description || null,
    };
}

/**
 * Extract comprehensive SERP data for admin users
 */
export function extractComprehensiveSERPData(item: SERPItem): ComprehensiveRankingData {
    const basicData = extractBasicSERPData(item);

    return {
        ...basicData,
        rank_absolute: item.rank_absolute || null,
        position: item.position || null,
        xpath: item.xpath || null,
        domain_name: item.domain || null,
        relative_url: item.url ? new URL(item.url).pathname : null,
        etv: (item as any).etv || null,
        impressions_etv: (item as any).impressions_etv || null,
        estimated_paid_traffic_cost: (item as any).estimated_paid_traffic_cost || null,
        is_featured_snippet: item.is_featured_snippet || false,
        is_malicious: item.is_malicious || false,
        is_web_story: item.is_web_story || false,
        amp_version: item.amp_version || false,
        rating: item.rating,
        highlighted: item.highlighted || [],
        extended_snippet: item.extended_snippet || null,
        check_url: (item as any).check_url || null,
        links: item.links,
        faq: item.faq?.items,
        images: (item as any).images,
    };
}

/**
 * Clean and format domain name
 */
export function formatDomain(domain: string): string {
    return domain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
}

/**
 * Build stop_crawl_on_match parameter
 */
export function buildStopCrawlOnMatch(domain: string, matchType: 'with_subdomains' | 'exact_match' = 'with_subdomains'): StopCrawlOnMatch[] {
    const cleanDomain = formatDomain(domain);
    return [{
        match_value: cleanDomain,
        match_type: matchType,
    }];
}

/**
 * Calculate estimated credit cost for API calls
 * Based on DataForSEO pricing as of 2024
 */
export function calculateEstimatedCost(
    apiType: 'live_regular' | 'live_advanced' | 'task_post',
    options: {
        depth?: number;
        priority?: 1 | 2;
        taskCount?: number;
    } = {}
): number {
    const { depth = 20, priority = 1, taskCount = 1 } = options;

    switch (apiType) {
        case 'live_regular':
            // Live regular: ~$0.0006 per request
            return 0.0006 * taskCount;

        case 'live_advanced':
            // Live advanced: ~$0.002 per request
            return 0.002 * taskCount;

        case 'task_post':
            // Task post: ~$0.0006 for standard priority, ~$0.0012 for high priority
            const baseCost = priority === 2 ? 0.0012 : 0.0006;

            // Additional cost for depth > 100
            const depthMultiplier = depth > 100 ? Math.ceil(depth / 100) : 1;

            return baseCost * depthMultiplier * taskCount;

        default:
            return 0;
    }
}

/**
 * Find domain ranking in SERP items
 */
export function findDomainRanking(items: SERPItem[], targetDomain: string): SERPItem | null {
    const cleanTarget = formatDomain(targetDomain);

    for (const item of items) {
        if (item.type === 'organic' && item.domain) {
            const itemDomain = formatDomain(item.domain);
            if (itemDomain === cleanTarget || itemDomain.includes(cleanTarget)) {
                return item;
            }
        }
    }

    return null;
}

/**
 * Extract top rankers from SERP items
 */
export function extractTopRankers(items: SERPItem[], count: number = 3): Array<{
    rank: number;
    domain: string;
    url: string;
    title: string;
    description: string | null;
}> {
    return items
        .filter(item => item.type === 'organic')
        .slice(0, count)
        .map(item => ({
            rank: item.rank_group,
            domain: item.domain,
            url: item.url,
            title: item.title,
            description: item.description || null,
        }));
}

/**
 * Validate location code
 */
export function isValidLocationCode(locationCode: number): boolean {
    return locationCode > 0 && Number.isInteger(locationCode);
}

/**
 * Validate language code
 */
export function isValidLanguageCode(languageCode: string): boolean {
    // Basic validation - should be 2-letter ISO code
    return /^[a-z]{2}$/.test(languageCode);
}

/**
 * Parse DataForSEO error code to user-friendly message
 */
export function parseErrorMessage(statusCode: number, statusMessage: string): string {
    const errorMap: Record<number, string> = {
        40101: 'Authentication failed. Please check your API credentials.',
        40102: 'Insufficient funds. Please add credits to your account.',
        40103: 'Invalid request parameters.',
        40401: 'Resource not found.',
        50001: 'Internal server error. Please try again later.',
    };

    return errorMap[statusCode] || statusMessage || 'An unknown error occurred';
}
