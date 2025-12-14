'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import DetailedResultsTable from '@/components/DetailedResultsTable';
import {
    ArrowLeft, Globe, MapPin, Loader2,
    CheckCircle, AlertCircle, TrendingUp, Calendar, Download
} from 'lucide-react';
import { exportAsJSON, exportAsCSV, exportAsExcel, prepareExportData } from '@/lib/exportUtils';

interface ResultItem {
    keyword: string;
    rank: number | null;
    url: string | null;
    title?: string;
    description?: string;
    etv?: number;
    search_volume?: number;
    cpc?: number;
    competition?: number;
    top_rankers?: Array<{
        rank: number;
        domain: string;
        url: string;
        title?: string;
        description?: string;
    }>;
    status: string;
}

interface ResultsData {
    domain: string;
    location: string;
    status: 'processing' | 'completed';
    progress: {
        total: number;
        completed: number;
        pending: number;
    };
    createdAt: string;
    results: ResultItem[];
}

export default function ResultsPage() {
    const params = useParams();
    const historyId = params.id as string;

    const [data, setData] = useState<ResultsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [polling, setPolling] = useState(false);

    const fetchResults = useCallback(async () => {
        try {
            const res = await fetch(`/api/check-rank/results/${historyId}`);
            if (!res.ok) {
                if (res.status === 404) throw new Error('Results not found');
                throw new Error('Failed to fetch results');
            }
            const responseData = await res.json();
            setData(responseData);

            if (responseData.status === 'processing') {
                setPolling(true);
            } else {
                setPolling(false);
            }
        } catch (err: any) {
            setError(err.message);
            setPolling(false);
        } finally {
            setLoading(false);
        }
    }, [historyId]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    useEffect(() => {
        if (!polling) return;
        const interval = setInterval(() => {
            fetchResults();
        }, 5000);
        return () => clearInterval(interval);
    }, [polling, fetchResults]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleExport = (format: 'json' | 'csv' | 'excel') => {
        if (!data || !data.results || data.results.length === 0) return;
        const exportData = prepareExportData(data.results);
        const filename = `${data.domain}-${new Date().toISOString().split('T')[0]}`;

        switch (format) {
            case 'json':
                exportAsJSON(exportData, filename);
                break;
            case 'csv':
                exportAsCSV(exportData, filename);
                break;
            case 'excel':
                exportAsExcel(exportData, filename);
                break;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <Navbar />
                <div className="max-w-3xl mx-auto mt-20 text-center">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Results</h2>
                        <p className="text-gray-600 mb-6">{error || 'Results not found'}</p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Link>
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
                    <Link
                        href="/history"
                        className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to History
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">{data.domain}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${data.status === 'completed'
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : 'bg-blue-100 text-blue-700 border-blue-200'
                                    }`}>
                                    {data.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {data.location}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(data.createdAt)}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {polling && (
                                <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                    <span className="text-sm font-medium text-indigo-700">
                                        Processing: {data.progress.completed}/{data.progress.total} keywords
                                    </span>
                                </div>
                            )}

                            {data.status === 'completed' && data.results.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleExport('json')}
                                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
                                        title="Export as JSON"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        JSON
                                    </button>
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
                                        title="Export as CSV"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        CSV
                                    </button>
                                    <button
                                        onClick={() => handleExport('excel')}
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                                        title="Export as Excel"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Excel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {data.status === 'processing' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                        <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                            <span>Progress</span>
                            <span>{Math.round((data.progress.completed / data.progress.total) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${(data.progress.completed / data.progress.total) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-3 text-center">
                            Checking rankings directly with DataForSEO...
                        </p>
                    </div>
                )}

                <DetailedResultsTable results={data.results} />
            </main>
        </div>
    );
}
