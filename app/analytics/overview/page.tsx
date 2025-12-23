'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CustomSelect from '@/components/CustomSelect';
import {
    BarChart3, Loader2, TrendingUp, TrendingDown, Minus,
    Target, Sparkles, MapPin, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import Link from 'next/link';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
    AreaChart, Area, Legend
} from 'recharts';

interface AnalyticsData {
    period: { days: number; startDate: string };
    searchActivity: Array<{ date: string; searches: number; keywords: number }>;
    rankDistribution: Array<{ range: string; count: number }>;
    topKeywords: Array<{ keyword: string; currentRank: number; bestRank: number; domain: string; checks: number }>;
    serpFeatures: {
        total: number;
        chart: Array<{ name: string; value: number; color: string }>;
    };
    locationStats: Array<{ location: string; count: number; avgRank: number | null }>;
    rankChanges: { improved: number; declined: number; stable: number; netChange: number };
    dailyStats: Array<{ date: string; avgRank: number; minRank: number; maxRank: number; count: number }>;
}

const RANK_COLORS: Record<string, string> = {
    'Top 3': '#10b981',
    'Top 10': '#3b82f6',
    'Top 20': '#8b5cf6',
    'Top 50': '#f59e0b',
    'Top 100': '#ef4444',
    'Not Ranked': '#6b7280',
};

export default function AnalyticsOverviewPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [days, setDays] = useState(30);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/v1/analytics/overview?days=${days}`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result.data);
                }
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [days]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <BarChart3 className="h-7 w-7 text-indigo-600" />
                            Analytics Overview
                        </h1>
                        <p className="text-gray-500 mt-1">Comprehensive view of your keyword tracking performance</p>
                    </div>
                    <div className="w-[160px]">
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
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                ) : !data ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No analytics data available</p>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500">Rank Improved</span>
                                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                                </div>
                                <p className="text-2xl font-bold text-green-600">{data.rankChanges.improved}</p>
                                <p className="text-xs text-gray-400 mt-1">keywords moved up</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500">Rank Declined</span>
                                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                                </div>
                                <p className="text-2xl font-bold text-red-600">{data.rankChanges.declined}</p>
                                <p className="text-xs text-gray-400 mt-1">keywords moved down</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500">Stable</span>
                                    <Minus className="h-4 w-4 text-gray-400" />
                                </div>
                                <p className="text-2xl font-bold text-gray-600">{data.rankChanges.stable}</p>
                                <p className="text-xs text-gray-400 mt-1">keywords unchanged</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500">Net Change</span>
                                    {data.rankChanges.netChange >= 0 ? (
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-red-500" />
                                    )}
                                </div>
                                <p className={`text-2xl font-bold ${data.rankChanges.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {data.rankChanges.netChange >= 0 ? '+' : ''}{data.rankChanges.netChange}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">positions overall</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Average Rank Trend */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-indigo-600" />
                                    Average Rank Trend
                                </h3>
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.dailyStats}>
                                            <defs>
                                                <linearGradient id="rankGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={formatDate}
                                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                reversed
                                                domain={[1, 100]}
                                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={35}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                                labelFormatter={formatDate}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="avgRank"
                                                stroke="#4f46e5"
                                                strokeWidth={2}
                                                fill="url(#rankGradient)"
                                                name="Avg Rank"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Rank Distribution Pie Chart */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Target size={18} className="text-indigo-600" />
                                    Rank Distribution
                                </h3>
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.rankDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={2}
                                                dataKey="count"
                                                nameKey="range"
                                                label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                labelLine={false}
                                            >
                                                {data.rankDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={RANK_COLORS[entry.range] || '#6b7280'} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => [value, 'Keywords']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Search Activity */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Activity size={18} className="text-indigo-600" />
                                    Search Activity
                                </h3>
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.searchActivity}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={formatDate}
                                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={35}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                                labelFormatter={formatDate}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                                            <Bar dataKey="searches" fill="#4f46e5" name="Searches" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="keywords" fill="#10b981" name="Keywords" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* SERP Features */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Sparkles size={18} className="text-purple-600" />
                                    SERP Features Detected
                                </h3>
                                {data.serpFeatures.chart.length > 0 ? (
                                    <div className="h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.serpFeatures.chart} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                                    width={100}
                                                />
                                                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                    {data.serpFeatures.chart.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-[280px] flex items-center justify-center text-gray-400">
                                        No SERP features detected
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Keywords */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Target size={18} className="text-green-600" />
                                    Top Performing Keywords
                                </h3>
                                {data.topKeywords.length > 0 ? (
                                    <div className="space-y-3">
                                        {data.topKeywords.map((kw, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">{kw.keyword}</p>
                                                    <p className="text-xs text-gray-500">{kw.domain}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className={`font-bold ${kw.currentRank <= 3 ? 'text-green-600' : kw.currentRank <= 10 ? 'text-blue-600' : 'text-gray-900'}`}>
                                                            #{kw.currentRank}
                                                        </p>
                                                        <p className="text-xs text-gray-400">Best: #{kw.bestRank}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-[200px] flex items-center justify-center text-gray-400">
                                        No ranking keywords found
                                    </div>
                                )}
                                <Link
                                    href="/analytics/keywords"
                                    className="mt-4 block text-center text-sm text-indigo-600 hover:text-indigo-700"
                                >
                                    View all keywords →
                                </Link>
                            </div>

                            {/* Location Stats */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <MapPin size={18} className="text-amber-600" />
                                    Performance by Location
                                </h3>
                                {data.locationStats.length > 0 ? (
                                    <div className="space-y-3">
                                        {data.locationStats.map((loc, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">{loc.location}</p>
                                                    <p className="text-xs text-gray-500">{loc.count} checks</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">
                                                        {loc.avgRank ? `Avg #${loc.avgRank}` : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-[200px] flex items-center justify-center text-gray-400">
                                        No location data available
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
