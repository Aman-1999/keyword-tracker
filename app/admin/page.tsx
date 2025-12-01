'use client';

import { useEffect, useState } from 'react';
import { Users, Search, TrendingUp, Activity, BarChart3, Globe, Clock, Award } from 'lucide-react';
import Link from 'next/link';

interface Stats {
    totalUsers: number;
    totalSearches: number;
    totalRankings: number;
    usersByRole: Array<{ _id: string; count: number }>;
}

interface RecentSearch {
    domain: string;
    keywords: string[];
    location: string;
    createdAt: string;
}

interface RecentRanking {
    domain: string;
    keyword: string;
    rank: number | null;
    url: string | null;
    location: string;
    device: string;
    createdAt: string;
    se_results_count: number;
    etv: number | null;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
    const [recentRankings, setRecentRankings] = useState<RecentRanking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            const data = await res.json();

            if (data.success) {
                setStats(data.stats);
                setRecentSearches(data.recentSearches);
                setRecentRankings(data.recentRankings);
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    const adminCount = stats?.usersByRole.find(r => r._id === 'admin')?.count || 0;
    const userCount = stats?.usersByRole.find(r => r._id === 'user')?.count || 0;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
                            <p className="mt-1 text-gray-500">Manage users, monitor activity, and view analytics</p>
                        </div>
                        <Link
                            href="/dashboard"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            Go to Tool
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats?.totalUsers || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {adminCount} admins, {userCount} users
                                </p>
                            </div>
                            <div className="bg-indigo-100 p-3 rounded-lg">
                                <Users className="h-8 w-8 text-indigo-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Searches</p>
                                <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats?.totalSearches || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">All time</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <Search className="h-8 w-8 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Rankings</p>
                                <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats?.totalRankings || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">Tracked positions</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <TrendingUp className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">System Status</p>
                                <p className="text-3xl font-extrabold text-green-600 mt-2">Healthy</p>
                                <p className="text-xs text-gray-500 mt-1">99.9% uptime</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <Activity className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Searches */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900">Recent Searches</h2>
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {recentSearches.length > 0 ? (
                                    recentSearches.map((search, index) => (
                                        <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="bg-indigo-100 p-2 rounded-lg">
                                                <Globe className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">{search.domain}</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {search.keywords.slice(0, 3).join(', ')}
                                                    {search.keywords.length > 3 && ` +${search.keywords.length - 3} more`}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                    <span>{search.location}</span>
                                                    <span>•</span>
                                                    <span>{new Date(search.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No recent searches</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Rankings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900">Recent Rankings</h2>
                                <BarChart3 className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {recentRankings.length > 0 ? (
                                    recentRankings.slice(0, 10).map((ranking, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">{ranking.keyword}</p>
                                                <p className="text-sm text-gray-600 truncate">{ranking.domain}</p>
                                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                    <span>{ranking.location}</span>
                                                    <span>•</span>
                                                    <span className="capitalize">{ranking.device}</span>
                                                </div>
                                            </div>
                                            <div className="text-right ml-4">
                                                {ranking.rank ? (
                                                    <>
                                                        <div className="text-2xl font-bold text-indigo-600">#{ranking.rank}</div>
                                                        {ranking.etv && (
                                                            <div className="text-xs text-gray-500 mt-1">${ranking.etv.toFixed(2)} ETV</div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="text-sm text-gray-400">Not ranked</div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No recent rankings</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link
                        href="/admin/users"
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-100 p-3 rounded-lg">
                                <Users className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Manage Users</h3>
                                <p className="text-sm text-gray-600">View and manage all users</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/admin/analytics"
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Analytics</h3>
                                <p className="text-sm text-gray-600">View detailed analytics</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/admin/settings"
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <Award className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Settings</h3>
                                <p className="text-sm text-gray-600">Configure system settings</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
