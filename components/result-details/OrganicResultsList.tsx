import { TrendingUp, Globe, ExternalLink, Star } from 'lucide-react';

interface OrganicResultsListProps {
    items: any[];
}

export default function OrganicResultsList({ items }: OrganicResultsListProps) {
    // Take only top 10 results
    const topResults = items.slice(0, 10);

    return (
        <div id="organic-results" className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden scroll-mt-24">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-gray-900" />
                    </div>
                    <h2 className="font-bold text-gray-900">Top 10 Organic Results</h2>
                </div>
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Top {topResults.length}
                </span>
            </div>

            <div className="divide-y divide-gray-100">
                {topResults.map((item: any, i: number) => (
                    <div key={i} className="p-6 hover:bg-gray-50 transition-colors group">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm">
                                {i + 1}
                            </div>

                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Globe className="h-3 w-3" />
                                    <span>{item.domain}</span>
                                </div>

                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block group-hover:text-indigo-600 transition-colors"
                                >
                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 truncate">
                                        {item.title}
                                    </h3>
                                    <div className="text-green-700 text-sm truncate font-medium mt-0.5 mb-1 flex items-center gap-1">
                                        {item.url}
                                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </a>

                                {/* Rating - Added for Advanced SERP Data */}
                                {item.rating && (
                                    <div className="flex items-center gap-1 mb-1">
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, idx) => (
                                                <Star
                                                    key={idx}
                                                    className={`w-3 h-3 ${idx < Math.round(item.rating.value) ? 'fill-current' : 'text-gray-200'}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-600 font-medium">{item.rating.value}</span>
                                        <span className="text-xs text-gray-400">({item.rating.votes_count})</span>
                                    </div>
                                )}

                                <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                                    {item.description}
                                </p>

                                {/* Metrics if available */}
                                {item.etv > 0 && (
                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                                        <div className="text-xs text-gray-500">
                                            Est. Traffic (ETV): <span className="font-semibold text-gray-900">{item.etv.toFixed(1)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
