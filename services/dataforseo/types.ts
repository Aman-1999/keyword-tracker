// TypeScript types for DataForSEO API

export interface DataForSEOCredentials {
    login: string;
    password: string;
}

export interface DataForSEOResponse<T = any> {
    version: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    tasks_count: number;
    tasks_error: number;
    tasks: DataForSEOTask<T>[];
}

export interface DataForSEOTask<T = any> {
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: any;
    result: T[];
}

export interface DataForSEOError {
    error_code: number;
    error_message: string;
}

// Live Regular/Advanced Request
export interface LiveSERPRequest {
    keyword: string;
    location_name?: string;
    location_code?: number;
    language_code?: string;
    language_name?: string;
    device?: 'desktop' | 'mobile' | 'tablet';
    os?: string; // Changed from strict union to string for flexibility
    depth?: number;
    max_crawl_pages?: number;
    search_param?: string;
    calculate_rectangles?: boolean;
    browser_screen_width?: number;
    browser_screen_height?: number;
    browser_screen_resolution_ratio?: number;
    stop_crawl_on_match?: StopCrawlOnMatch[];
}

export interface StopCrawlOnMatch {
    match_value: string;
    match_type: 'with_subdomains' | 'exact_match';
}

// Task Post Request
export interface TaskPostRequest {
    keyword: string;
    location_name?: string;
    location_code?: number;
    language_code?: string;
    language_name?: string;
    device?: 'desktop' | 'mobile' | 'tablet';
    os?: string;
    depth?: number;
    priority?: 1 | 2; // 1 = standard, 2 = high
    tag?: string;
    postback_url?: string;
    pingback_url?: string;
    stop_crawl_on_match?: StopCrawlOnMatch[];
}

// SERP Result Types
export interface SERPResult {
    keyword: string;
    type: string;
    se_domain: string;
    location_code: number;
    language_code: string;
    check_url: string;
    datetime: string;
    spell: any;
    refinement_chips: any;
    item_types: string[];
    se_results_count: number;
    items_count: number;
    items: SERPItem[];
    keyword_info?: {
        search_volume?: number;
        cpc?: number;
        competition?: number;
        [key: string]: any;
    };
}

export interface SERPItem {
    type: string;
    rank_group: number;
    rank_absolute: number;
    position: string;
    xpath: string;
    domain: string;
    title: string;
    url: string;
    page?: number;
    breadcrumb?: string;
    is_image?: boolean;
    is_video?: boolean;
    is_featured_snippet?: boolean;
    is_malicious?: boolean;
    is_web_story?: boolean;
    description?: string;
    pre_snippet?: string;
    extended_snippet?: string;
    amp_version?: boolean;
    rating?: Rating;
    highlighted?: string[];
    links?: Link[];
    faq?: FAQ;
    extended_people_also_search?: any[];
    about_this_result?: any;
    related_result?: any[];
    timestamp?: string;
    rectangle?: any;
    etv?: number;
    estimated_traffic?: number;
}

export interface Rating {
    rating_type: string;
    value: number;
    votes_count: number;
    rating_max: number;
}

export interface Link {
    type: string;
    title: string;
    description?: string;
    url: string;
    domain?: string;
}

export interface FAQ {
    type: string;
    items: FAQItem[];
}

export interface FAQItem {
    type: string;
    title: string;
    description: string;
}

// Basic ranking data (for regular users)
export interface BasicRankingData {
    rank: number | null;
    url: string | null;
    title: string | null;
    description: string | null;
}

// Comprehensive ranking data (for admin users)
export interface ComprehensiveRankingData extends BasicRankingData {
    rank_absolute: number | null;
    position: string | null;
    xpath: string | null;
    domain_name: string | null;
    relative_url: string | null;
    etv: number | null;
    impressions_etv: number | null;
    estimated_paid_traffic_cost: number | null;
    is_featured_snippet: boolean;
    is_malicious: boolean;
    is_web_story: boolean;
    amp_version: boolean;
    rating?: Rating;
    highlighted: string[];
    extended_snippet: string | null;
    check_url: string | null;
    links?: Link[];
    faq?: FAQItem[];
    images?: any[];
}

// Credit tracking
export interface CreditUsageData {
    userId: string;
    apiEndpoint: string;
    creditsUsed: number;
    requestParams: any;
    responseStatus: number;
    timestamp: Date;
}

// Task submission types
export interface TaskSubmission {
    keyword: string;
    domain: string;
    location_code: number;
    language_code: string;
    device: string;
    os: string;
    depth?: number;
}

export interface SubmittedTask {
    taskId: string;
    keyword: string;
    statusCode: number;
    cost: number;
}

export interface TaskResult {
    taskId: string;
    keyword: string;
    result: SERPResult | null;
}

// API Response helpers
export type APIResult<T> = {
    success: true;
    data: T;
    cost: number;
} | {
    success: false;
    error: string;
    errorCode?: number;
};
