'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
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

                {data.results && data.results.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-indigo-600" />
                                Ranking Results
                            </h2>
                            <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-4 py-1.5 rounded-full shadow-sm">
                                {data.results.length} Keywords
                            </span>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {data.results.map((result, index) => (
                                <div key={index} className="p-6 hover:bg-gray-50/80 transition-colors group">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                    {result.keyword}
                                                </h3>
                                                {result.rank ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                        <CheckCircle className="w-3 h-3 mr-1.5" />
                                                        Found
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                        Not in top 100
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 flex items-center gap-2 truncate max-w-xl">
                                                <Globe className="w-4 h-4 text-gray-400" />
                                                <span className="truncate">{result.url || 'URL not found'}</span>
                                            </p>
                                        </div>

                                        <div className="text-left sm:text-right bg-gray-50 sm:bg-transparent p-4 sm:p-0 rounded-xl">
                                            <div className="text-4xl font-black text-indigo-600 tracking-tight">
                                                {result.rank ? `#${result.rank}` : '-'}
                                            </div>
                                            <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wide">Position</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-4">
                                        {(result.title || result.description) && (
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Meta Data</h4>
                                                {result.title && (
                                                    <p className="text-indigo-600 font-medium text-sm mb-1 hover:underline cursor-pointer">
                                                        {result.title}
                                                    </p>
                                                )}
                                                {result.description && (
                                                    <p className="text-gray-600 text-sm line-clamp-2">
                                                        {result.description}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {result.top_rankers && result.top_rankers.length > 0 && (
                                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Top Competitors</h4>
                                                </div>
                                                <div className="divide-y divide-gray-100">
                                                    {result.top_rankers.map((competitor, idx) => (
                                                        <div key={idx} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                                                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-600 rounded text-xs font-bold">
                                                                {competitor.rank}
                                                            </span>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-gray-900 truncate">{competitor.domain}</p>
                                                                <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline truncate block">
                                                                    {competitor.url}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {(result.etv || result.search_volume) && (
                                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xs font-medium text-gray-500 mb-1">Est. Traffic Value</p>
                                                <p className="font-bold text-gray-900">${result.etv?.toFixed(2) || '0.00'}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xs font-medium text-gray-500 mb-1">CPC</p>
                                                <p className="font-bold text-gray-900">${result.cpc?.toFixed(2) || '-'}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xs font-medium text-gray-500 mb-1">Search Volume</p>
                                                <p className="font-bold text-gray-900">{result.search_volume || '-'}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xs font-medium text-gray-500 mb-1">Competition</p>
                                                <p className="font-bold text-gray-900">{result.competition || '-'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
