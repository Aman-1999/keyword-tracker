'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CustomSelect from '@/components/CustomSelect';
import {
    Search, Calendar, MapPin, TrendingUp, Download,
    Loader2, AlertCircle, FileJson, FileSpreadsheet, File
} from 'lucide-react';
import { exportAsJSON, exportAsCSV, exportAsExcel, prepareExportData } from '@/lib/exportUtils';
import * as XLSX from 'xlsx';

interface HistoryItem {
    _id: string;
    domain: string;
    location: string;
    location_code: number;
    keywords: string[];
    createdAt: string;
    taskIds: string[];
}

interface KeywordHistoryItem {
    _id: string;
    searchId: string;
    domain: string;
    keyword: string;
    location: string;
    location_code: number;
    createdAt: string;
    taskId: string;
    rank: number | null;
    landingUrl: string | null;
    totalResults: number | null;
    hasPAA: boolean;
    hasAIOverview: boolean;
    totalItems: number;
    metadata: {
        language?: string;
        device?: string;
        os?: string;
        checkType?: string;
    };
    search_volume?: number | null;
    cpc?: number | null;
    competition?: number | null;
    refinementChips?: string[];
    relatedSearches?: string[];
    serpItemTypes?: string[];
    featureCounts?: {
        paa: number;
        aiOverview: number;
        relatedSearches: number;
        refinementChips: number;
        topRankers: number;
    };
}

interface ExportDataGrouped {
    domain: string;
    location: string;
    keywords: string;
    date: string;
    totalKeywords: number;
}

interface ExportDataKeyword {
    keyword: string;
    domain: string;
    location: string;
    rank: string | number;
    landingUrl: string;
    totalResults: string | number;
    hasPAA: string;
    hasAIOverview: string;
    date: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export default function HistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<(HistoryItem | KeywordHistoryItem)[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Pagination states
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [viewMode, setViewMode] = useState<'grouped' | 'keywords'>('grouped');

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset to page 1 on search
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchHistory();
    }, [page, limit, debouncedSearch, locationFilter, dateFilter, viewMode]);

    const fetchHistory = async () => {
        try {
            setLoading(true);

            // Build query parameters
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', limit.toString());
            params.append('viewMode', viewMode);

            if (debouncedSearch) params.append('search', debouncedSearch);
            if (locationFilter) params.append('location', locationFilter);

            // Date filter
            if (dateFilter !== 'all') {
                const now = new Date();
                let dateFrom = new Date();

                switch (dateFilter) {
                    case 'today':
                        dateFrom.setHours(0, 0, 0, 0);
                        break;
                    case 'week':
                        dateFrom.setDate(now.getDate() - 7);
                        break;
                    case 'month':
                        dateFrom.setMonth(now.getMonth() - 1);
                        break;
                }

                params.append('dateFrom', dateFrom.toISOString());
            }

            const res = await fetch(`/api/user/history?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch history');
            const data = await res.json();
            setHistory(data.history || []);
            setPagination(data.pagination);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExportHistory = async (format: 'json' | 'csv' | 'excel') => {
        if (history.length === 0) return;

        let exportData: (ExportDataGrouped | ExportDataKeyword)[];

        if (viewMode === 'keywords') {
            // Data is already in keyword format from API
            exportData = (history as KeywordHistoryItem[]).map((item) => ({
                keyword: item.keyword,
                domain: item.domain,
                location: item.location,
                rank: item.rank || 'Not Found',
                landingUrl: item.landingUrl || 'N/A',
                totalResults: item.totalResults || 'N/A',
                hasPAA: item.hasPAA ? 'Yes' : 'No',
                hasAIOverview: item.hasAIOverview ? 'Yes' : 'No',
                date: formatDate(item.createdAt)
            }));
        } else {
            // Grouped format
            exportData = (history as HistoryItem[]).map((item) => ({
                domain: item.domain,
                location: item.location,
                keywords: item.keywords?.join(', ') || '',
                date: formatDate(item.createdAt),
                totalKeywords: item.keywords?.length || 0,
            }));
        }

        const filename = `search-history-${new Date().toISOString().split('T')[0]}`;

        switch (format) {
            case 'json':
                const jsonString = JSON.stringify(exportData, null, 2);
                const jsonBlob = new Blob([jsonString], { type: 'application/json' });
                downloadBlob(jsonBlob, `${filename}.json`);
                break;
            case 'csv':
                const headers = viewMode === 'keywords'
                    ? ['Keyword', 'Domain', 'Location', 'Rank', 'Landing URL', 'Total Results', 'Has PAA', 'Has AI Overview', 'Date']
                    : ['Domain', 'Location', 'Keywords', 'Date', 'Total Keywords'];
                const csvRows = [
                    headers.join(','),
                    ...exportData.map(row => {
                        if (viewMode === 'keywords') {
                            const kRow = row as ExportDataKeyword;
                            return [
                                escapeCSV(kRow.keyword),
                                escapeCSV(kRow.domain),
                                escapeCSV(kRow.location),
                                kRow.rank,
                                escapeCSV(kRow.landingUrl),
                                kRow.totalResults,
                                kRow.hasPAA,
                                kRow.hasAIOverview,
                                kRow.date
                            ].join(',');
                        } else {
                            const gRow = row as ExportDataGrouped;
                            return [
                                escapeCSV(gRow.domain),
                                escapeCSV(gRow.location),
                                escapeCSV(gRow.keywords),
                                gRow.date,
                                gRow.totalKeywords
                            ].join(',');
                        }
                    })
                ];
                const csvString = csvRows.join('\n');
                const csvBlob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                downloadBlob(csvBlob, `${filename}.csv`);
                break;
            case 'excel':
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Search History");
                XLSX.writeFile(workbook, `${filename}.xlsx`);
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

    const uniqueLocations = Array.from(new Set(history.map(item => item.location))).filter(Boolean);

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

                        {history.length > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 mr-2">
                                    <button
                                        onClick={() => setViewMode('grouped')}
                                        className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${viewMode === 'grouped'
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        By Search
                                    </button>
                                    <button
                                        onClick={() => setViewMode('keywords')}
                                        className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${viewMode === 'keywords'
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        By Keyword
                                    </button>
                                </div>
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

                    {/* Filters - Always Visible */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                            <span className="text-sm text-gray-500">
                                {pagination ? `${pagination.total} total results` : `${history.length} results`}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <input
                                    type="text"
                                    placeholder="Filter by location..."
                                    value={locationFilter}
                                    onChange={(e) => {
                                        setLocationFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="block w-full rounded-lg border-gray-200 bg-gray-50/50 p-2.5 text-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date Range
                                </label>
                                <CustomSelect
                                    value={dateFilter}
                                    onChange={(val: string) => {
                                        setDateFilter(val as any);
                                        setPage(1);
                                    }}
                                    options={[
                                        { value: "all", label: "All Time" },
                                        { value: "today", label: "Today" },
                                        { value: "week", label: "Last 7 Days" },
                                        { value: "month", label: "Last 30 Days" }
                                    ]}
                                    placeholder="Select date range"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-900 mb-1">Error Loading History</h3>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center justify-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                            <span className="text-gray-600">Loading history...</span>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && history.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Search History</h3>
                        <p className="text-gray-500 mb-6">
                            Start tracking your rankings by performing a search from the dashboard.
                        </p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}

                {/* History Table */}
                {!loading && !error && history.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16">
                                            #
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {viewMode === 'grouped' ? 'Domain' : 'Keyword'}
                                        </th>
                                        {viewMode === 'grouped' && (
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-48">
                                                Keywords
                                            </th>
                                        )}
                                        {viewMode === 'keywords' && (
                                            <>
                                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Domain
                                                </th>
                                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Rank
                                                </th>
                                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-20" title="AI Overview Items">
                                                    AI
                                                </th>
                                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-20" title="People Also Ask Items">
                                                    PAA
                                                </th>
                                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-24" title="SERP Features">
                                                    !
                                                </th>
                                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-20" title="Related Searches">
                                                    Related
                                                </th>
                                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-20" title="Refinement Chips">
                                                    Chips
                                                </th>
                                            </>
                                        )}
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Location
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {viewMode === 'grouped' ? (
                                        // Grouped by search
                                        (history as HistoryItem[]).map((item, index) => {
                                            // Calculate the actual row number based on pagination
                                            const rowNumber = pagination
                                                ? ((pagination.page - 1) * pagination.limit) + index + 1
                                                : index + 1;

                                            return (
                                                <tr key={item._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/results/${item._id}`)}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {rowNumber}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-bold text-gray-900">{item.domain}</div>
                                                    </td>
                                                    <td className="px-6 py-4 w-48">
                                                        <div className="flex flex-wrap gap-2">
                                                            {(item.keywords || []).slice(0, 2).map((keyword, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium truncate max-w-[100px]"
                                                                    title={keyword}
                                                                >
                                                                    {keyword}
                                                                </span>
                                                            ))}
                                                            {(item.keywords?.length || 0) > 2 && (
                                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                                                    +{(item.keywords?.length || 0) - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-1 text-sm text-gray-700">
                                                            <MapPin className="w-4 h-4 text-gray-400" />
                                                            {item.location}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                            {formatDate(item.createdAt)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/results/${item._id}`);
                                                            }}
                                                            className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                                                        >
                                                            View Results
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        // Expanded by keyword - data is already flattened by API
                                        (history as KeywordHistoryItem[]).map((item, index) => {
                                            // Calculate the actual row number based on pagination
                                            const rowNumber = pagination
                                                ? ((pagination.page - 1) * pagination.limit) + index + 1
                                                : index + 1;

                                            return (
                                                <tr key={item._id || `${item.searchId}-${index}`} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/results/${item.searchId || item._id}/details/${item.taskId}`)}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold max-w-[200px] truncate" title={item.keyword}>
                                                            {item.keyword}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{item.domain}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className={`text-sm font-bold ${item.rank && item.rank <= 3 ? 'text-green-600' : item.rank && item.rank <= 10 ? 'text-blue-600' : 'text-gray-900'}`}>
                                                            {item.rank || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">
                                                        {item.featureCounts?.aiOverview ? item.featureCounts.aiOverview : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">
                                                        {item.featureCounts?.paa ? item.featureCounts.paa : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {item.hasAIOverview && (
                                                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600" title="AI Overview">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
                                                                </div>
                                                            )}
                                                            {item.hasPAA && (
                                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600" title="People Also Ask">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">
                                                        {item.featureCounts?.relatedSearches ? item.featureCounts.relatedSearches : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">
                                                        {item.featureCounts?.refinementChips ? item.featureCounts.refinementChips : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-1 text-sm text-gray-700">
                                                            <MapPin className="w-4 h-4 text-gray-400" />
                                                            {item.location}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                            {formatDate(item.createdAt)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/results/${item.searchId || item._id}/details/${item.taskId}`);
                                                            }}
                                                            className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination Controls - Bottom */}
                {!loading && !error && history.length > 0 && pagination && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-700">
                                    Showing results from search {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} total searches
                                </span>
                                <CustomSelect
                                    value={limit.toString()}
                                    onChange={(val: string) => {
                                        setLimit(parseInt(val));
                                        setPage(1);
                                    }}
                                    options={[
                                        { value: "10", label: "10 per page" },
                                        { value: "25", label: "25 per page" },
                                        { value: "50", label: "50 per page" },
                                        { value: "100", label: "100 per page" },
                                        ...(viewMode === 'keywords' ? [{ value: "500", label: "500 per page" }] : [])
                                    ]}
                                    className="w-40"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(1)}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    First
                                </button>
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={!pagination.hasPrev}
                                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2 text-sm text-gray-700">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={!pagination.hasNext}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                                <button
                                    onClick={() => setPage(pagination.totalPages)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
