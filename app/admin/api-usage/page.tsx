'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import {
    BarChart3, Activity, DollarSign, Clock, AlertCircle,
    Loader2, ArrowLeft, Database, Server
} from 'lucide-react';
import Link from 'next/link';

export default function ApiUsagePage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/api-usage');
                if (!res.ok) throw new Error('Failed to fetch stats');
                const data = await res.json();
                setStats(data.stats);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <Navbar />
                <div className="max-w-3xl mx-auto mt-20 text-center">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Stats</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <Link href="/admin" className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Admin Dashboard
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
                            <Activity size={24} />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">API Usage Monitoring</h1>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-500">Total Credits Used</h3>
                            <DollarSign className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">${stats.totalCredits.toFixed(4)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
                            <Server className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalRequests}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-500">Active Endpoints</h3>
                            <Database className="w-5 h-5 text-purple-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.usageByEndpoint.length}</p>
                    </div>
                </div>

                {/* Usage by Endpoint */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900">Usage by Endpoint</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {stats.usageByEndpoint.map((endpoint: any, idx: number) => (
                            <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">{endpoint._id}</p>
                                    <p className="text-xs text-gray-500">Last used: {new Date(endpoint.lastUsed).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-indigo-600">${endpoint.totalCredits.toFixed(4)}</p>
                                    <p className="text-xs text-gray-500">{endpoint.count} requests</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Logs */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900">Recent API Calls</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Time</th>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Endpoint</th>
                                    <th className="px-6 py-3">Cost</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.recentLogs.map((log: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-900">
                                            {log.userId?.email || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-3 text-gray-600 font-mono text-xs">
                                            {log.apiEndpoint}
                                        </td>
                                        <td className="px-6 py-3 font-bold text-indigo-600">
                                            ${log.creditsUsed.toFixed(5)}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.responseStatus === 20000
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {log.responseStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
