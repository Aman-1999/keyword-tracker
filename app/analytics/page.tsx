'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import {
    TrendingUp, History, MapPin, Globe, Loader2,
    ArrowRight, BarChart3, Smartphone, Monitor, Tablet
} from 'lucide-react';
import Link from 'next/link';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

import CustomSelect from '@/components/CustomSelect';

interface HistoryItem {
    _id: string;
    domain: string;
    keywords: string[];
    location: string;
    createdAt: string;
    filters?: {
        device?: string;
        language?: string;
    };
}

interface RankingPoint {
    date: string;
    rank: number;
}

export default function AnalyticsPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Chart State
    const [selectedKeyword, setSelectedKeyword] = useState<string>('');
    const [chartData, setChartData] = useState<RankingPoint[]>([]);
    const [chartLoading, setChartLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const historyRes = await fetch('/api/user/history');
                if (historyRes.ok) {
                    const data = await historyRes.json();
                    setHistory(data.history || []);
                }
            } catch (error) {
                console.error('Failed to fetch user data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Analytics Calculation
    const totalSearches = history.length;

    // Top Domains
    const domainCounts = history.reduce((acc, item) => {
        acc[item.domain] = (acc[item.domain] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topDomains = Object.entries(domainCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    // Top Locations
    const locationCounts = history.reduce((acc, item) => {
        const loc = item.location || 'Unknown';
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topLocations = Object.entries(locationCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    // Recent Activity
    const recentActivity = history.slice(0, 5);

    // Extract unique keywords for the dropdown
    const uniqueKeywords = useMemo(() => {
        const map = new Map<string, string>();
        history.forEach(h => {
            if (h.keywords && h.keywords.length > 0) {
                const kw = h.keywords[0];
                if (!map.has(kw)) {
                    map.set(kw, h.domain);
                }
            }
        });
        return Array.from(map.entries()).map(([kw, domain]) => ({ keyword: kw, domain }));
    }, [history]);

    // Prepare options for CustomSelect
    const keywordOptions = useMemo(() => {
        return uniqueKeywords.map(k => ({
            value: k.keyword,
            label: k.keyword,
            subtext: k.domain
        }));
    }, [uniqueKeywords]);

    // Set default selected keyword
    useEffect(() => {
        if (!selectedKeyword && uniqueKeywords.length > 0) {
            setSelectedKeyword(uniqueKeywords[0].keyword);
        }
    }, [uniqueKeywords, selectedKeyword]);

    // Fetch Chart Data
    useEffect(() => {
        if (!selectedKeyword) return;

        const fetchChart = async () => {
            setChartLoading(true);
            try {
                const target = uniqueKeywords.find(k => k.keyword === selectedKeyword);
                if (!target) return;

                const res = await fetch(`/api/analytics/ranking-history?domain=${encodeURIComponent(target.domain)}&keyword=${encodeURIComponent(selectedKeyword)}`);
                if (res.ok) {
                    const data = await res.json();
                    setChartData(data.history || []);
                }
            } catch (e) {
                console.error("Failed to fetch chart data", e);
            } finally {
                setChartLoading(false);
            }
        };

        fetchChart();
    }, [selectedKeyword, uniqueKeywords]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics Dashboard</h1>
                        <p className="text-gray-500 mt-2 text-lg">Deep dive into your search performance and trends.</p>
                    </div>
                </div>

                {/* Ranking Trends Chart Section */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-indigo-500" />
                                Ranking Trends
                            </h2>
                            <p className="text-sm text-gray-500">See how your rankings have changed over time.</p>
                        </div>

                        {/* Keyword Selector - CustomSelect */}
                        <div className="min-w-[280px]">
                            <CustomSelect
                                options={keywordOptions}
                                value={selectedKeyword}
                                onChange={setSelectedKeyword}
                                placeholder="Select a keyword..."
                                searchable
                            />
                        </div>
                    </div>

                    <div className="p-6 h-[400px] w-full">
                        {chartLoading ? (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                        axisLine={false}
                                        tickLine={false}
                                        minTickGap={30}
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
                                        labelFormatter={(val) => new Date(val).toLocaleDateString()}
                                    />
                                    <ReferenceLine y={10} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Page 1', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="rank"
                                        stroke="#4f46e5"
                                        strokeWidth={3}
                                        dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                                <BarChart3 className="h-10 w-10 mb-2 opacity-20" />
                                <p>No ranking history available for this keyword.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Insights Section */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-indigo-500" />
                            Usage Insights
                        </h2>

                        {/* Top Domains List */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-semibold text-gray-700 text-sm">Most Tracked Domains</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {topDomains.length > 0 ? topDomains.map(([domain, count], idx) => (
                                    <div key={domain} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                                                {idx + 1}
                                            </span>
                                            <span className="font-medium text-gray-900">{domain}</span>
                                        </div>
                                        <span className="text-sm text-gray-500">{count} searches</span>
                                    </div>
                                )) : (
                                    <div className="p-6 text-center text-gray-400 text-sm">No domains tracked yet</div>
                                )}
                            </div>
                        </div>

                        {/* Top Locations List */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-semibold text-gray-700 text-sm">Top Locations</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {topLocations.length > 0 ? topLocations.map(([loc, count], idx) => (
                                    <div key={loc} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium text-gray-900 truncate max-w-[200px]">{loc}</span>
                                        </div>
                                        <span className="text-sm text-gray-500">{count} times</span>
                                    </div>
                                )) : (
                                    <div className="p-6 text-center text-gray-400 text-sm">No location data yet</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <History className="h-5 w-5 text-indigo-500" />
                                Recent Activity
                            </h2>
                            <Link href="/history" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group">
                                View Full History
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {recentActivity.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {recentActivity.map((item) => (
                                        <div key={item._id} className="p-4 hover:bg-gray-50 transition-colors group">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-900">{item.domain}</span>
                                                        <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 rounded-full">
                                                            {new Date(item.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 line-clamp-1">
                                                        {item.keywords.length} keywords: {item.keywords.join(', ')}
                                                    </p>
                                                    <div className="flex items-center gap-3 pt-1">
                                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                                            <Globe className="h-3 w-3" />
                                                            {item.location || 'Global'}
                                                        </div>
                                                        {item.filters?.device && (
                                                            <div className="flex items-center gap-1 text-xs text-gray-400 capitalize">
                                                                {item.filters.device === 'mobile' ? <Smartphone className="h-3 w-3" /> :
                                                                    item.filters.device === 'tablet' ? <Tablet className="h-3 w-3" /> :
                                                                        <Monitor className="h-3 w-3" />}
                                                                {item.filters.device}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/results/${item._id}`}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                >
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="mx-auto h-12 w-12 text-gray-300 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                        <History className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-900">No recent activity</h3>
                                    <p className="mt-1 text-sm text-gray-500">Start searching to see your stats here.</p>
                                    <div className="mt-6">
                                        <Link href="/dashboard" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                                            Start Searching
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
