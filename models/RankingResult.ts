import mongoose from 'mongoose';

const RankingResultSchema = new mongoose.Schema({
    // Basic Search Parameters
    domain: {
        type: String,
        required: true,
        index: true,
    },
    keyword: {
        type: String,
        required: true,
        index: true,
    },
    location: {
        type: String,
        required: true,
    },
    location_code: {
        type: Number,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    taskId: {
        type: String,
        required: true,
        index: true,
    },

    // Search Filters
    language: {
        type: String,
        default: 'en',
    },
    device: {
        type: String,
        enum: ['desktop', 'mobile'],
        default: 'desktop',
    },
    os: {
        type: String,
        default: 'windows',
    },

    // Metrics
    search_volume: {
        type: Number,
        default: null,
    },
    cpc: {
        type: Number,
        default: null,
    },
    competition: {
        type: Number,
        default: null,
    },

    // Basic Ranking Data (Visible to all users)
    rank: {
        type: Number,
        default: null,
    },
    url: {
        type: String,
        default: null,
    },

    // Comprehensive SERP Data (Admin-only fields)
    // Result Metadata
    se_results_count: {
        type: Number,
        default: 0,
    },
    items_count: {
        type: Number,
        default: 0,
    },
    item_types: [String],

    // Ranking Details
    rank_group: {
        type: Number,
        default: null,
    },
    rank_absolute: {
        type: Number,
        default: null,
    },
    position: {
        type: String,
        default: null,
    },
    page: {
        type: Number,
        default: null,
    },
    depth: {
        type: Number,
        default: null,
    },
    xpath: {
        type: String,
        default: null,
    },

    // Content Analysis
    title: {
        type: String,
        default: null,
    },
    description: {
        type: String,
        default: null,
    },
    breadcrumb: {
        type: String,
        default: null,
    },

    // URL Analysis
    domain_name: {
        type: String,
        default: null,
    },
    relative_url: {
        type: String,
        default: null,
    },
    etv: {
        type: Number,
        default: null,
    },
    impressions_etv: {
        type: Number,
        default: null,
    },
    estimated_paid_traffic_cost: {
        type: Number,
        default: null,
    },

    // SERP Features
    is_featured_snippet: {
        type: Boolean,
        default: false,
    },
    is_malicious: {
        type: Boolean,
        default: false,
    },
    is_web_story: {
        type: Boolean,
        default: false,
    },
    amp_version: {
        type: Boolean,
        default: false,
    },

    // Rich Snippets
    rating: {
        rating_type: String,
        value: Number,
        votes_count: Number,
        rating_max: Number,
    },

    // Highlighted Text
    highlighted: [String],

    // Links
    links: [{
        type: { type: String },
        title: String,
        description: String,
        url: String,
    }],

    // FAQ Schema
    faq: [{
        type: { type: String },
        title: String,
        description: String,
    }],

    // Extended Snippets
    extended_snippet: {
        type: String,
        default: null,
    },

    // Images
    images: [{
        type: { type: String },
        alt: String,
        url: String,
    }],

    // Competitor Analysis
    top_domains: [String],
    top_rankers: [{
        rank: Number,
        rank_absolute: Number,
        page: Number,
        domain: String,
        url: String,
        title: String,
        description: String,
        breadcrumb: String,
        etv: Number,
        is_featured_snippet: Boolean,
        is_malicious: Boolean,
        is_web_story: Boolean,
        amp_version: Boolean,
    }],

    // SERP Metrics
    check_url: {
        type: String,
        default: null,
    },
    serp_item_types: [String],

    // Spell Check
    spell: {
        keyword: String,
        type: { type: String },
    },

    // AI Overview
    ai_overview: [{
        type: { type: String },
        asynchronous_ai_overview: Boolean,
        items: [{
            title: String,
            url: String,
            domain: String,
            description: String,
        }],
        references: [{
            title: String,
            url: String,
            domain: String,
            source: String,
        }]
    }],

    // Refinement Chips
    refinement_chips: [String],

    // Related Searches
    related_searches: [String],

    // People Also Ask
    people_also_ask: [{
        type: { type: String },
        title: String,
        expanded_element: [{
            type: { type: String },
            title: String,
            url: String,
            domain: String,
            description: String,
        }],
    }],
    isAiOverview: { type: Boolean, default: false },
    isPeopleAlsoAsk: { type: Boolean, default: false },

    // Search Intent
    search_intent: {
        label: String,
        probability: Number,
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound index for caching
RankingResultSchema.index({
    domain: 1,
    keyword: 1,
    location: 1,
    language: 1,
    device: 1,
    os: 1,
});

export default mongoose.models.RankingResult || mongoose.model('RankingResult', RankingResultSchema);
