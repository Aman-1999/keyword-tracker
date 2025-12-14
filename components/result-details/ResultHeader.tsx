import { ArrowLeft, Globe, Layout, Calendar, ExternalLink, Clock } from 'lucide-react';
import Link from 'next/link';

interface ResultHeaderProps {
    historyId: string;
    keyword: string;
    domain: string;
    rank: number | null;
    language_code: string;
    location_code: number;
    location_name?: string;
    device?: string;
    os?: string;
    check_url: string;
    se_results_count: number;
    datetime: string;
    volume?: number;
    cpc?: number;
    competition?: number;
    landingUrl?: string;
    metaTitle?: string;
    metaDescription?: string;
    featureCounts?: { [key: string]: number };
}

// Helper function to scroll to section
const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// Map feature types to section IDs and friendly names
const featureMap: { [key: string]: { id: string; label: string } } = {
    'organic': { id: 'organic-results', label: 'Organic' },
    'ai_overview': { id: 'ai-overview', label: 'AI Overview' },
    'people_also_ask': { id: 'people-also-ask', label: 'People Also Ask' },
    'local_pack': { id: 'local-pack', label: 'Local Pack' },
    'knowledge_graph': { id: 'knowledge-graph', label: 'Knowledge Graph' },
    'google_reviews': { id: 'google-reviews', label: 'Google Reviews' },
    'related_searches': { id: 'related-searches', label: 'Related Searches' },
    'refinement_chips': { id: 'refinement-chips', label: 'Refinement Chips' }
};

export default function ResultHeader({
    historyId,
    keyword,
    domain,
    rank,
    language_code,
    location_code,
    location_name,
    device,
    os,
    check_url,
    se_results_count,
    datetime,
    volume,
    cpc,
    competition,
    landingUrl,
    metaTitle,
    metaDescription,
    featureCounts
}: ResultHeaderProps) {
    // Format datetime with time
    const formattedDateTime = new Date(datetime).toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    return (
        <div className="space-y-4">
            <Link
                href={`/results/${historyId}`}
                className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Results
            </Link>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                    <div>
                        {/* Domain Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-3 border border-indigo-100">
                            <Globe className="w-3 h-3" />
                            {domain}
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 capitalize">
                            {keyword}
                        </h1>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            {/* View Live SERP Link */}
                            <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(keyword)}&gl=${location_code}&hl=${language_code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                View Live SERP
                            </a>

                            <span className="flex items-center gap-1">
                                <Globe className="w-4 h-4 text-gray-400" />
                                <span>
                                    <span className="uppercase font-medium text-gray-700">{language_code}</span>
                                    <span className="mx-1 text-gray-300">|</span>
                                    {location_name || `Location ${location_code}`}
                                </span>
                            </span>

                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-gray-400" />
                                {formattedDateTime}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[320px] max-w-md">
                        {/* Rank & Landing Page Info */}
                        <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-1">Current Rank</p>
                                    <div className={`text-4xl font-extrabold ${rank ? 'text-indigo-600' : 'text-gray-400'}`}>
                                        {rank ? `#${rank}` : '-'}
                                    </div>
                                    {!rank && <p className="text-xs text-gray-400 mt-1">Not found in top 100</p>}
                                </div>
                                {rank && (
                                    <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <Layout className="w-5 h-5 text-indigo-600" />
                                    </div>
                                )}
                            </div>

                            {landingUrl && (
                                <div className="pt-3 border-t border-indigo-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                                        <ExternalLink className="w-3 h-3" /> Ranked URL
                                    </p>
                                    <a href={landingUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:underline break-all block leading-snug">
                                        {landingUrl}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {featureCounts && Object.keys(featureCounts).length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">SERP Features Found</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(featureCounts)
                                .filter(([type, count]) => count > 0)
                                .sort((a, b) => b[1] - a[1])
                                .map(([type, count]) => {
                                    const feature = featureMap[type] || { id: type, label: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') };
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => scrollToSection(feature.id)}
                                            className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm hover:bg-indigo-50 hover:border-indigo-200 transition-colors cursor-pointer"
                                        >
                                            <span className="text-gray-600 font-medium mr-2">{feature.label}</span>
                                            <span className="bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md text-xs">{count}</span>
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
