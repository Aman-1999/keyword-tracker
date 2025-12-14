'use client';

import Link from 'next/link';
import { ArrowRight, ExternalLink, Globe, Layout, Search, BarChart3, TrendingUp } from 'lucide-react';
import { useParams } from 'next/navigation';

interface DetailedResultsProps {
    results: any[];
}

export default function DetailedResultsTable({ results }: DetailedResultsProps) {
    const params = useParams();
    const historyId = params.id as string;

    if (!results || results.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16">
                                #
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Keyword
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-32">
                                Rank
                            </th>
                            <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-20" title="AI Overview Items">
                                AI
                            </th>
                            <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-20" title="People Also Ask Items">
                                PAA
                            </th>
                            <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-24">
                                !
                            </th>
                            <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-20" title="Related Searches">
                                Related
                            </th>
                            <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-20" title="Refinement Chips">
                                Chips
                            </th>
                            <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-32">
                                Total Results
                            </th>
                            <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-32">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {results.map((result, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                                    {idx + 1}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                            {result.keyword}
                                        </span>
                                        {result.url && (
                                            <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600 truncate max-w-[300px] flex items-center gap-1 mt-0.5">
                                                {result.url}
                                                <ExternalLink className="h-2.5 w-2.5" />
                                            </a>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {result.rank_group ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            #{result.rank_group}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-400">-</span>
                                    )}
                                </td>

                                {/* Counts */}
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">
                                    {result.featureCounts?.aiOverview ? result.featureCounts.aiOverview : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">
                                    {result.featureCounts?.paa ? result.featureCounts.paa : '-'}
                                </td>

                                {/* Icons Column */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1.5">
                                        {result.isAiOverview && (
                                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600" title="AI Overview">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
                                            </div>
                                        )}
                                        {result.isPeopleAlsoAsk && (
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600" title="People Also Ask">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                                            </div>
                                        )}
                                        {result.is_featured_snippet && (
                                            <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600" title="Featured Snippet">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                                            </div>
                                        )}
                                    </div>
                                </td>

                                {/* Related & Chips Counts */}
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">
                                    {result.featureCounts?.relatedSearches ? result.featureCounts.relatedSearches : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">
                                    {result.featureCounts?.refinementChips ? result.featureCounts.refinementChips : '-'}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <span className="text-sm font-medium text-gray-700">
                                        {result.se_results_count ? (result.se_results_count / 1000000).toFixed(1) + 'M' : '-'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <Link
                                        href={`/results/${historyId}/details/${result.taskId}`}
                                        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                                    >
                                        View Details
                                        <ArrowRight className="ml-1 h-4 w-4" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
