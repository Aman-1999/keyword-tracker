'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import {
    CreditCard, TrendingUp, Globe, Loader2, User
} from 'lucide-react';

interface HistoryItem {
    domain: string;
}

export default function UserPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [tokens, setTokens] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [historyRes, tokensRes] = await Promise.all([
                    fetch('/api/user/history'),
                    fetch('/api/user/tokens')
                ]);

                if (historyRes.ok) {
                    const data = await historyRes.json();
                    setHistory(data.history || []);
                }

                if (tokensRes.ok) {
                    const data = await tokensRes.json();
                    setTokens(data.tokens);
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
        .slice(0, 1); // Only need top 1 for this overview

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
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Account Overview</h1>
                    <p className="text-gray-500 mt-2 text-lg">Manage your account and view usage limits.</p>
                </div>

                {/* Profile Section (Placeholder for future profile edit) */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex items-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <User className="h-10 w-10" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">User Account</h2>
                        <p className="text-gray-500">Standard Plan</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Token Card */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CreditCard className="h-24 w-24 text-indigo-600" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wide">Available Tokens</h3>
                            <div className="mt-4 flex items-baseline gap-2">
                                <span className={`text-4xl font-bold ${tokens && tokens > 10 ? 'text-indigo-600' : 'text-amber-500'}`}>
                                    {tokens ?? '-'}
                                </span>
                                <span className="text-gray-400">credits</span>
                            </div>
                            <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-1000 ${tokens && tokens > 10 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.min(((tokens || 0) / 100) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Total Searches Card */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp className="h-24 w-24 text-emerald-600" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wide">Lifetime Searches</h3>
                            <div className="mt-4 flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-emerald-600">{totalSearches}</span>
                                <span className="text-gray-400">searches</span>
                            </div>
                        </div>
                    </div>

                    {/* Most Active Domain Card */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Globe className="h-24 w-24 text-blue-600" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wide">Top Domain</h3>
                            {topDomains.length > 0 ? (
                                <>
                                    <div className="mt-4">
                                        <span className="text-2xl font-bold text-gray-900 truncate block">
                                            {topDomains[0][0]}
                                        </span>
                                    </div>
                                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                        {topDomains[0][1]} checks
                                    </div>
                                </>
                            ) : (
                                <div className="mt-4 text-gray-400 italic">No data yet</div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
