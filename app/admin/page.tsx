'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import {
    Users, Activity, Settings,
    Shield, Loader2, TrendingUp, Server,
    BarChart3, Database, Cpu, HardDrive
} from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
    summary: {
        totalUsers: number;
        newUsers: number;
        activeUsers: number;
        totalSearches: number;
        recentSearches: number;
        totalRankings: number;
        totalCreditsUsed: number;
        totalApiRequests: number;
    };
    usersByRole: Record<string, number>;
    charts: {
        searchesByDay: Array<{ date: string; searches: number; keywords: number }>;
    };
    rankings: {
        topDomains: Array<{ domain: string; count: number }>;
        topKeywords: Array<{ keyword: string; count: number }>;
        distribution: Record<string, number>;
    };
}

interface SystemHealth {
    status: string;
    uptime: number;
    database: { status: string };
    collections: Record<string, number>;
    memory: Record<string, string>;
    cache: { total: number; active: number; expired: number };
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, healthRes] = await Promise.all([
                    fetch('/api/v1/admin/analytics/overview?days=30'),
                    fetch('/api/v1/admin/system/health'),
                ]);

                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setStats(data.data);
                }
                if (healthRes.ok) {
                    const data = await healthRes.json();
                    setHealth(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch admin data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${mins}m`;
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-xl bg-indigo-600 text-white">
                            <Shield size={24} />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    </div>
                    <p className="text-gray-500 ml-16">Manage users, monitor API usage, and view system analytics.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                ) : (
                    <>
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="h-5 w-5 text-indigo-600" />
                                    <span className="text-sm font-medium text-gray-500">Total Users</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats?.summary.totalUsers || 0}</p>
                                <p className="text-xs text-green-600 mt-1">+{stats?.summary.newUsers || 0} new (30d)</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <Activity className="h-5 w-5 text-blue-600" />
                                    <span className="text-sm font-medium text-gray-500">Active Users</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats?.summary.activeUsers || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                    <span className="text-sm font-medium text-gray-500">Total Searches</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats?.summary.totalSearches || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">{stats?.summary.recentSearches || 0} recent</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <Database className="h-5 w-5 text-purple-600" />
                                    <span className="text-sm font-medium text-gray-500">API Credits Used</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats?.summary.totalCreditsUsed || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">{stats?.summary.totalApiRequests || 0} requests</p>
                            </div>
                        </div>

                        {/* Quick Actions Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <Link href="/admin/users" className="group bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                                        <Users size={20} />
                                    </div>
                                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">MANAGE</span>
                                </div>
                                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">User Management</h3>
                                <p className="text-sm text-gray-500 mt-1">Manage accounts & tokens</p>
                            </Link>

                            <Link href="/admin/api-usage" className="group bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                                        <Activity size={20} />
                                    </div>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">MONITOR</span>
                                </div>
                                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">API Usage</h3>
                                <p className="text-sm text-gray-500 mt-1">Monitor credit usage</p>
                            </Link>

                            <Link href="/analytics" className="group bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors">
                                        <BarChart3 size={20} />
                                    </div>
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">ANALYZE</span>
                                </div>
                                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Analytics</h3>
                                <p className="text-sm text-gray-500 mt-1">View ranking analytics</p>
                            </Link>

                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm opacity-60">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-gray-50 text-gray-600">
                                        <Settings size={20} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">SOON</span>
                                </div>
                                <h3 className="font-bold text-gray-900">Settings</h3>
                                <p className="text-sm text-gray-500 mt-1">System configuration</p>
                            </div>
                        </div>

                        {/* System Health */}
                        {health && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Server className="h-5 w-5 text-gray-500" />
                                        System Health
                                    </h2>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${health.status === 'healthy'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                        {health.status === 'healthy' ? '● Healthy' : '● Unhealthy'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Database</p>
                                        <p className="text-lg font-semibold text-gray-900 capitalize">{health.database.status}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Uptime</p>
                                        <p className="text-lg font-semibold text-gray-900">{formatUptime(health.uptime)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Memory (Heap)</p>
                                        <p className="text-lg font-semibold text-gray-900">{health.memory.heapUsed}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Cache</p>
                                        <p className="text-lg font-semibold text-gray-900">{health.cache.active} active</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Top Domains & Keywords */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Top Domains (30d)</h2>
                                <div className="space-y-3">
                                    {stats?.rankings.topDomains.slice(0, 5).map((item, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                            <span className="text-sm font-medium text-gray-900">{item.domain}</span>
                                            <span className="text-sm text-gray-500">{item.count} searches</span>
                                        </div>
                                    )) || <p className="text-sm text-gray-500">No data</p>}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Top Keywords (30d)</h2>
                                <div className="space-y-3">
                                    {stats?.rankings.topKeywords.slice(0, 5).map((item, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                            <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{item.keyword}</span>
                                            <span className="text-sm text-gray-500">{item.count} times</span>
                                        </div>
                                    )) || <p className="text-sm text-gray-500">No data</p>}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
