'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import LanguageSelect from '@/components/LanguageSelect';
import CustomSelect from '@/components/CustomSelect';
import { getLanguageForCountry } from '@/lib/languages';
import OSSelect from '@/components/OSSelect';
import LineNumberTextarea from '@/components/LineNumberTextarea';
import {
    Search, Loader2, AlertCircle, CheckCircle, Globe, TrendingUp,
    ChevronDown, ChevronUp, Settings, Smartphone, Monitor, Tablet,
    History, Terminal, Zap
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
    const [selectedDomainHistory, setSelectedDomainHistory] = useState<any[]>([]);
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
    });
    const [priority, setPriority] = useState<1 | 2>(1);

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

            const keywordList = keywords.split(/[\n,]+/).map(k => k.trim()).filter(k => k);

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
                priority,
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

            // Redirect to results page
            if (data.historyId) {
                window.location.href = `/results/${data.historyId}`;
            } else {
                throw new Error('No History ID returned from server');
            }

        } catch (err: any) {
            setError(err.message || 'An error occurred');
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

                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                className={`p-4 rounded-xl border-2 transition-all ${mode === 'regular'
                                    ? 'bg-indigo-50 border-indigo-500 shadow-md'
                                    : 'bg-gray-50 border-gray-200 hover:border-indigo-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mode === 'regular' ? 'border-indigo-500' : 'border-gray-300'
                                        }`}>
                                        <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className={`font-semibold text-sm ${mode === 'regular' ? 'text-indigo-700' : 'text-gray-700'
                                            }`}>
                                            Regular
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
                                        autoComplete="off"
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

                                    {/* History Dropdown - Unique Domains */}
                                    {showHistory && searchHistory.length > 0 && (
                                        <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-auto animate-in fade-in slide-in-from-top-2">
                                            <div className="p-2">
                                                <div className="text-xs font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider">Recent Domains</div>
                                                {/* Deduplicate domains */}
                                                {Array.from(new Set(searchHistory.filter(h => h.domain.includes(domain)).map(h => h.domain))).map((uniqueDomain, idx) => {
                                                    // Find latest entry for metadata
                                                    const latest = searchHistory.find(h => h.domain === uniqueDomain);
                                                    if (!latest) return null;

                                                    const dateStr = latest.createdAt ? new Date(latest.createdAt).toLocaleDateString() : 'Unknown Date';

                                                    return (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => {
                                                                const domainHistory = searchHistory.filter(h => h.domain === uniqueDomain);
                                                                setSelectedDomainHistory(domainHistory);

                                                                // Default to latest
                                                                setDomain(latest.domain);
                                                                if (latest.location) {
                                                                    setLocationName(latest.location);
                                                                    setLocationCode(latest.location_code);
                                                                }
                                                                if (latest.keywords && latest.keywords.length > 0) {
                                                                    setKeywords(latest.keywords.join('\n'));
                                                                }
                                                                // Set Filters if available
                                                                if (latest.filters) {
                                                                    setAdvancedParams(prev => ({
                                                                        ...prev,
                                                                        language: latest.filters.language || 'en',
                                                                        device: latest.filters.device || 'desktop',
                                                                        os: latest.filters.os || 'windows'
                                                                    }));
                                                                }

                                                                setShowHistory(false);
                                                            }}
                                                            className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 rounded-lg transition-colors group/item"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-medium text-gray-900 group-hover/item:text-indigo-700">{uniqueDomain}</span>
                                                                <span className="text-xs text-gray-400">{dateStr}</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
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

                                        // Auto-select language based on country
                                        if (location.country_iso_code) {
                                            const langCode = getLanguageForCountry(location.country_iso_code);
                                            if (langCode) {
                                                setAdvancedParams(prev => ({
                                                    ...prev,
                                                    language: langCode
                                                }));
                                            }
                                        }
                                    }}
                                />
                            </div>

                            <div className="col-span-1 group">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                                    Language
                                </label>
                                <LanguageSelect
                                    value={advancedParams.language}
                                    onChange={(languageCode) => setAdvancedParams({ ...advancedParams, language: languageCode })}
                                />
                            </div>
                        </div>

                        {selectedDomainHistory.length > 1 && (
                            <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md animate-in fade-in slide-in-from-top-2 group/history">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl" />
                                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                    {/* Icon & Label */}
                                    <div className="flex items-center gap-3 min-w-[200px]">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover/history:bg-indigo-100 transition-colors">
                                            <History className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900">Restore Session</h4>
                                            <p className="text-xs text-gray-500">{selectedDomainHistory.length} versions available</p>
                                        </div>
                                    </div>

                                    {/* Divider for desktop */}
                                    <div className="hidden sm:block h-10 w-px bg-gray-100" />

                                    {/* Selector Control */}
                                    <div className="relative flex-1">
                                        <CustomSelect
                                            options={selectedDomainHistory.map((h, i) => {
                                                const dateStr = h.createdAt ? new Date(h.createdAt).toLocaleDateString(undefined, {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                }) : 'Unknown Date';

                                                // Keyword preview
                                                const firstKw = h.keywords?.[0] || '';
                                                const kwPreview = firstKw.length > 15 ? firstKw.substring(0, 15) + '...' : firstKw;
                                                const countLabel = h.keywords?.length > 1 ? `(+${h.keywords.length - 1})` : '';
                                                const fullLabel = i === 0 ? `Latest: ${dateStr}` : dateStr;

                                                return {
                                                    value: i.toString(),
                                                    label: `${fullLabel} — "${kwPreview}" ${countLabel}`,
                                                    subtext: `${h.filters?.language?.toUpperCase() || 'EN'} • ${h.location || 'Global'}`
                                                };
                                            })}
                                            value="0"
                                            onChange={(val) => {
                                                const idx = parseInt(val);
                                                const item = selectedDomainHistory[idx];
                                                if (item) {
                                                    // 1. Set Location
                                                    if (item.location) {
                                                        setLocationName(item.location);
                                                        setLocationCode(item.location_code);
                                                    }
                                                    // 2. Set Keywords
                                                    if (item.keywords) setKeywords(item.keywords.join('\n'));
                                                    // 3. Set Filters
                                                    if (item.filters) {
                                                        setAdvancedParams(prev => ({
                                                            ...prev,
                                                            language: item.filters.language || 'en',
                                                            device: item.filters.device || 'desktop',
                                                            os: item.filters.os || 'windows'
                                                        }));
                                                    }
                                                }
                                            }}
                                            placeholder="Select a version to restore..."
                                            className="w-full"
                                        />
                                        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-gray-400 uppercase tracking-widest font-semibold px-1">
                                            <span className="text-indigo-400">Restores:</span>
                                            <span className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> Location</span>
                                            <span className="flex items-center gap-1.5"><Terminal className="h-3 w-3" /> Keywords</span>
                                            <span className="flex items-center gap-1.5"><Settings className="h-3 w-3" /> Filters</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="group mt-6">
                            <label htmlFor="keywords" className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                                Keywords <span className="text-gray-400 font-normal text-xs">(one per line)</span>
                            </label>
                            <div className="relative">
                                {/* Component replaces simple textarea */}
                                <LineNumberTextarea
                                    id="keywords"
                                    required
                                    placeholder="seo&#10;marketing&#10;ranking"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    className="pl-3 block w-full rounded-xl border-gray-200 bg-gray-50/50 p-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500 sm:text-sm transition-all shadow-sm hover:border-indigo-300 resize-y"
                                />
                            </div>
                        </div>

                        {/* Priority Selector */}
                        <div className="group mt-6">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                                <Zap className="h-4 w-4 text-indigo-500" />
                                Priority
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 1, label: 'Standard', desc: '1x credits', info: 'Normal processing speed' },
                                    { id: 2, label: 'High', desc: '2x credits', info: 'Faster results' }
                                ].map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setPriority(p.id as 1 | 2)}
                                        className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all ${priority === p.id
                                            ? 'bg-indigo-50 border-indigo-500 shadow-md transform scale-[1.02]'
                                            : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${priority === p.id ? 'border-indigo-500' : 'border-gray-300'}`}>
                                                {priority === p.id && <div className="w-3 h-3 rounded-full bg-indigo-500"></div>}
                                            </div>
                                            <span className={`font-semibold text-sm ${priority === p.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                                                {p.label}
                                            </span>
                                        </div>
                                        <span className={`text-xs ml-7 ${priority === p.id ? 'text-indigo-600' : 'text-gray-500'}`}>{p.desc} • {p.info}</span>
                                    </button>
                                ))}
                            </div>
                            {priority === 2 && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                                    <Zap className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-amber-700">
                                        <strong>High Priority:</strong> Your keywords will be processed faster, using 2x credits per keyword.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-6 mt-6">
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
                        {showAdvanced && (
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-300 shadow-inner">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-gray-700">
                                            Operating System
                                        </label>
                                        <OSSelect
                                            value={advancedParams.os}
                                            onChange={(os) => setAdvancedParams({ ...advancedParams, os })}
                                        />
                                    </div>

                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
                            {/* Credit Cost Preview */}
                            {keywords.trim() && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="font-medium">Estimated Cost:</span>
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg">
                                        {keywords.split(/[\n,]+/).filter(k => k.trim()).length * priority} credits
                                    </span>
                                    {priority === 2 && (
                                        <span className="text-xs text-amber-600 flex items-center gap-1">
                                            <Zap className="h-3 w-3" />
                                            High Priority
                                        </span>
                                    )}
                                </div>
                            )}

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
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}
            </main>
        </div>
    );
}
