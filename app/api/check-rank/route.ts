import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import RankingResult from '@/models/RankingResult';
import SearchHistory from '@/models/SearchHistory';
import { verifyToken } from '@/lib/jwt';

// Helper function to extract comprehensive SERP data
function extractComprehensiveSERPData(item: any, keyword: string, domain: string) {
    const cleanDomain = domain.replace(/^www\./, '');

    const data: any = {
        // Basic fields
        rank: item.rank_group || null,
        url: item.url || null,

        // Comprehensive SERP data
        rank_group: item.rank_group || null,
        rank_absolute: item.rank_absolute || null,
        position: item.position || null,
        xpath: item.xpath || null,

        // Content
        title: item.title || null,
        description: item.description || null,
        breadcrumb: item.breadcrumb || null,

        // URL details
        domain_name: item.domain || null,
        relative_url: item.relative_url || null,
        etv: item.etv || null,
        impressions_etv: item.impressions_etv || null,
        estimated_paid_traffic_cost: item.estimated_paid_traffic_cost || null,

        // SERP features
        is_featured_snippet: item.is_featured_snippet || false,
        is_malicious: item.is_malicious || false,
        is_web_story: item.is_web_story || false,
        amp_version: item.amp_version || false,

        // Highlighted text
        highlighted: item.highlighted || [],

        // Extended snippet
        extended_snippet: item.extended_snippet || null,

        // Check URL
        check_url: item.check_url || null,
    };

    // Only add rating if it exists
    if (item.rating) {
        data.rating = {
            rating_type: item.rating.rating_type,
            value: item.rating.value,
            votes_count: item.rating.votes_count,
            rating_max: item.rating.rating_max,
        };
    }

    // Only add links if they exist
    if (item.links && Array.isArray(item.links)) {
        data.links = item.links.map((link: any) => ({
            type: link.type,
            title: link.title,
            description: link.description,
            url: link.url,
        }));
    }

    // Only add FAQ if it exists
    if (item.faq && item.faq.items && Array.isArray(item.faq.items)) {
        data.faq = item.faq.items.map((faq: any) => ({
            type: faq.type,
            title: faq.title,
            description: faq.description,
        }));
    }

    // Only add images if they exist
    if (item.images && Array.isArray(item.images)) {
        data.images = item.images.map((img: any) => ({
            type: img.type,
            alt: img.alt,
            url: img.url,
        }));
    }

    return data;
}

function filterResultsByRole(results: any[], userRole: string) {
    if (userRole === 'admin') {
        // Admins see everything
        return results;
    }

    // Regular users see only basic fields
    return results.map(result => ({
        keyword: result.keyword,
        rank: result.rank,
        url: result.url,
        title: result.title || null,
        description: result.description || null,
        source: result.source,
        message: result.message,
    }));
}

export async function POST(request: Request) {
    // Advanced API is currently disabled
    return NextResponse.json(
        { error: 'Advanced API is currently disabled. Please use the Regular mode for ranking checks.' },
        { status: 503 }
    );
}
