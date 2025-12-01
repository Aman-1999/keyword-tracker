'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Clock, Globe, MapPin, Search, Loader2, Monitor, Smartphone,
    Laptop, RefreshCw, Filter, Calendar, TrendingUp
} from 'lucide-react';

interface HistoryItem {
    domain: string;
    lastLocation: string;
    lastLocationCode: number;
    keywords: string[];
    lastSearched: string;
}

export default function HistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, today, week, month

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/user/history');
                const data = await res.json();
                if (data.history) {
                    setHistory(data.history);
                }
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const handleRerun = (item: HistoryItem) => {
        // Navigate to dashboard with pre-filled data
        const params = new URLSearchParams({
            domain: item.domain,
            location: item.lastLocation || '',
            locationCode: item.lastLocationCode?.toString() || '',
            keywords: item.keywords.join(', '),
        });
        router.push(`/dashboard?${params.toString()}`);
    };

    const getFilteredHistory = () => {
        if (filter === 'all') return history;

        const now = new Date();
        const filtered = history.filter(item => {
            const date = new Date(item.lastSearched);
            const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

            if (filter === 'today') return diffDays === 0;
            if (filter === 'week') return diffDays <= 7;
            if (filter === 'month') return diffDays <= 30;
            return true;
        });

        return filtered;
    };

    const filteredHistory = getFilteredHistory();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
            </div>

            <main className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
                <div className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6">
                        <ArrowLeft size={18} />
                        <span>Back to Dashboard</span>
                    </Link>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                            <Clock size={24} />
                        </div>
                        <h1 className="text-3xl font-bold">Search History</h1>
                    </div>

                    {/* Filters */}
                    <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <Filter className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-300">Filter:</span>
                            {['all', 'today', 'week', 'month'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                            <span className="ml-auto text-sm text-slate-400">
                                {filteredHistory.length} {filteredHistory.length === 1 ? 'result' : 'results'}
                            </span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-indigo-400" size={32} />
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5">
                        <Clock className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-300 mb-2">No search history found</h3>
                        <p className="text-slate-400 mb-6">
                            {filter === 'all'
                                ? 'Start checking rankings to build your search history'
                                : `No searches found in the selected time period`}
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                        >
                            <Search size={16} />
                            Start New Search
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredHistory.map((item, index) => (
                            <div key={index} className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all group">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                    <div className="space-y-4 flex-1">
                                        {/* Domain */}
                                        <div className="flex items-center gap-3">
                                            <Globe size={20} className="text-indigo-400" />
                                            <h3 className="text-xl font-bold text-slate-200 group-hover:text-white transition-colors">
                                                {item.domain}
                                            </h3>
                                        </div>

                                        {/* Details */}
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <MapPin size={14} className="text-purple-400" />
                                                <span>{item.lastLocation}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <TrendingUp size={14} className="text-green-400" />
                                                <span>{item.keywords.length} {item.keywords.length === 1 ? 'keyword' : 'keywords'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Calendar size={14} className="text-blue-400" />
                                                <span>{formatDate(item.lastSearched)}</span>
                                            </div>
                                        </div>

                                        {/* Keywords */}
                                        <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                                Keywords
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {item.keywords.slice(0, 8).map((keyword, idx) => (
                                                    <span key={idx} className="px-2 py-1 rounded-md bg-slate-700/50 border border-white/5 text-sm text-slate-300">
                                                        {keyword}
                                                    </span>
                                                ))}
                                                {item.keywords.length > 8 && (
                                                    <span className="px-2 py-1 rounded-md bg-indigo-600/20 border border-indigo-500/30 text-sm text-indigo-300 font-medium">
                                                        +{item.keywords.length - 8} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Re-run Button */}
                                    <button
                                        onClick={() => handleRerun(item)}
                                        className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-indigo-500/50"
                                    >
                                        <RefreshCw size={16} />
                                        Re-run
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
