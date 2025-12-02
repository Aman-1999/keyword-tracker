'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import {
    Users, Activity, DollarSign, Settings,
    BarChart3, Shield, Search, Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

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
                    <p className="text-gray-500 ml-16">Manage users, monitor API usage, and configure system settings.</p>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* API Usage Monitoring */}
                    <Link href="/admin/api-usage" className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                                <Activity size={24} />
                            </div>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">MONITORING</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">API Usage</h3>
                        <p className="text-sm text-gray-500">Monitor DataForSEO credit usage and API performance.</p>
                    </Link>

                    {/* User Management (Placeholder) */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm opacity-60 cursor-not-allowed">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                                <Users size={24} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">COMING SOON</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">User Management</h3>
                        <p className="text-sm text-gray-500">Manage user accounts, roles, and permissions.</p>
                    </div>

                    {/* System Settings (Placeholder) */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm opacity-60 cursor-not-allowed">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-gray-50 text-gray-600">
                                <Settings size={24} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">COMING SOON</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">System Settings</h3>
                        <p className="text-sm text-gray-500">Configure global application settings.</p>
                    </div>
                </div>

                {/* Stats Overview */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                ) : stats && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">System Overview</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Searches</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalSearches || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Rankings Found</p>
                                <p className="text-3xl font-bold text-indigo-600">{stats.totalRankings || 0}</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
