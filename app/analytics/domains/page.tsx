'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import {
    Globe, Loader2, ChevronLeft, ChevronRight, Search,
    Target, Sparkles, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';

interface DomainListItem {
    domain: string;
    searches: number;
    lastSearched: string;
    avgRank: number | null;
    bestRank: number | null;
    totalKeywords: number;
    rankedKeywords: number;
}

interface DomainDetail {
    domain: string;
    summary: {
        totalChecks: number;
        uniqueKeywords: number;
        rankedKeywords: number;
        avgRank: number | null;
        bestRank: number | null;
        worstRank: number | null;
    };
    serpFeatures: {
        aiOverview: { count: number; percent: number };
        peopleAlsoAsk: { count: number; percent: number };
        featuredSnippet: { count: number; percent: number };
    };
    keywords: Array<{
        keyword: string;
        currentRank: number | null;
        avgRank: number | null;
        bestRank: number | null;
        checks: number;
        hasAiOverview: boolean;
        hasPaa: boolean;
    }>;
    rankHistory: Array<{
        date: string;
        avgRank: number;
        bestRank: number;
        keywords: number;
    }>;
}

export default function DomainAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [domains, setDomains] = useState<DomainListItem[]>([]);
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [domainDetail, setDomainDetail] = useState<DomainDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchDomains = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/v1/analytics/domains?page=${page}&limit=10`);
                if (res.ok) {
                    const data = await res.json();
                    setDomains(data.data || []);
                    setTotalPages(data.pagination?.totalPages || 1);
                }
            } catch (err) {
                console.error('Failed to fetch domains:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDomains();
    }, [page]);

    useEffect(() => {
        if (!selectedDomain) {
            setDomainDetail(null);
            return;
        }

        const fetchDetail = async () => {
            setDetailLoading(true);
            try {
                const res = await fetch(`/api/v1/analytics/domains?domain=${encodeURIComponent(selectedDomain)}&days=30`);
                if (res.ok) {
                    const data = await res.json();
                    setDomainDetail(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch domain detail:', err);
            } finally {
                setDetailLoading(false);
            }
        };
        fetchDetail();
    }, [selectedDomain]);

    const filteredDomains = domains.filter(d =>
        d.domain.toLowerCase().includes(search.toLowerCase())
    );

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
                        <Globe className="h-7 w-7 text-indigo-600" />
                        Domain Analytics
                    </h1>
                    <p className="text-gray-500 mt-1">Analyze performance across your tracked domains</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Domain List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-100">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search domains..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-indigo-600" size={24} />
                                </div>
                            ) : filteredDomains.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No domains found
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                                    {filteredDomains.map((d) => (
                                        <button
                                            key={d.domain}
                                            onClick={() => setSelectedDomain(d.domain)}
                                            className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedDomain === d.domain ? 'bg-indigo-50 border-l-2 border-indigo-600' : ''
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-gray-900 truncate">{d.domain}</span>
                                                {d.avgRank && (
                                                    <span className="text-sm text-indigo-600 font-semibold">#{Math.round(d.avgRank)}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span>{d.totalKeywords} keywords</span>
                                                <span>•</span>
                                                <span>{d.searches} searches</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between p-3 border-t border-gray-100">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-1 disabled:opacity-50"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="p-1 disabled:opacity-50"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Domain Detail */}
                    <div className="lg:col-span-2">
                        {!selectedDomain ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Select a domain to view detailed analytics</p>
                            </div>
                        ) : detailLoading ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 flex justify-center">
                                <Loader2 className="animate-spin text-indigo-600" size={32} />
                            </div>
                        ) : domainDetail ? (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Keywords</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{domainDetail.summary.uniqueKeywords}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Rank</p>
                                        <p className="text-2xl font-bold text-indigo-600 mt-1">{domainDetail.summary.avgRank || '-'}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Best Rank</p>
                                        <p className="text-2xl font-bold text-green-600 mt-1">{domainDetail.summary.bestRank || '-'}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Checks</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{domainDetail.summary.totalChecks}</p>
                                    </div>
                                </div>

                                {/* SERP Features */}
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <h3 className="font-semibold text-gray-900 mb-4">SERP Features Presence</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                                            <Sparkles className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                                            <p className="text-lg font-bold text-purple-700">{domainDetail.serpFeatures.aiOverview.percent}%</p>
                                            <p className="text-xs text-purple-600">AI Overview</p>
                                        </div>
                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                            <MessageSquare className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                                            <p className="text-lg font-bold text-blue-700">{domainDetail.serpFeatures.peopleAlsoAsk.percent}%</p>
                                            <p className="text-xs text-blue-600">People Also Ask</p>
                                        </div>
                                        <div className="text-center p-3 bg-amber-50 rounded-lg">
                                            <Target className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                                            <p className="text-lg font-bold text-amber-700">{domainDetail.serpFeatures.featuredSnippet.percent}%</p>
                                            <p className="text-xs text-amber-600">Featured Snippet</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Rank History Chart */}
                                {domainDetail.rankHistory.length > 0 && (
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h3 className="font-semibold text-gray-900 mb-4">Rank History (30 days)</h3>
                                        <div className="h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={domainDetail.rankHistory}>
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
                                                        width={35}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                                    <Line type="monotone" dataKey="avgRank" stroke="#4f46e5" strokeWidth={2} dot={{ r: 2 }} name="Avg Rank" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {/* Keywords Table */}
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="px-5 py-4 border-b border-gray-100">
                                        <h3 className="font-semibold text-gray-900">Keyword Rankings</h3>
                                    </div>
                                    <div className="overflow-x-auto max-h-[400px]">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Keyword</th>
                                                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Rank</th>
                                                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Best</th>
                                                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Features</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {domainDetail.keywords.map((kw, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate">{kw.keyword}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`font-semibold ${kw.currentRank && kw.currentRank <= 10 ? 'text-green-600' : 'text-gray-900'}`}>
                                                                {kw.currentRank || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-sm text-gray-500">{kw.bestRank || '-'}</td>
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
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </main>
        </div>
    );
}
