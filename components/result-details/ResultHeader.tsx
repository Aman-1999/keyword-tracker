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
    datetime
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
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
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

                    <div className="bg-gray-50 rounded-xl p-4 min-w-[140px]">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Results</p>
                        <div className="text-2xl font-bold text-gray-900">
                            {se_results_count ? (se_results_count / 1000000).toFixed(1) + 'M' : '-'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
