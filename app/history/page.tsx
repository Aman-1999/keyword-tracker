'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
    Search, Calendar, MapPin, TrendingUp, Download, Filter,
    ChevronDown, Loader2, AlertCircle, FileJson, FileSpreadsheet, File
} from 'lucide-react';
import { exportAsJSON, exportAsCSV, exportAsExcel, prepareExportData } from '@/lib/exportUtils';

interface HistoryItem {
    _id: string;
    domain: string;
    location: string;
    location_code: number;
    keywords: string[];
    createdAt: string;
    taskIds: string[];
}

export default function HistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [history, searchQuery, locationFilter, dateFilter]);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/user/history');
            if (!res.ok) throw new Error('Failed to fetch history');
            const data = await res.json();
            setHistory(data.history || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...history];

        // Search filter (domain or keywords)
        if (searchQuery) {
            filtered = filtered.filter(item =>
                item.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Location filter
        if (locationFilter) {
            filtered = filtered.filter(item =>
                item.location.toLowerCase().includes(locationFilter.toLowerCase())
            );
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const filterDate = new Date();

            switch (dateFilter) {
                case 'today':
                    filterDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
            }

            filtered = filtered.filter(item =>
                new Date(item.createdAt) >= filterDate
            );
        }

        setFilteredHistory(filtered);
    };

    const handleExportHistory = async (format: 'json' | 'csv' | 'excel') => {
        if (filteredHistory.length === 0) return;

        // For history export, we'll export a summary
        const exportData = filteredHistory.map(item => ({
            domain: item.domain,
            location: item.location,
            keywords: item.keywords.join(', '),
            date: new Date(item.createdAt).toLocaleDateString(),
            totalKeywords: item.keywords.length,
        }));

        const filename = `search-history-${new Date().toISOString().split('T')[0]}`;

        switch (format) {
            case 'json':
                const jsonString = JSON.stringify(exportData, null, 2);
                const jsonBlob = new Blob([jsonString], { type: 'application/json' });
                downloadBlob(jsonBlob, `${filename}.json`);
                break;
            case 'csv':
                const headers = ['Domain', 'Location', 'Keywords', 'Date', 'Total Keywords'];
                const csvRows = [
                    headers.join(','),
                    ...exportData.map(row => [
                        escapeCSV(row.domain),
                        escapeCSV(row.location),
                        escapeCSV(row.keywords),
                        row.date,
                        row.totalKeywords,
                    ].join(','))
                ];
                const csvString = csvRows.join('\n');
                const csvBlob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                downloadBlob(csvBlob, `${filename}.csv`);
                break;
            case 'excel':
                // Using CSV for Excel compatibility
                const excelHeaders = ['Domain', 'Location', 'Keywords', 'Date', 'Total Keywords'];
                const excelRows = [
                    excelHeaders.join(','),
                    ...exportData.map(row => [
                        escapeCSV(row.domain),
                        escapeCSV(row.location),
                        escapeCSV(row.keywords),
                        row.date,
                        row.totalKeywords,
                    ].join(','))
                ];
                const excelString = excelRows.join('\n');
                const excelBlob = new Blob([excelString], { type: 'text/csv;charset=utf-8;' });
                downloadBlob(excelBlob, `${filename}.csv`);
                break;
        }
    };

    const escapeCSV = (value: string): string => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    };

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const uniqueLocations = Array.from(new Set(history.map(item => item.location)));

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Search History</h1>
                            <p className="text-gray-500 mt-2">View and manage your ranking searches</p>
                        </div>

                        {filteredHistory.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleExportHistory('json')}
                                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
                                    title="Export as JSON"
                                >
                                    <FileJson className="w-4 h-4 mr-2" />
                                    JSON
                                </button>
                                <button
                                    onClick={() => handleExportHistory('csv')}
                                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
                                    title="Export as CSV"
                                >
                                    <File className="w-4 h-4 mr-2" />
                                    CSV
                                </button>
                                <button
                                    onClick={() => handleExportHistory('excel')}
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                                    title="Export as Excel"
                                >
                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                    Excel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                                <Filter className="w-4 h-4" />
                                {showFilters ? 'Hide Filters' : 'Show Filters'}
                                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            </button>
                            <span className="text-sm text-gray-500">
                                {filteredHistory.length} of {history.length} results
                            </span>
                        </div>

                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Search Domain/Keywords
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 block w-full rounded-lg border-gray-200 bg-gray-50/50 p-2.5 text-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Location
                                    </label>
                                    <select
                                        value={locationFilter}
                                        onChange={(e) => setLocationFilter(e.target.value)}
                                        className="block w-full rounded-lg border-gray-200 bg-gray-50/50 p-2.5 text-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500 transition-all"
                                    >
                                        <option value="">All Locations</option>
                                        {uniqueLocations.map((location, idx) => (
                                            <option key={idx} value={location}>{location}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date Range
                                    </label>
                                    <select
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value as any)}
                                        className="block w-full rounded-lg border-gray-200 bg-gray-50/50 p-2.5 text-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500 transition-all"
                                    >
                                        <option value="all">All Time</option>
                                        <option value="today">Today</option>
                                        <option value="week">Last 7 Days</option>
                                        <option value="month">Last 30 Days</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {filteredHistory.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Search History</h3>
                        <p className="text-gray-500 mb-6">
                            {searchQuery || locationFilter || dateFilter !== 'all'
                                ? 'No results match your filters. Try adjusting your search criteria.'
                                : 'Start tracking your rankings by running your first search.'}
                        </p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            New Search
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredHistory.map((item) => (
                            <div
                                key={item._id}
                                onClick={() => router.push(`/results/${item._id}`)}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                                            {item.domain}
                                        </h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {item.location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(item.createdAt)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Search className="w-4 h-4" />
                                                {item.keywords.length} keywords
                                            </span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {item.keywords.slice(0, 5).map((keyword, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
                                                >
                                                    {keyword}
                                                </span>
                                            ))}
                                            {item.keywords.length > 5 && (
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                                    +{item.keywords.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/results/${item._id}`);
                                            }}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                                        >
                                            View Results
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
