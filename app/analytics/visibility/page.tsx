'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CustomSelect from '@/components/CustomSelect';
import {
    Eye, Loader2, TrendingUp, TrendingDown, Target, Zap,
    ArrowUpRight, ArrowDownRight, Award, AlertTriangle, ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area, BarChart, Bar,
    ComposedChart, Legend
} from 'recharts';

interface VisibilityData {
    period: { days: number; startDate: string };
    visibilityTrend: Array<{ date: string; score: number; keywords: number; ranked: number }>;
    domainVisibility: Array<{
        domain: string;
        visibilityScore: number;
        keywords: number;
        rankedKeywords: number;
        top3: number;
        top10: number;
        top20: number;
        marketShare: number;
    }>;
    rankBrackets: Array<{
        date: string;
        top3: number;
        top10: number;
        top20: number;
        top50: number;
        beyond50: number;
        notRanked: number;
    }>;
    opportunities: Array<{
        keyword: string;
        domain: string;
        currentRank: number;
        bestRank: number;
        potential: number;
    }>;
    weekOverWeek: {
        thisWeek: { avgRank: number | null; top10: number };
        lastWeek: { avgRank: number | null; top10: number };
        changes: { avgRank: number | null; top10: number };
    };
    movers: {
        improvers: Array<{ keyword: string; domain: string; from: number; to: number; change: number }>;
        decliners: Array<{ keyword: string; domain: string; from: number; to: number; change: number }>;
    };
}

const BRACKET_COLORS = {
    top3: '#10b981',
    top10: '#3b82f6',
    top20: '#8b5cf6',
    top50: '#f59e0b',
    beyond50: '#ef4444',
    notRanked: '#d1d5db',
};

export default function VisibilityPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<VisibilityData | null>(null);
    const [days, setDays] = useState(30);
    const [domains, setDomains] = useState<string[]>([]);
    const [selectedDomain, setSelectedDomain] = useState('');

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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ days: String(days) });
                if (selectedDomain) params.append('domain', selectedDomain);

                const res = await fetch(`/api/v1/analytics/visibility?${params}`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result.data);
                }
            } catch (err) {
                console.error('Failed to fetch visibility data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [days, selectedDomain]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-green-600';
        if (score >= 40) return 'text-blue-600';
        if (score >= 20) return 'text-amber-600';
        return 'text-red-600';
    };

    const getScoreBg = (score: number) => {
        if (score >= 70) return 'bg-green-50 border-green-200';
        if (score >= 40) return 'bg-blue-50 border-blue-200';
        if (score >= 20) return 'bg-amber-50 border-amber-200';
        return 'bg-red-50 border-red-200';
    };

    // Calculate current visibility score
    const currentScore = data?.visibilityTrend?.length
        ? data.visibilityTrend[data.visibilityTrend.length - 1].score
        : 0;
    const previousScore = data?.visibilityTrend?.length && data.visibilityTrend.length > 1
        ? data.visibilityTrend[data.visibilityTrend.length - 2].score
        : currentScore;
    const scoreChange = currentScore - previousScore;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/analytics" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-2">
                        <ChevronLeft size={16} /> Back to Analytics
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <Eye className="h-7 w-7 text-indigo-600" />
                                Visibility & Market Share
                            </h1>
                            <p className="text-gray-500 mt-1">Track your search visibility and competitive position</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-[180px]">
                                <CustomSelect
                                    options={[
                                        { value: '', label: 'All Domains' },
                                        ...domains.map(d => ({ value: d, label: d }))
                                    ]}
                                    value={selectedDomain}
                                    onChange={setSelectedDomain}
                                    placeholder="Select domain"
                                    searchable
                                />
                            </div>
                            <div className="w-[150px]">
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
                                    placeholder="Period"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                ) : !data ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No visibility data available</p>
                    </div>
                ) : (
                    <>
                        {/* Top Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                            {/* Visibility Score */}
                            <div className={`rounded-xl border-2 p-5 ${getScoreBg(currentScore)}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Visibility Score</span>
                                    <Eye className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className={`text-3xl font-bold ${getScoreColor(currentScore)}`}>
                                        {currentScore}%
                                    </span>
                                    {scoreChange !== 0 && (
                                        <span className={`text-sm flex items-center ${scoreChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {scoreChange > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                            {Math.abs(scoreChange)}%
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Week over Week */}
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500">Avg Rank (WoW)</span>
                                    {data.weekOverWeek.changes.avgRank !== null && data.weekOverWeek.changes.avgRank > 0 ? (
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-red-500" />
                                    )}
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {data.weekOverWeek.thisWeek.avgRank || '-'}
                                </p>
                                {data.weekOverWeek.changes.avgRank !== null && (
                                    <p className={`text-xs ${data.weekOverWeek.changes.avgRank > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {data.weekOverWeek.changes.avgRank > 0 ? '↑' : '↓'} {Math.abs(data.weekOverWeek.changes.avgRank)} vs last week
                                    </p>
                                )}
                            </div>

                            {/* Top 10 Count */}
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500">Page 1 Keywords</span>
                                    <Award className="h-4 w-4 text-amber-500" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {data.weekOverWeek.thisWeek.top10}
                                </p>
                                <p className={`text-xs ${data.weekOverWeek.changes.top10 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {data.weekOverWeek.changes.top10 >= 0 ? '+' : ''}{data.weekOverWeek.changes.top10} vs last week
                                </p>
                            </div>

                            {/* Improvers */}
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500">Improved</span>
                                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                                </div>
                                <p className="text-2xl font-bold text-green-600">
                                    {data.movers.improvers.length}
                                </p>
                                <p className="text-xs text-gray-400">keywords moved up</p>
                            </div>

                            {/* Decliners */}
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500">Declined</span>
                                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                                </div>
                                <p className="text-2xl font-bold text-red-600">
                                    {data.movers.decliners.length}
                                </p>
                                <p className="text-xs text-gray-400">keywords moved down</p>
                            </div>
                        </div>

                        {/* Charts Row 1 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Visibility Score Trend */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Eye size={18} className="text-indigo-600" />
                                    Visibility Score Trend
                                </h3>
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.visibilityTrend}>
                                            <defs>
                                                <linearGradient id="visGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
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
                                                domain={[0, 100]}
                                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={35}
                                                tickFormatter={(v) => `${v}%`}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                                labelFormatter={formatDate}
                                                formatter={(value: number) => [`${value}%`, 'Visibility']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="score"
                                                stroke="#4f46e5"
                                                strokeWidth={2}
                                                fill="url(#visGradient)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Rank Distribution Stacked Area */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Target size={18} className="text-green-600" />
                                    Rank Distribution Over Time
                                </h3>
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.rankBrackets}>
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
                                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                                            <Area type="monotone" dataKey="top3" stackId="1" stroke={BRACKET_COLORS.top3} fill={BRACKET_COLORS.top3} name="Top 3" />
                                            <Area type="monotone" dataKey="top10" stackId="1" stroke={BRACKET_COLORS.top10} fill={BRACKET_COLORS.top10} name="4-10" />
                                            <Area type="monotone" dataKey="top20" stackId="1" stroke={BRACKET_COLORS.top20} fill={BRACKET_COLORS.top20} name="11-20" />
                                            <Area type="monotone" dataKey="top50" stackId="1" stroke={BRACKET_COLORS.top50} fill={BRACKET_COLORS.top50} name="21-50" />
                                            <Area type="monotone" dataKey="beyond50" stackId="1" stroke={BRACKET_COLORS.beyond50} fill={BRACKET_COLORS.beyond50} name="50+" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Domain Visibility */}
                        {data.domainVisibility.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Zap size={18} className="text-amber-600" />
                                    Domain Visibility Comparison
                                </h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={data.domainVisibility} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                                            <YAxis
                                                type="category"
                                                dataKey="domain"
                                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                                width={120}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                                formatter={(value: number, name: string) => [
                                                    name === 'visibilityScore' ? `${value}%` : value,
                                                    name === 'visibilityScore' ? 'Visibility' : name === 'marketShare' ? 'Page 1 %' : name
                                                ]}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                                            <Bar dataKey="visibilityScore" fill="#4f46e5" name="Visibility Score" radius={[0, 4, 4, 0]} />
                                            <Bar dataKey="marketShare" fill="#10b981" name="Page 1 Share" radius={[0, 4, 4, 0]} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Bottom Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Page 1 Opportunities */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-amber-500" />
                                    Page 1 Opportunities
                                </h3>
                                <p className="text-xs text-gray-500 mb-3">Keywords ranking 11-20 (close to page 1)</p>
                                {data.opportunities.length > 0 ? (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {data.opportunities.map((opp, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 text-sm truncate">{opp.keyword}</p>
                                                    <p className="text-xs text-gray-500 truncate">{opp.domain}</p>
                                                </div>
                                                <div className="text-right ml-2">
                                                    <p className="font-bold text-amber-600">#{opp.currentRank}</p>
                                                    <p className="text-xs text-gray-400">{opp.potential} to go</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-center py-8">No opportunities found</p>
                                )}
                            </div>

                            {/* Top Improvers */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-green-500" />
                                    Top Improvers
                                </h3>
                                {data.movers.improvers.length > 0 ? (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {data.movers.improvers.map((m, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 text-sm truncate">{m.keyword}</p>
                                                    <p className="text-xs text-gray-500 truncate">{m.domain}</p>
                                                </div>
                                                <div className="text-right ml-2">
                                                    <p className="text-xs text-gray-400">#{m.from} → #{m.to}</p>
                                                    <p className="font-bold text-green-600">+{m.change}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-center py-8">No improvers this period</p>
                                )}
                            </div>

                            {/* Top Decliners */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <TrendingDown size={18} className="text-red-500" />
                                    Needs Attention
                                </h3>
                                {data.movers.decliners.length > 0 ? (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {data.movers.decliners.map((m, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 text-sm truncate">{m.keyword}</p>
                                                    <p className="text-xs text-gray-500 truncate">{m.domain}</p>
                                                </div>
                                                <div className="text-right ml-2">
                                                    <p className="text-xs text-gray-400">#{m.from} → #{m.to}</p>
                                                    <p className="font-bold text-red-600">-{m.change}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-center py-8">No decliners this period</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
