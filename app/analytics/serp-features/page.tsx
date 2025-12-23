'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CustomSelect from '@/components/CustomSelect';
import {
    Sparkles, Loader2, ChevronLeft, MessageSquare,
    Target, MapPin, Image, Link2, HelpCircle, Globe
} from 'lucide-react';
import Link from 'next/link';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface FeatureCount {
    count: number;
    percent: number;
}

interface SerpFeaturesData {
    summary: {
        totalChecks: number;
        features: {
            aiOverview: FeatureCount;
            peopleAlsoAsk: FeatureCount;
            featuredSnippet: FeatureCount;
            localPack: FeatureCount;
            sitelinks: FeatureCount;
            images: FeatureCount;
            faq: FeatureCount;
        };
    };
    trends: Array<{
        date: string;
        total: number;
        aiOverview: number;
        paa: number;
        featuredSnippet: number;
        aiOverviewPercent: number;
    }>;
    keywords: {
        withAiOverview: Array<{ domain: string; keyword: string; rank: number | null; lastSeen: string }>;
        withPaa: Array<{ domain: string; keyword: string; rank: number | null; paaCount: number; lastSeen: string }>;
        withFeaturedSnippet: Array<{ domain: string; keyword: string; rank: number | null; lastSeen: string }>;
    };
}

const FEATURE_COLORS: Record<string, string> = {
    aiOverview: '#8b5cf6',
    peopleAlsoAsk: '#3b82f6',
    featuredSnippet: '#f59e0b',
    localPack: '#10b981',
    sitelinks: '#6366f1',
    images: '#ec4899',
    faq: '#14b8a6',
};

const FEATURE_LABELS: Record<string, string> = {
    aiOverview: 'AI Overview',
    peopleAlsoAsk: 'People Also Ask',
    featuredSnippet: 'Featured Snippet',
    localPack: 'Local Pack',
    sitelinks: 'Sitelinks',
    images: 'Images',
    faq: 'FAQ Schema',
};

const FEATURE_ICONS: Record<string, React.ReactNode> = {
    aiOverview: <Sparkles size={18} />,
    peopleAlsoAsk: <MessageSquare size={18} />,
    featuredSnippet: <Target size={18} />,
    localPack: <MapPin size={18} />,
    sitelinks: <Link2 size={18} />,
    images: <Image size={18} />,
    faq: <HelpCircle size={18} />,
};

export default function SerpFeaturesPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<SerpFeaturesData | null>(null);
    const [days, setDays] = useState(30);
    const [domain, setDomain] = useState('');
    const [domains, setDomains] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'aiOverview' | 'paa' | 'featuredSnippet'>('aiOverview');

    useEffect(() => {
        const fetchDomains = async () => {
            try {
                const res = await fetch('/api/v1/analytics/domains?limit=50');
                if (res.ok) {
                    const result = await res.json();
                    setDomains(result.data?.map((d: { domain: string }) => d.domain) || []);
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
                const params = new URLSearchParams({ days: days.toString() });
                if (domain) params.append('domain', domain);

                const res = await fetch(`/api/v1/analytics/serp-features?${params}`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result.data);
                }
            } catch (err) {
                console.error('Failed to fetch SERP features:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [days, domain]);

    const chartData = data?.summary.features
        ? Object.entries(data.summary.features).map(([key, value]) => ({
            name: FEATURE_LABELS[key] || key,
            value: value.percent,
            count: value.count,
            fill: FEATURE_COLORS[key] || '#6b7280',
        }))
        : [];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric'
        });
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
                        <Sparkles className="h-7 w-7 text-purple-600" />
                        SERP Features Analytics
                    </h1>
                    <p className="text-gray-500 mt-1">Analyze SERP features across your tracked keywords</p>
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
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                ) : data ? (
                    <>
                        {/* Feature Cards Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
                            {Object.entries(data.summary.features).map(([key, value]) => (
                                <div
                                    key={key}
                                    className="bg-white p-4 rounded-xl border border-gray-200 text-center"
                                    style={{ borderLeftColor: FEATURE_COLORS[key], borderLeftWidth: '3px' }}
                                >
                                    <div className="flex justify-center mb-2" style={{ color: FEATURE_COLORS[key] }}>
                                        {FEATURE_ICONS[key]}
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{value.percent}%</p>
                                    <p className="text-xs text-gray-500 mt-1">{FEATURE_LABELS[key]}</p>
                                    <p className="text-xs text-gray-400">{value.count} results</p>
                                </div>
                            ))}
                        </div>

                        {/* Chart */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Feature Distribution</h2>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                                        <Tooltip
                                            formatter={(value: number, name: string, props: any) => [`${value}% (${props?.payload?.count} results)`, 'Occurrence']}
                                            contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Keywords with Features */}
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                            <div className="border-b border-gray-100">
                                <div className="flex">
                                    <button
                                        onClick={() => setActiveTab('aiOverview')}
                                        className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'aiOverview'
                                            ? 'border-purple-600 text-purple-600 bg-purple-50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <Sparkles size={16} className="inline mr-2" />
                                        AI Overview ({data.keywords.withAiOverview.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('paa')}
                                        className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'paa'
                                            ? 'border-blue-600 text-blue-600 bg-blue-50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <MessageSquare size={16} className="inline mr-2" />
                                        People Also Ask ({data.keywords.withPaa.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('featuredSnippet')}
                                        className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'featuredSnippet'
                                            ? 'border-amber-600 text-amber-600 bg-amber-50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <Target size={16} className="inline mr-2" />
                                        Featured Snippet ({data.keywords.withFeaturedSnippet.length})
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto">
                                {activeTab === 'aiOverview' && (
                                    data.keywords.withAiOverview.length > 0 ? (
                                        <table className="w-full">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Keyword</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Domain</th>
                                                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Rank</th>
                                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Last Seen</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {data.keywords.withAiOverview.map((kw, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{kw.keyword}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">{kw.domain}</td>
                                                        <td className="px-4 py-3 text-center text-sm font-semibold text-indigo-600">{kw.rank || '-'}</td>
                                                        <td className="px-4 py-3 text-right text-xs text-gray-400">{formatDate(kw.lastSeen)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-8 text-center text-gray-500">No keywords with AI Overview found</div>
                                    )
                                )}

                                {activeTab === 'paa' && (
                                    data.keywords.withPaa.length > 0 ? (
                                        <table className="w-full">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Keyword</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Domain</th>
                                                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Rank</th>
                                                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">PAA Count</th>
                                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Last Seen</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {data.keywords.withPaa.map((kw, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{kw.keyword}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">{kw.domain}</td>
                                                        <td className="px-4 py-3 text-center text-sm font-semibold text-indigo-600">{kw.rank || '-'}</td>
                                                        <td className="px-4 py-3 text-center text-sm text-gray-600">{kw.paaCount}</td>
                                                        <td className="px-4 py-3 text-right text-xs text-gray-400">{formatDate(kw.lastSeen)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-8 text-center text-gray-500">No keywords with People Also Ask found</div>
                                    )
                                )}

                                {activeTab === 'featuredSnippet' && (
                                    data.keywords.withFeaturedSnippet.length > 0 ? (
                                        <table className="w-full">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Keyword</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Domain</th>
                                                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Rank</th>
                                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Last Seen</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {data.keywords.withFeaturedSnippet.map((kw, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{kw.keyword}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">{kw.domain}</td>
                                                        <td className="px-4 py-3 text-center text-sm font-semibold text-indigo-600">{kw.rank || '-'}</td>
                                                        <td className="px-4 py-3 text-right text-xs text-gray-400">{formatDate(kw.lastSeen)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-8 text-center text-gray-500">No keywords with Featured Snippet found</div>
                                    )
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                        No SERP features data available
                    </div>
                )}
            </main>
        </div>
    );
}
