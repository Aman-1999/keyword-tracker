'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CustomSelect from '@/components/CustomSelect';
import {
    FileText, Loader2, TrendingUp, TrendingDown, Target, Zap,
    ArrowUpRight, ArrowDownRight, Monitor, Smartphone, Tablet,
    ChevronLeft, Award, AlertCircle, PieChart as PieChartIcon
} from 'lucide-react';
import Link from 'next/link';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    Legend
} from 'recharts';

interface ReportData {
    period: { days: number; startDate: string };
    summary: {
        totalChecks: number;
        uniqueKeywords: number;
        uniqueDomains: number;
        avgRank: number | null;
        top3: number;
        top10: number;
        top20: number;
        ranked: number;
        rankRate: number;
        aiOverviewRate: number;
        paaRate: number;
    };
    comparison: {
        avgRankChange: number | null;
        top10Change: number;
        rankedChange: number;
    };
    keywordGrowth: Array<{ date: string; keywords: number }>;
    topGainers: Array<{ keyword: string; domain: string; from: number; to: number; improvement: number }>;
    topLosers: Array<{ keyword: string; domain: string; from: number; to: number; drop: number }>;
    serpTrend: Array<{ date: string; aiOverview: number; paa: number; featuredSnippet: number; localPack: number }>;
    deviceBreakdown: Array<{ device: string; count: number }>;
    rankByDayOfWeek: Array<{ day: string; avgRank: number; checks: number }>;
    keywordIntents: Array<{ intent: string; count: number; avgRank: number | null; top10: number; top10Rate: number }>;
    domainHealth: Array<{
        domain: string;
        keywords: number;
        ranked: number;
        top10: number;
        avgRank: number | null;
        healthScore: number;
        trend: 'up' | 'down' | 'stable';
    }>;
}

const INTENT_COLORS: Record<string, string> = {
    transactional: '#10b981',
    informational: '#3b82f6',
    commercial: '#8b5cf6',
    local: '#f59e0b',
    navigational: '#6b7280',
};

const DEVICE_ICONS: Record<string, React.ReactNode> = {
    desktop: <Monitor size={16} />,
    mobile: <Smartphone size={16} />,
    tablet: <Tablet size={16} />,
};

export default function SEOReportPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ReportData | null>(null);
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

                const res = await fetch(`/api/v1/analytics/report?${params}`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result.data);
                }
            } catch (err) {
                console.error('Failed to fetch report:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [days, selectedDomain]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const getHealthColor = (score: number) => {
        if (score >= 70) return 'text-green-600 bg-green-50';
        if (score >= 40) return 'text-amber-600 bg-amber-50';
        return 'text-red-600 bg-red-50';
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
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <FileText className="h-7 w-7 text-indigo-600" />
                                SEO Performance Report
                            </h1>
                            <p className="text-gray-500 mt-1">Comprehensive insights for your SEO strategy</p>
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
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No report data available</p>
                    </div>
                ) : (
                    <>
                        {/* Executive Summary */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
                            <h2 className="text-lg font-semibold mb-4">Executive Summary</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                <div>
                                    <p className="text-indigo-200 text-sm">Keywords Tracked</p>
                                    <p className="text-2xl font-bold">{data.summary.uniqueKeywords}</p>
                                </div>
                                <div>
                                    <p className="text-indigo-200 text-sm">Avg Position</p>
                                    <p className="text-2xl font-bold">{data.summary.avgRank || '-'}</p>
                                    {data.comparison.avgRankChange !== null && (
                                        <p className={`text-xs ${data.comparison.avgRankChange > 0 ? 'text-green-300' : 'text-red-300'}`}>
                                            {data.comparison.avgRankChange > 0 ? '↑' : '↓'} {Math.abs(data.comparison.avgRankChange)} vs prev
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-indigo-200 text-sm">Page 1 (Top 10)</p>
                                    <p className="text-2xl font-bold">{data.summary.top10}</p>
                                    <p className={`text-xs ${data.comparison.top10Change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                        {data.comparison.top10Change >= 0 ? '+' : ''}{data.comparison.top10Change} vs prev
                                    </p>
                                </div>
                                <div>
                                    <p className="text-indigo-200 text-sm">Top 3</p>
                                    <p className="text-2xl font-bold">{data.summary.top3}</p>
                                </div>
                                <div>
                                    <p className="text-indigo-200 text-sm">Ranking Rate</p>
                                    <p className="text-2xl font-bold">{data.summary.rankRate}%</p>
                                </div>
                                <div>
                                    <p className="text-indigo-200 text-sm">AI Overview</p>
                                    <p className="text-2xl font-bold">{data.summary.aiOverviewRate}%</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Keyword Growth */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-green-600" />
                                    Keyword Tracking Growth
                                </h3>
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.keywordGrowth}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                                            <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} labelFormatter={formatDate} />
                                            <Line type="monotone" dataKey="keywords" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Keywords" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* SERP Features Trend */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Zap size={18} className="text-purple-600" />
                                    SERP Features Presence (%)
                                </h3>
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.serpTrend}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={35} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                            <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} labelFormatter={formatDate} formatter={(v: number) => [`${v}%`]} />
                                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                                            <Line type="monotone" dataKey="aiOverview" stroke="#8b5cf6" strokeWidth={2} dot={false} name="AI Overview" />
                                            <Line type="monotone" dataKey="paa" stroke="#3b82f6" strokeWidth={2} dot={false} name="PAA" />
                                            <Line type="monotone" dataKey="featuredSnippet" stroke="#10b981" strokeWidth={2} dot={false} name="Featured Snippet" />
                                            <Line type="monotone" dataKey="localPack" stroke="#f59e0b" strokeWidth={2} dot={false} name="Local Pack" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Keyword Intent & Device */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Keyword Intent Distribution */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <PieChartIcon size={18} className="text-indigo-600" />
                                    Keyword Intent
                                </h3>
                                {data.keywordIntents.length > 0 ? (
                                    <div className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data.keywordIntents}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    dataKey="count"
                                                    nameKey="intent"
                                                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    labelLine={false}
                                                >
                                                    {data.keywordIntents.map((entry, index) => (
                                                        <Cell key={index} fill={INTENT_COLORS[entry.intent] || '#6b7280'} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(v: number, name: string) => [v, name]} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-gray-400">No data</div>
                                )}
                            </div>

                            {/* Device Breakdown */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Monitor size={18} className="text-blue-600" />
                                    Device Distribution
                                </h3>
                                <div className="space-y-3">
                                    {data.deviceBreakdown.map((d, i) => {
                                        const total = data.deviceBreakdown.reduce((sum, dev) => sum + dev.count, 0);
                                        const percent = total ? Math.round((d.count / total) * 100) : 0;
                                        return (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="text-gray-400">{DEVICE_ICONS[d.device] || <Monitor size={16} />}</div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="capitalize font-medium">{d.device}</span>
                                                        <span className="text-gray-500">{percent}%</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Rank by Day of Week */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Target size={18} className="text-amber-600" />
                                    Avg Rank by Day
                                </h3>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.rankByDayOfWeek}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis reversed domain={[1, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                                            <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                            <Bar dataKey="avgRank" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Avg Rank" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Gainers, Losers, Domain Health */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Top Gainers */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <ArrowUpRight size={18} className="text-green-500" />
                                    Top Gainers
                                </h3>
                                {data.topGainers.length > 0 ? (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {data.topGainers.map((g, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 text-sm truncate">{g.keyword}</p>
                                                    <p className="text-xs text-gray-500 truncate">{g.domain}</p>
                                                </div>
                                                <div className="text-right ml-2">
                                                    <p className="text-xs text-gray-400">#{g.from} → #{g.to}</p>
                                                    <p className="font-bold text-green-600">+{g.improvement}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-center py-8">No gainers this period</p>
                                )}
                            </div>

                            {/* Top Losers */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <ArrowDownRight size={18} className="text-red-500" />
                                    Needs Attention
                                </h3>
                                {data.topLosers.length > 0 ? (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {data.topLosers.map((l, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 text-sm truncate">{l.keyword}</p>
                                                    <p className="text-xs text-gray-500 truncate">{l.domain}</p>
                                                </div>
                                                <div className="text-right ml-2">
                                                    <p className="text-xs text-gray-400">#{l.from} → #{l.to}</p>
                                                    <p className="font-bold text-red-600">-{l.drop}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-center py-8">No losers this period</p>
                                )}
                            </div>

                            {/* Domain Health */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Award size={18} className="text-purple-600" />
                                    Domain Health Score
                                </h3>
                                {data.domainHealth.length > 0 ? (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                        {data.domainHealth.map((d, i) => (
                                            <div key={i} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="font-medium text-gray-900 text-sm truncate flex-1">{d.domain}</p>
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${getHealthColor(d.healthScore)}`}>
                                                        {d.healthScore}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <span>{d.keywords} keywords</span>
                                                    <span>{d.top10} on page 1</span>
                                                    <span className="flex items-center gap-1">
                                                        {d.trend === 'up' && <TrendingUp size={12} className="text-green-500" />}
                                                        {d.trend === 'down' && <TrendingDown size={12} className="text-red-500" />}
                                                        {d.avgRank ? `Avg #${d.avgRank}` : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-center py-8">No domain data</p>
                                )}
                            </div>
                        </div>

                        {/* Intent Performance Table */}
                        {data.keywordIntents.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6 mt-8">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <AlertCircle size={18} className="text-indigo-600" />
                                    Performance by Search Intent
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Intent</th>
                                                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Keywords</th>
                                                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Avg Rank</th>
                                                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Page 1</th>
                                                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Page 1 Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.keywordIntents.map((intent, i) => (
                                                <tr key={i} className="border-b border-gray-100">
                                                    <td className="py-3 px-4">
                                                        <span className="flex items-center gap-2 capitalize font-medium">
                                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: INTENT_COLORS[intent.intent] || '#6b7280' }} />
                                                            {intent.intent}
                                                        </span>
                                                    </td>
                                                    <td className="text-center py-3 px-4">{intent.count}</td>
                                                    <td className="text-center py-3 px-4 font-medium">{intent.avgRank || '-'}</td>
                                                    <td className="text-center py-3 px-4 text-green-600 font-medium">{intent.top10}</td>
                                                    <td className="text-center py-3 px-4">
                                                        <span className={`px-2 py-0.5 text-xs rounded ${intent.top10Rate >= 50 ? 'bg-green-100 text-green-700' :
                                                            intent.top10Rate >= 25 ? 'bg-amber-100 text-amber-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                            {intent.top10Rate}%
                                                        </span>
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
