'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import {
    Search, Loader2, AlertCircle, CheckCircle, Globe, TrendingUp,
    ChevronDown, ChevronUp, Settings, Smartphone, Monitor, Tablet,
    Languages, Layers, Globe2, ShieldAlert, History
} from 'lucide-react';

export default function Dashboard() {
    const [domain, setDomain] = useState('');
    const [keywords, setKeywords] = useState('');
    const [locationName, setLocationName] = useState('');
    const [locationCode, setLocationCode] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'regular' | 'advanced'>('regular');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [searchHistory, setSearchHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [tokens, setTokens] = useState<number | null>(null);

    // Fetch history and tokens on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch history
                const historyRes = await fetch('/api/user/history');
                if (historyRes.ok) {
                    const data = await historyRes.json();
                    setSearchHistory(data.history || []);
                }

                // Fetch tokens
                const tokensRes = await fetch('/api/user/tokens');
                if (tokensRes.ok) {
                    const data = await tokensRes.json();
                    setTokens(data.tokens);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };
        fetchData();
    }, []);

    // Handle URL parameters for re-run from history
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlDomain = params.get('domain');
        const urlLocation = params.get('location');
        const urlLocationCode = params.get('locationCode');
        const urlKeywords = params.get('keywords');

        if (urlDomain) setDomain(urlDomain);
        if (urlLocation) setLocationName(urlLocation);
        if (urlLocationCode) setLocationCode(parseInt(urlLocationCode));
        if (urlKeywords) setKeywords(urlKeywords);

        // Clear URL parameters after reading
        if (urlDomain || urlLocation || urlKeywords) {
            window.history.replaceState({}, '', '/dashboard');
        }
    }, []);

    // Advanced Params State
    const [advancedParams, setAdvancedParams] = useState({
        language: 'en',
        device: 'desktop',
        os: 'windows',
        depth: 100,
        max_crawl_pages: 1,
        stop_crawl_on_match: true,
    });

    // Helper to clean domain
    const cleanDomain = (url: string) => {
        return url
            .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
            .replace(/\/$/, '');
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResults([]);

        try {
            if (tokens !== null && tokens <= 0) {
                throw new Error('Insufficient tokens. Please contact support to purchase more.');
            }

            const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);

            if (keywordList.length === 0) {
                throw new Error('Please enter at least one keyword');
            }

            const cleanedDomain = cleanDomain(domain);
            if (!cleanedDomain) {
                throw new Error('Please enter a valid domain');
            }
            setDomain(cleanedDomain);

            const endpoint = '/api/check-rank/regular';

            const requestBody: any = {
                domain: cleanedDomain,
                keywords: keywordList,
                filters: {
                    language: advancedParams.language,
                    device: advancedParams.device,
                    os: advancedParams.os,
                },
            };

            if (locationCode) {
                requestBody.location_code = locationCode;
            } else if (locationName) {
                requestBody.location_name = locationName;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(requestBody),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch rankings');
            }

            setResults(data.results);

            // Update tokens if returned in response
            if (typeof data.tokensRemaining === 'number') {
                setTokens(data.tokensRemaining);
            } else if (tokens !== null) {
                // Fallback: manually decrement if not returned
                setTokens(tokens - 1);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                        <p className="text-gray-500 mt-2 text-lg">Track your website rankings and analyze performance with precision.</p>
                    </div>

                    {/* Token Display */}
                    {tokens !== null && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${tokens > 0
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${tokens > 0 ? 'bg-indigo-500' : 'bg-red-500'}`} />
                            <span className="font-bold">{tokens}</span>
                            <span className="text-sm font-medium">Request Tokens Available</span>
                        </div>
                    )}
                </div>

                {/* Search Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-gray-100 p-6 sm:p-8 mb-8 transition-all hover:shadow-2xl hover:shadow-indigo-100/60">
                    {/* Mode Toggle */}
                    <div className="mb-6 pb-6 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-700">Search Mode</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className={mode === 'regular' ? 'font-semibold text-indigo-600' : ''}>
                                    {mode === 'regular' ? '⚡ Fast & Simple' : '🔬 Detailed Analysis'}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setMode('regular')}
                                className={`p-4 rounded-xl border-2 transition-all ${mode === 'regular'
                                    ? 'bg-indigo-50 border-indigo-500 shadow-md'
                                    : 'bg-gray-50 border-gray-200 hover:border-indigo-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mode === 'regular' ? 'border-indigo-500' : 'border-gray-300'
                                        }`}>
                                        {mode === 'regular' && (
                                            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                        )}
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className={`font-semibold text-sm ${mode === 'regular' ? 'text-indigo-700' : 'text-gray-700'
                                            }`}>
                                            Regular
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            Top 20 results • Basic data
                                        </div>
                                    </div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('advanced')}
                                className={`p-4 rounded-xl border-2 transition-all ${mode === 'advanced'
                                    ? 'bg-indigo-50 border-indigo-500 shadow-md'
                                    : 'bg-gray-50 border-gray-200 hover:border-indigo-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mode === 'advanced' ? 'border-indigo-500' : 'border-gray-300'
                                        }`}>
                                        {mode === 'advanced' && (
                                            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                        )}
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className={`font-semibold text-sm ${mode === 'advanced' ? 'text-indigo-700' : 'text-gray-700'
                                            }`}>
                                            Advanced
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            Up to 700 results • Full data
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="col-span-1 group relative">
                                <label htmlFor="domain" className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors flex justify-between">
                                    Domain
                                    {searchHistory.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowHistory(!showHistory)}
                                            className="text-xs font-normal text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                        >
                                            <History className="w-3 h-3" />
                                            Recent
                                        </button>
                                    )}
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        id="domain"
                                        required
                                        placeholder="example.com"
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value)}
                                        onBlur={() => setDomain(cleanDomain(domain))}
                                        onFocus={() => {
                                            if (searchHistory.length > 0) setShowHistory(true);
                                        }}
                                        className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-50/50 p-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500 sm:text-sm transition-all shadow-sm hover:border-indigo-300"
                                    />

                                    {/* History Dropdown */}
                                    {showHistory && searchHistory.length > 0 && (
                                        <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-auto animate-in fade-in slide-in-from-top-2">
                                            <div className="p-2">
                                                <div className="text-xs font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider">Recent Searches</div>
                                                {searchHistory.map((item, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            setDomain(item.domain);
                                                            if (item.lastLocation) {
                                                                setLocationName(item.lastLocation);
                                                                setLocationCode(item.lastLocationCode);
                                                            }
                                                            // Suggest keywords (optional: set keywords or just show them)
                                                            if (item.keywords && item.keywords.length > 0) {
                                                                setKeywords(item.keywords.join(', '));
                                                            }
                                                            setShowHistory(false);
                                                        }}
                                                        className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 rounded-lg transition-colors group/item"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium text-gray-900 group-hover/item:text-indigo-700">{item.domain}</span>
                                                            <span className="text-xs text-gray-400">{new Date(item.lastSearched).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                                                            {item.lastLocation} • {item.keywords.length} keywords
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Click outside handler would be good here, but for simplicity relying on selection to close */}
                                {showHistory && (
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowHistory(false)}
                                    />
                                )}
                            </div>

                            <div className="col-span-1 group">
                                <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                                    Location
                                </label>
                                <LocationAutocomplete
                                    value={locationName}
                                    onChange={setLocationName}
                                    onSelect={(location) => {
                                        setLocationName(location.value);
                                        setLocationCode(location.id);
                                    }}
                                />
                            </div>

                            <div className="col-span-1 group">
                                <label htmlFor="keywords" className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                                    Keywords <span className="text-gray-400 font-normal text-xs">(comma separated)</span>
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        id="keywords"
                                        required
                                        placeholder="seo, marketing, ranking"
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                        className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-50/50 p-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500 sm:text-sm transition-all shadow-sm hover:border-indigo-300"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Advanced Options Toggle - Available in Both Modes */}
                        <div className="border-t border-gray-100 pt-6">
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors px-4 py-2 rounded-lg hover:bg-indigo-50 w-full sm:w-auto justify-center sm:justify-start"
                            >
                                <Settings className="h-4 w-4" />
                                {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
                                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Advanced Options Panel */}
                        {showAdvanced && (
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-300 shadow-inner">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {/* Device Selection */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <Monitor className="h-4 w-4 text-indigo-500" />
                                            Device Type
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'desktop', icon: Monitor, label: 'Desktop' },
                                                { id: 'mobile', icon: Smartphone, label: 'Mobile' },
                                                { id: 'tablet', icon: Tablet, label: 'Tablet' }
                                            ].map((device) => (
                                                <button
                                                    key={device.id}
                                                    type="button"
                                                    onClick={() => setAdvancedParams({ ...advancedParams, device: device.id })}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${advancedParams.device === device.id
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-105'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                                                        }`}
                                                >
                                                    <device.icon className="h-5 w-5 mb-1" />
                                                    <span className="text-xs font-medium">{device.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* OS Selection */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <Settings className="h-4 w-4 text-indigo-500" />
                                            Operating System
                                        </label>
                                        <select
                                            value={advancedParams.os}
                                            onChange={(e) => setAdvancedParams({ ...advancedParams, os: e.target.value })}
                                            className="block w-full rounded-xl border-gray-200 bg-white p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500 shadow-sm hover:border-indigo-300 transition-colors"
                                        >
                                            <option value="windows">Windows</option>
                                            <option value="macos">macOS</option>
                                            <option value="android">Android</option>
                                            <option value="ios">iOS</option>
                                        </select>
                                    </div>

                                    {/* Language Selection */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <Languages className="h-4 w-4 text-indigo-500" />
                                            Language
                                        </label>
                                        <select
                                            value={advancedParams.language}
                                            onChange={(e) => setAdvancedParams({ ...advancedParams, language: e.target.value })}
                                            className="block w-full rounded-xl border-gray-200 bg-white p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500 shadow-sm hover:border-indigo-300 transition-colors"
                                        >
                                            <option value="en">English</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                            <option value="de">German</option>
                                        </select>
                                    </div>

                                    {/* Search Depth */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <Layers className="h-4 w-4 text-indigo-500" />
                                            Search Depth
                                            <span className="text-xs font-normal text-gray-400 ml-auto">1-700</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="range"
                                                min="1"
                                                max="700"
                                                value={advancedParams.depth}
                                                onChange={(e) => setAdvancedParams({ ...advancedParams, depth: parseInt(e.target.value) })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                <span>1</span>
                                                <span className="font-semibold text-indigo-600">{advancedParams.depth} Results</span>
                                                <span>700</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Max Crawl Pages */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <Globe2 className="h-4 w-4 text-indigo-500" />
                                            Max Crawl Pages
                                            <span className="text-xs font-normal text-gray-400 ml-auto">1-10</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={advancedParams.max_crawl_pages}
                                                onChange={(e) => setAdvancedParams({ ...advancedParams, max_crawl_pages: parseInt(e.target.value) })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                <span>1</span>
                                                <span className="font-semibold text-indigo-600">{advancedParams.max_crawl_pages} Pages</span>
                                                <span>10</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stop Crawl Toggle */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <ShieldAlert className="h-4 w-4 text-indigo-500" />
                                            Optimization
                                        </label>
                                        <div className="flex items-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                                            <input
                                                id="stop_crawl"
                                                type="checkbox"
                                                checked={advancedParams.stop_crawl_on_match}
                                                onChange={(e) => setAdvancedParams({ ...advancedParams, stop_crawl_on_match: e.target.checked })}
                                                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                            />
                                            <label htmlFor="stop_crawl" className="ml-3 block text-sm text-gray-700 cursor-pointer select-none">
                                                Stop crawl when domain is found
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-6 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={loading || (tokens !== null && tokens <= 0)}
                                className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-xl shadow-lg shadow-indigo-200 text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                        Analyzing Rankings...
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="-ml-1 mr-2 h-5 w-5" />
                                        {mode === 'regular' ? 'Quick Check Rankings' : 'Deep Analyze Rankings'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Results Grid */}
                {results.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-indigo-600" />
                                Ranking Results
                            </h2>
                            <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-4 py-1.5 rounded-full shadow-sm">
                                {results.length} Keywords Analyzed
                            </span>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {results.map((result, index) => (
                                <div key={index} className="p-6 hover:bg-gray-50/80 transition-colors group">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{result.keyword}</h3>
                                                {result.rank ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                        <CheckCircle className="w-3 h-3 mr-1.5" />
                                                        Found
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                        Not in top 20
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

                                    {/* Advanced Metrics (if available) */}
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
