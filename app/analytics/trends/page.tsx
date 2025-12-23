'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CustomSelect from '@/components/CustomSelect';
import {
    TrendingUp, TrendingDown, Minus, Loader2, ChevronLeft,
    ArrowUp, ArrowDown
} from 'lucide-react';
import Link from 'next/link';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

interface TrendData {
    date: string;
    avgRank: number;
    bestRank: number;
    worstRank: number;
    keywordCount: number;
    rankedCount: number;
}

interface KeywordTrend {
    keyword: string;
    startRank: number | null;
    endRank: number | null;
    change: number | null;
}

interface TrendsSummary {
    startAvg: number | null;
    endAvg: number | null;
    change: number | null;
    changePercent: number | null;
    trend: 'improving' | 'declining' | 'stable';
}

export default function RankingTrendsPage() {
    const [loading, setLoading] = useState(true);
    const [trends, setTrends] = useState<TrendData[]>([]);
    const [keywordTrends, setKeywordTrends] = useState<KeywordTrend[]>([]);
    const [summary, setSummary] = useState<TrendsSummary | null>(null);

    // Filters
    const [domain, setDomain] = useState('');
    const [days, setDays] = useState(30);
    const [granularity, setGranularity] = useState('day');

    // Available domains from user history
    const [domains, setDomains] = useState<string[]>([]);

    useEffect(() => {
        // Fetch domains for filter
        const fetchDomains = async () => {
            try {
                const res = await fetch('/api/v1/analytics/domains?limit=50');
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

    useEffect(() => {
        const fetchTrends = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    days: days.toString(),
                    granularity,
                });
                if (domain) params.append('domain', domain);

                const res = await fetch(`/api/v1/analytics/rankings/trends?${params}`);
                if (res.ok) {
                    const data = await res.json();
                    setTrends(data.data?.trends || []);
                    setKeywordTrends(data.data?.keywordTrends || []);
                    setSummary(data.data?.summary || null);
                }
            } catch (err) {
                console.error('Failed to fetch trends:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTrends();
    }, [domain, days, granularity]);

    const getTrendIcon = (trend: string) => {
        if (trend === 'improving') return <TrendingUp className="h-5 w-5 text-green-500" />;
        if (trend === 'declining') return <TrendingDown className="h-5 w-5 text-red-500" />;
        return <Minus className="h-5 w-5 text-gray-400" />;
    };

    const getTrendColor = (trend: string) => {
        if (trend === 'improving') return 'text-green-600 bg-green-50';
        if (trend === 'declining') return 'text-red-600 bg-red-50';
        return 'text-gray-600 bg-gray-50';
    };

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
                        <TrendingUp className="h-7 w-7 text-indigo-600" />
                        Ranking Trends
                    </h1>
                    <p className="text-gray-500 mt-1">Track how your rankings change over time</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Domain</label>
                            <CustomSelect
                                options={[
                                    { value: '', label: 'All Domains' },
                                    ...domains.map(d => ({ value: d, label: d }))
                                ]}
                                value={domain}
                                onChange={setDomain}
                                placeholder="Select domain"
                                searchable
                            />
                        </div>
                        <div className="min-w-[160px]">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Period</label>
                            <CustomSelect
                                options={[
                                    { value: '7', label: 'Last 7 days' },
                                    { value: '14', label: 'Last 14 days' },
                                    { value: '30', label: 'Last 30 days' },
                                    { value: '60', label: 'Last 60 days' },
                                    { value: '90', label: 'Last 90 days' },
                                ]}
                                value={String(days)}
                                onChange={(v) => setDays(parseInt(v) || 30)}
                                placeholder="Select period"
                            />
                        </div>
                        <div className="min-w-[140px]">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Granularity</label>
                            <CustomSelect
                                options={[
                                    { value: 'day', label: 'Daily' },
                                    { value: 'week', label: 'Weekly' },
                                    { value: 'month', label: 'Monthly' },
                                ]}
                                value={granularity}
                                onChange={setGranularity}
                                placeholder="Select granularity"
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        {summary && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-white p-5 rounded-xl border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1">Start Avg Rank</p>
                                    <p className="text-2xl font-bold text-gray-900">{summary.startAvg || '-'}</p>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1">Current Avg Rank</p>
                                    <p className="text-2xl font-bold text-gray-900">{summary.endAvg || '-'}</p>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1">Change</p>
                                    <p className={`text-2xl font-bold ${summary.change && summary.change > 0 ? 'text-green-600' : summary.change && summary.change < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                        {summary.change ? (summary.change > 0 ? '+' : '') + summary.change : '-'}
                                    </p>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1">Trend</p>
                                    <div className="flex items-center gap-2">
                                        {getTrendIcon(summary.trend)}
                                        <span className={`px-2 py-1 rounded-full text-sm font-medium capitalize ${getTrendColor(summary.trend)}`}>
                                            {summary.trend}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chart */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Rank Over Time</h2>
                            {trends.length > 0 ? (
                                <div className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={trends} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                reversed
                                                domain={[1, 100]}
                                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                                width={40}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <ReferenceLine y={10} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Page 1', fill: '#10b981', fontSize: 10 }} />
                                            <Line type="monotone" dataKey="avgRank" stroke="#4f46e5" strokeWidth={2} name="Avg Rank" dot={{ r: 3 }} />
                                            <Line type="monotone" dataKey="bestRank" stroke="#10b981" strokeWidth={1} strokeDasharray="5 5" name="Best Rank" dot={false} />
                                            <Line type="monotone" dataKey="worstRank" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" name="Worst Rank" dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-[400px] flex items-center justify-center text-gray-400">
                                    No ranking data available for this period
                                </div>
                            )}
                        </div>

                        {/* Keyword Trends Table */}
                        {domain && keywordTrends.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h2 className="text-lg font-bold text-gray-900">Keyword Performance</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Keyword</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Start Rank</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Current Rank</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Change</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {keywordTrends.map((kw, i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{kw.keyword}</td>
                                                    <td className="px-6 py-4 text-center text-gray-600">{kw.startRank || '-'}</td>
                                                    <td className="px-6 py-4 text-center text-gray-600">{kw.endRank || '-'}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        {kw.change !== null ? (
                                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${kw.change > 0 ? 'bg-green-50 text-green-700' :
                                                                kw.change < 0 ? 'bg-red-50 text-red-700' :
                                                                    'bg-gray-50 text-gray-600'
                                                                }`}>
                                                                {kw.change > 0 && <ArrowUp size={14} />}
                                                                {kw.change < 0 && <ArrowDown size={14} />}
                                                                {kw.change > 0 ? '+' : ''}{kw.change}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
