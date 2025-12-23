'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import LanguageSelect from '@/components/LanguageSelect';
import { getLanguageForCountry } from '@/lib/languages';
import {
    List, Loader2, Plus, Edit2, Trash2, ChevronRight,
    Globe, MapPin, Languages, Search, X,
    Clock, Target, TrendingUp
} from 'lucide-react';
import { LANGUAGES } from '@/lib/languages';
import Link from 'next/link';

interface Keyword {
    _id: string;
    keyword: string;
    addedAt: string;
    lastCheckedAt?: string;
    latestRank?: number | null;
    bestRank?: number | null;
    notes?: string;
}

interface KeywordList {
    _id: string;
    name: string;
    domain: string;
    location: string;
    locationCode: number | null;
    language: string;
    languageName: string;
    keywords: Keyword[];
    keywordCount: number;
    isActive: boolean;
    autoTrack: boolean;
    trackingFrequency: string;
    lastTrackedAt?: string;
    createdAt: string;
    updatedAt: string;
}


export default function KeywordListsPage() {
    const [loading, setLoading] = useState(true);
    const [lists, setLists] = useState<KeywordList[]>([]);
    const [selectedList, setSelectedList] = useState<KeywordList | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Create/Edit modal
    const [showModal, setShowModal] = useState(false);
    const [editingList, setEditingList] = useState<KeywordList | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        location: '',
        locationCode: null as number | null,
        language: 'en',
        languageName: 'English',
    });

    // Add keywords modal
    const [showAddKeywords, setShowAddKeywords] = useState(false);
    const [newKeywords, setNewKeywords] = useState('');

    const fetchLists = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/keyword-lists');
            if (res.ok) {
                const data = await res.json();
                setLists(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch lists:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchListDetails = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/v1/keyword-lists/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedList(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch list details:', err);
        }
    }, []);

    useEffect(() => {
        fetchLists();
    }, [fetchLists]);

    const openCreateModal = () => {
        setEditingList(null);
        setFormData({
            name: '',
            domain: '',
            location: '',
            locationCode: null,
            language: 'en',
            languageName: 'English',
        });
        setShowModal(true);
    };

    const openEditModal = (list: KeywordList) => {
        setEditingList(list);
        setFormData({
            name: list.name,
            domain: list.domain,
            location: list.location,
            locationCode: list.locationCode,
            language: list.language,
            languageName: list.languageName || 'English',
        });
        setShowModal(true);
    };

    const handleSaveList = async () => {
        if (!formData.name || !formData.domain) {
            alert('Name and domain are required');
            return;
        }

        setActionLoading(true);
        try {
            const url = editingList
                ? `/api/v1/keyword-lists/${editingList._id}`
                : '/api/v1/keyword-lists';
            const method = editingList ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowModal(false);
                fetchLists();
                if (editingList && selectedList?._id === editingList._id) {
                    fetchListDetails(editingList._id);
                }
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save list');
            }
        } catch (err) {
            console.error('Failed to save list:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteList = async (list: KeywordList) => {
        if (!confirm(`Delete "${list.name}"? This cannot be undone.`)) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/v1/keyword-lists/${list._id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                if (selectedList?._id === list._id) {
                    setSelectedList(null);
                }
                fetchLists();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete list');
            }
        } catch (err) {
            console.error('Failed to delete list:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddKeywords = async () => {
        if (!selectedList || !newKeywords.trim()) return;

        const keywords = newKeywords
            .split('\n')
            .map(k => k.trim())
            .filter(k => k.length > 0);

        if (keywords.length === 0) {
            alert('Enter at least one keyword');
            return;
        }

        setActionLoading(true);
        try {
            const res = await fetch(`/api/v1/keyword-lists/${selectedList._id}/keywords`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keywords }),
            });

            if (res.ok) {
                setShowAddKeywords(false);
                setNewKeywords('');
                fetchListDetails(selectedList._id);
                fetchLists();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to add keywords');
            }
        } catch (err) {
            console.error('Failed to add keywords:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteKeyword = async (keyword: Keyword) => {
        if (!selectedList) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/v1/keyword-lists/${selectedList._id}/keywords`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keywordIds: [keyword._id] }),
            });

            if (res.ok) {
                fetchListDetails(selectedList._id);
                fetchLists();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete keyword');
            }
        } catch (err) {
            console.error('Failed to delete keyword:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <List className="h-7 w-7 text-indigo-600" />
                            Keyword Lists
                        </h1>
                        <p className="text-gray-500 mt-1">Organize and track keywords by domain</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <Plus size={18} />
                        New List
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Lists Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="font-semibold text-gray-900">Your Lists</h2>
                                <p className="text-xs text-gray-500">{lists.length} list(s)</p>
                            </div>

                            {loading ? (
                                <div className="p-8 flex justify-center">
                                    <Loader2 className="animate-spin text-indigo-600" size={24} />
                                </div>
                            ) : lists.length === 0 ? (
                                <div className="p-8 text-center">
                                    <List className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">No lists yet</p>
                                    <button
                                        onClick={openCreateModal}
                                        className="mt-3 text-sm text-indigo-600 hover:text-indigo-700"
                                    >
                                        Create your first list
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                                    {lists.map((list) => (
                                        <div
                                            key={list._id}
                                            onClick={() => fetchListDetails(list._id)}
                                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedList?._id === list._id ? 'bg-indigo-50 border-l-2 border-indigo-600' : ''
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-gray-900 truncate">{list.name}</h3>
                                                    <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                                                        <Globe size={12} /> {list.domain}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Target size={10} /> {list.keywordCount} keywords
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={10} /> {list.location}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight size={16} className="text-gray-400 mt-1" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detail Panel */}
                    <div className="lg:col-span-2">
                        {selectedList ? (
                            <div className="bg-white rounded-xl border border-gray-200">
                                {/* List Header */}
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">{selectedList.name}</h2>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Globe size={14} /> {selectedList.domain}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={14} /> {selectedList.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Languages size={14} /> {LANGUAGES.find(l => l.code === selectedList.language)?.label || selectedList.language}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEditModal(selectedList)}
                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteList(selectedList)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Keywords Section */}
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-gray-900">
                                            Keywords ({selectedList.keywords.length})
                                        </h3>
                                        <button
                                            onClick={() => setShowAddKeywords(true)}
                                            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                                        >
                                            <Plus size={16} /> Add Keywords
                                        </button>
                                    </div>

                                    {selectedList.keywords.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                                            <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500 text-sm">No keywords yet</p>
                                            <button
                                                onClick={() => setShowAddKeywords(true)}
                                                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
                                            >
                                                Add your first keywords
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                            {selectedList.keywords.map((kw) => (
                                                <div
                                                    key={kw._id}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900">{kw.keyword}</p>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={10} /> Added {formatDate(kw.addedAt)}
                                                            </span>
                                                            {kw.latestRank && (
                                                                <span className="flex items-center gap-1">
                                                                    <TrendingUp size={10} /> Rank #{kw.latestRank}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteKeyword(kw)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Quick Actions */}
                                    <div className="mt-6 pt-4 border-t border-gray-200">
                                        <Link
                                            href={`/dashboard?domain=${encodeURIComponent(selectedList.domain)}&keywords=${encodeURIComponent(selectedList.keywords.map(k => k.keyword).join(','))}`}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                        >
                                            <Search size={16} /> Check Rankings Now
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <List className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Select a list to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {editingList ? 'Edit List' : 'Create New List'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                    placeholder="e.g., Main Keywords"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                                <input
                                    type="text"
                                    value={formData.domain}
                                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                    placeholder="e.g., example.com"
                                    disabled={!!editingList}
                                />
                                {editingList && (
                                    <p className="text-xs text-gray-400 mt-1">Domain cannot be changed</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <LocationAutocomplete
                                    value={formData.location}
                                    onChange={(v) => setFormData({ ...formData, location: v })}
                                    onSelect={(location) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            location: location.value,
                                            locationCode: location.id,
                                        }));
                                        // Auto-select language based on country
                                        if (location.country_iso_code) {
                                            const langCode = getLanguageForCountry(location.country_iso_code);
                                            if (langCode) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    location: location.value,
                                                    locationCode: location.id,
                                                    language: langCode,
                                                }));
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                <LanguageSelect
                                    value={formData.language}
                                    onChange={(langCode: string, langName?: string) => setFormData({ ...formData, language: langCode, languageName: langName || 'English' })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveList}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : (editingList ? 'Update' : 'Create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Keywords Modal */}
            {showAddKeywords && selectedList && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Add Keywords</h2>
                        <p className="text-sm text-gray-500 mb-4">Add to: {selectedList.name}</p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Keywords (one per line)
                            </label>
                            <textarea
                                value={newKeywords}
                                onChange={(e) => setNewKeywords(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg h-40 resize-none"
                                placeholder="keyword 1&#10;keyword 2&#10;keyword 3"
                            />
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowAddKeywords(false);
                                    setNewKeywords('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddKeywords}
                                disabled={actionLoading || !newKeywords.trim()}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Add Keywords'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
