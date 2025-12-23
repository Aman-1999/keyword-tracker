'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import CustomSelect from '@/components/CustomSelect';
import {
    Search, Loader2, ChevronLeft, ChevronRight,
    TrendingUp, TrendingDown, Minus, Sparkles, MessageSquare,
    Target, ArrowUpRight, ArrowDownRight, Clock, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface KeywordItem {
    keyword: string;
    domain: string;
    currentRank: number | null;
    bestRank: number | null;
    avgRank: number | null;
    worstRank: number | null;
    totalChecks: number;
    lastChecked: string;
    firstChecked: string;
    rankChange: number | null;
    trend: 'improving' | 'declining' | 'stable' | 'new';
    hasAiOverview: boolean;
    hasPaa: boolean;
    hasFeaturedSnippet: boolean;
}

interface KeywordDetail {
    keyword: string;
    period: { days: number; startDate: string };
    domains: string[];
    stats: Array<{
        domain: string;
        currentRank: number | null;
        bestRank: number | null;
        avgRank: number | null;
        totalChecks: number;
        lastChecked: string;
        hasAiOverview: boolean;
        hasPaa: boolean;
    }>;
    rankHistory: Record<string, Array<{ date: string; rank: number | null; hasAiOverview: boolean }>>;
    serpFeatureHistory: Array<{ date: string; aiOverviewPercent: number; paaPercent: number }>;
}

interface Summary {
    totalKeywords: number;
    rankedKeywords: number;
    top10: number;
    top20: number;
    improving: number;
    declining: number;
}

const CHART_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function KeywordAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [keywords, setKeywords] = useState<KeywordItem[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    // Filters
    const [search, setSearch] = useState('');
    const [domain, setDomain] = useState('');
    const [rankFilter, setRankFilter] = useState('');
    const [sortBy, setSortBy] = useState('lastChecked');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);

    // Detail view
    const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
    const [keywordDetail, setKeywordDetail] = useState<KeywordDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Available domains
    const [domains, setDomains] = useState<string[]>([]);

    useEffect(() => {
        const fetchDomains = async () => {
            try {
                const res = await fetch('/api/v1/analytics/domains?limit=100');
                if (res.ok) {
                    const data = await res.json();
                    setDomains(data.data?.map((d: { domain: string }) => d.domain) || []);
                }
            } catch (err) {
                console.error('Failed to fetch domains:', err);
            }
        };
        fetchDomains();
    }, []);

    const fetchKeywords = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                sortBy,
                sortOrder,
            });
            if (domain) params.append('domain', domain);
            if (rankFilter) params.append('rankFilter', rankFilter);

            const res = await fetch(`/api/v1/analytics/keywords?${params}`);
            if (res.ok) {
                const data = await res.json();
                setKeywords(data.data || []);
                setSummary(data.meta?.summary || null);
                setPagination({
                    page: data.pagination?.page || 1,
                    totalPages: data.pagination?.totalPages || 1,
                    total: data.pagination?.total || 0,
                });
            }
        } catch (err) {
            console.error('Failed to fetch keywords:', err);
        } finally {
            setLoading(false);
        }
    }, [page, domain, rankFilter, sortBy, sortOrder]);

    useEffect(() => {
        fetchKeywords();
    }, [fetchKeywords]);

    const fetchKeywordDetail = async (kw: string, dom?: string) => {
        setDetailLoading(true);
        try {
            const params = new URLSearchParams({ keyword: kw, days: '30' });
            if (dom) params.append('domain', dom);

            const res = await fetch(`/api/v1/analytics/keywords?${params}`);
            if (res.ok) {
                const data = await res.json();
                setKeywordDetail(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch keyword detail:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleKeywordClick = (kw: KeywordItem) => {
        setSelectedKeyword(kw.keyword);
        fetchKeywordDetail(kw.keyword, kw.domain);
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
            case 'new': return <Sparkles className="h-4 w-4 text-blue-500" />;
            default: return <Minus className="h-4 w-4 text-gray-400" />;
        }
    };

    const getTrendBadge = (trend: string) => {
        const styles: Record<string, string> = {
            improving: 'bg-green-50 text-green-700',
            declining: 'bg-red-50 text-red-700',
            new: 'bg-blue-50 text-blue-700',
            stable: 'bg-gray-50 text-gray-600',
        };
        return styles[trend] || styles.stable;
    };

    const filteredKeywords = keywords.filter(k =>
        k.keyword.toLowerCase().includes(search.toLowerCase())
    );

    // Prepare chart data for detail view
    const chartData = keywordDetail?.rankHistory
        ? Object.entries(keywordDetail.rankHistory).length > 0
            ? (() => {
                const allDates = new Set<string>();
                Object.values(keywordDetail.rankHistory).forEach(history => {
                    history.forEach(h => allDates.add(h.date));
                });
                const sortedDates = Array.from(allDates).sort();
                return sortedDates.map(date => {
                    const point: Record<string, unknown> = { date };
                    Object.entries(keywordDetail.rankHistory).forEach(([dom, history]) => {
                        const entry = history.find(h => h.date === date);
                        point[dom] = entry?.rank || null;
                    });
                    return point;
                });
            })()
            : []
        : [];

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/analytics" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-2">
                        <ChevronLeft size={16} /> Back to Analytics
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Target className="h-7 w-7 text-indigo-600" />
                        Keyword Analytics
                    </h1>
                    <p className="text-gray-500 mt-1">Track and analyze performance across all your keywords</p>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase">Total</p>
                            <p className="text-xl font-bold text-gray-900">{summary.totalKeywords}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase">Ranked</p>
                            <p className="text-xl font-bold text-indigo-600">{summary.rankedKeywords}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase">Top 10</p>
                            <p className="text-xl font-bold text-green-600">{summary.top10}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase">Top 20</p>
                            <p className="text-xl font-bold text-blue-600">{summary.top20}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
                                <ArrowUpRight size={12} className="text-green-500" /> Improving
                            </p>
                            <p className="text-xl font-bold text-green-600">{summary.improving}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
                                <ArrowDownRight size={12} className="text-red-500" /> Declining
                            </p>
                            <p className="text-xl font-bold text-red-600">{summary.declining}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Keywords List */}
                    <div className="lg:col-span-2">
                        {/* Filters */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                            <div className="flex flex-wrap gap-3 items-end">
                                <div className="flex-1 min-w-[200px] relative">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search keywords..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="min-w-[160px]">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Domain</label>
                                    <CustomSelect
                                        options={[
                                            { value: '', label: 'All Domains' },
                                            ...domains.map(d => ({ value: d, label: d }))
                                        ]}
                                        value={domain}
                                        onChange={(v) => { setDomain(v); setPage(1); }}
                                        placeholder="Select domain"
                                        searchable
                                    />
                                </div>
                                <div className="min-w-[140px]">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Rank Filter</label>
                                    <CustomSelect
                                        options={[
                                            { value: '', label: 'All Ranks' },
                                            { value: 'top10', label: 'Top 10' },
                                            { value: 'top20', label: 'Top 20' },
                                            { value: 'top50', label: 'Top 50' },
                                            { value: 'top100', label: 'Top 100' },
                                            { value: 'notRanked', label: 'Not Ranked' },
                                        ]}
                                        value={rankFilter}
                                        onChange={(v) => { setRankFilter(v); setPage(1); }}
                                        placeholder="Select rank"
                                    />
                                </div>
                                <div className="min-w-[150px]">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
                                    <CustomSelect
                                        options={[
                                            { value: 'lastChecked:desc', label: 'Recent First' },
                                            { value: 'currentRank:asc', label: 'Best Rank' },
                                            { value: 'currentRank:desc', label: 'Worst Rank' },
                                            { value: 'rankChange:desc', label: 'Most Improved' },
                                            { value: 'totalChecks:desc', label: 'Most Checked' },
                                        ]}
                                        value={`${sortBy}:${sortOrder}`}
                                        onChange={(v) => {
                                            const [field, order] = v.split(':');
                                            setSortBy(field);
                                            setSortOrder(order as 'asc' | 'desc');
                                            setPage(1);
                                        }}
                                        placeholder="Sort by"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Keywords Table */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                                </div>
                            ) : filteredKeywords.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    No keywords found
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Keyword</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Rank</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Change</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Best</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Features</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Checks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredKeywords.map((kw, i) => (
                                                <tr
                                                    key={`${kw.keyword}-${kw.domain}-${i}`}
                                                    className={`hover:bg-gray-50 cursor-pointer ${selectedKeyword === kw.keyword ? 'bg-indigo-50' : ''}`}
                                                    onClick={() => handleKeywordClick(kw)}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="font-medium text-gray-900 text-sm">{kw.keyword}</p>
                                                            <p className="text-xs text-gray-500">{kw.domain}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`font-bold ${kw.currentRank && kw.currentRank <= 10 ? 'text-green-600' : kw.currentRank && kw.currentRank <= 20 ? 'text-blue-600' : 'text-gray-900'}`}>
                                                            {kw.currentRank || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {getTrendIcon(kw.trend)}
                                                            {kw.rankChange !== null && kw.rankChange !== 0 && (
                                                                <span className={`text-xs font-medium ${kw.rankChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {kw.rankChange > 0 ? '+' : ''}{kw.rankChange}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                                                        {kw.bestRank || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {kw.hasAiOverview && (
                                                                <span className="p-1 bg-purple-100 rounded" title="AI Overview">
                                                                    <Sparkles size={12} className="text-purple-600" />
                                                                </span>
                                                            )}
                                                            {kw.hasPaa && (
                                                                <span className="p-1 bg-blue-100 rounded" title="People Also Ask">
                                                                    <MessageSquare size={12} className="text-blue-600" />
                                                                </span>
                                                            )}
                                                            {kw.hasFeaturedSnippet && (
                                                                <span className="p-1 bg-amber-100 rounded" title="Featured Snippet">
                                                                    <Target size={12} className="text-amber-600" />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-sm text-gray-500">
                                                        {kw.totalChecks}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                                    <p className="text-sm text-gray-500">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="p-2 border border-gray-200 rounded-lg disabled:opacity-50"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                            disabled={page === pagination.totalPages}
                                            className="p-2 border border-gray-200 rounded-lg disabled:opacity-50"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Keyword Detail Panel */}
                    <div className="lg:col-span-1">
                        {!selectedKeyword ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center sticky top-28">
                                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Select a keyword to view details</p>
                            </div>
                        ) : detailLoading ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 flex justify-center sticky top-28">
                                <Loader2 className="animate-spin text-indigo-600" size={32} />
                            </div>
                        ) : keywordDetail ? (
                            <div className="space-y-4 sticky top-28">
                                {/* Keyword Header */}
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <h3 className="font-bold text-gray-900 text-lg mb-1">{keywordDetail.keyword}</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Tracked across {keywordDetail.domains.length} domain{keywordDetail.domains.length > 1 ? 's' : ''}
                                    </p>

                                    {/* Stats by domain */}
                                    <div className="space-y-3">
                                        {keywordDetail.stats.map((stat, i) => (
                                            <div key={i} className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm font-medium text-gray-900 mb-2">{stat.domain}</p>
                                                <div className="grid grid-cols-3 gap-2 text-center">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Current</p>
                                                        <p className={`font-bold ${stat.currentRank && stat.currentRank <= 10 ? 'text-green-600' : 'text-gray-900'}`}>
                                                            {stat.currentRank || '-'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Best</p>
                                                        <p className="font-bold text-indigo-600">{stat.bestRank || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Avg</p>
                                                        <p className="font-bold text-gray-600">{stat.avgRank || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    {stat.hasAiOverview && (
                                                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">AI Overview</span>
                                                    )}
                                                    {stat.hasPaa && (
                                                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">PAA</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Rank History Chart */}
                                {chartData.length > 0 && (
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h4 className="font-semibold text-gray-900 mb-3">Rank History (30d)</h4>
                                        <div className="h-[200px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis
                                                        dataKey="date"
                                                        tick={{ fontSize: 10 }}
                                                        tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    />
                                                    <YAxis
                                                        reversed
                                                        domain={[1, 100]}
                                                        tick={{ fontSize: 10 }}
                                                        width={30}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                                                        labelFormatter={(v) => new Date(v).toLocaleDateString()}
                                                    />
                                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                                    {Object.keys(keywordDetail.rankHistory).map((dom, i) => (
                                                        <Line
                                                            key={dom}
                                                            type="monotone"
                                                            dataKey={dom}
                                                            stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                                            strokeWidth={2}
                                                            dot={{ r: 2 }}
                                                            connectNulls
                                                        />
                                                    ))}
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {/* Last Checked */}
                                {keywordDetail.stats[0] && (
                                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Clock size={14} />
                                            Last checked: {new Date(keywordDetail.stats[0].lastChecked).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </main>
        </div>
    );
}
