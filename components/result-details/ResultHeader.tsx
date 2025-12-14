import { ArrowLeft, Globe, Layout, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface ResultHeaderProps {
    historyId: string;
    keyword: string;
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

export default function ResultHeader({
    historyId,
    keyword,
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 capitalize">
                            {keyword}
                        </h1>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Layout className="w-4 h-4 text-gray-400" />
                                {check_url ? (
                                    <a
                                        href={check_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 transition-colors"
                                    >
                                        View Live SERP
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                ) : (
                                    'Search'
                                )}
                            </span>
                            <span className="flex items-center gap-1">
                                <Globe className="w-4 h-4 text-gray-400" />
                                <span>
                                    <span className="uppercase font-medium text-gray-700">{language_code}</span>
                                    <span className="mx-1 text-gray-300">|</span>
                                    {location_name || location_code}
                                </span>
                            </span>
                            {device && (
                                <span className="flex items-center gap-1">
                                    <Layout className="w-4 h-4 text-gray-400" />
                                    <span className="capitalize">{device}</span>
                                </span>
                            )}
                            {os && (
                                <span className="flex items-center gap-1">
                                    <Layout className="w-4 h-4 text-gray-400" />
                                    <span className="capitalize">{os}</span>
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {new Date(datetime).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[320px] max-w-md">
                        {/* Landing Page Info */}
                        {landingUrl ? (
                            <div className="bg-indigo-50/80 rounded-xl p-4 border border-indigo-100">
                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" /> Ranked URL
                                </p>
                                <div className="space-y-2">
                                    <a href={landingUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 hover:underline break-all block leading-snug">
                                        {landingUrl}
                                    </a>
                                    {(metaTitle || metaDescription) && (
                                        <div className="pt-2 border-t border-indigo-200/50">
                                            {metaTitle && <div className="text-xs font-bold text-gray-800 line-clamp-1 mb-0.5">{metaTitle}</div>}
                                            {metaDescription && <div className="text-[10px] sm:text-xs text-gray-600 line-clamp-2 leading-relaxed">{metaDescription}</div>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Results</p>
                                <div className="text-2xl font-bold text-gray-900">
                                    {se_results_count ? (se_results_count / 1000000).toFixed(1) + 'M' : '-'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {featureCounts && Object.keys(featureCounts).length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">SERP Features Found</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(featureCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                                <div key={type} className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-sm">
                                    <span className="text-gray-600 font-medium mr-2">{type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                                    <span className="bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md text-xs">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
