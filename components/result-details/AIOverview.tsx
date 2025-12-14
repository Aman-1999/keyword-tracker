import { Bot, Info } from 'lucide-react';

interface AIOverviewProps {
    items: any[];
}

export default function AIOverview({ items }: AIOverviewProps) {
    if (!items || items.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden mb-6">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100 flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Bot className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="font-bold text-gray-900">AI Overview</h2>
            </div>

            <div className="p-6 sm:p-8">
                {items.map((overview: any, i: number) => {
                    const isAsync = overview.asynchronous_ai_overview;
                    const hasContent = overview.items && overview.items.length > 0;

                    if (isAsync && !hasContent) {
                        return (
                            <div key={i} className="flex flex-col items-center justify-center py-6 text-center space-y-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Bot className="w-8 h-8 text-indigo-300 animate-pulse" />
                                <div>
                                    <p className="text-gray-900 font-medium">AI Overview is generating</p>
                                    <p className="text-sm text-gray-500">Google is currently processing the AI summary. Please check back later.</p>
                                </div>
                            </div>
                        );
                    }

                    if (!hasContent) return null;

                    return (
                        <div key={i} className="space-y-6">
                            {overview.items?.map((item: any, j: number) => (
                                <div key={j} className="prose prose-indigo max-w-none">
                                    <p className="text-gray-800 text-base leading-relaxed">{item.description}</p>
                                    {item.title && (
                                        <div className="mt-2 text-sm text-indigo-600 font-medium flex items-center gap-1.5 bg-indigo-50/50 w-fit px-3 py-1 rounded-full">
                                            <Info className="w-4 h-4" />
                                            Source: {item.title}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* References if available */}
                            {overview.references && overview.references.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Info className="w-3 h-3" />
                                        Sources & References
                                    </h4>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {overview.references.map((ref: any, k: number) => (
                                            <a
                                                key={k}
                                                href={ref.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm hover:bg-white transition-all group bg-gray-50/50"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-400 group-hover:text-indigo-600 group-hover:border-indigo-100">
                                                    {k + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-700">{ref.title}</p>
                                                    <p className="text-xs text-gray-500 truncate">{ref.domain}</p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
