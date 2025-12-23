'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import CustomSelect from '@/components/CustomSelect';
import {
    CreditCard, Loader2, ChevronLeft, Plus, Edit2, Trash2,
    Check, Zap, Crown, Sparkles, Star, RefreshCw,
    BarChart3, FileText
} from 'lucide-react';
import Link from 'next/link';

interface PlanLimits {
    keywordSearches: number;
    keywordsPerSearch: number;
    searchHistoryDays: number;
    backlinksChecks: number;
    siteAudits: number;
    competitorAnalysis: number;
    contentOptimization: number;
    apiRequestsPerDay: number;
    apiRequestsPerMonth: number;
    features: {
        aiOverviewTracking: boolean;
        serpFeatureAnalysis: boolean;
        exportData: boolean;
        apiAccess: boolean;
        prioritySupport: boolean;
        whiteLabel: boolean;
        customReports: boolean;
        teamMembers: number;
    };
}

interface Plan {
    _id: string;
    name: string;
    slug: string;
    description: string;
    price: {
        monthly: number;
        yearly: number;
        currency: string;
    };
    limits: PlanLimits;
    isActive: boolean;
    isDefault: boolean;
    sortOrder: number;
    color: string;
    badge?: string;
}

const defaultLimits: PlanLimits = {
    keywordSearches: 100,
    keywordsPerSearch: 10,
    searchHistoryDays: 30,
    backlinksChecks: 0,
    siteAudits: 0,
    competitorAnalysis: 0,
    contentOptimization: 0,
    apiRequestsPerDay: 100,
    apiRequestsPerMonth: 1000,
    features: {
        aiOverviewTracking: false,
        serpFeatureAnalysis: false,
        exportData: false,
        apiAccess: false,
        prioritySupport: false,
        whiteLabel: false,
        customReports: false,
        teamMembers: 0,
    },
};

const colorOptions = [
    { value: '#6b7280', label: 'Gray' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#10b981', label: 'Green' },
    { value: '#ef4444', label: 'Red' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#6366f1', label: 'Indigo' },
];

export default function PlansPage() {
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [actionLoading, setActionLoading] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState<Partial<Plan>>({
        name: '',
        slug: '',
        description: '',
        price: { monthly: 0, yearly: 0, currency: 'USD' },
        limits: { ...defaultLimits },
        isActive: true,
        isDefault: false,
        sortOrder: 0,
        color: '#6366f1',
        badge: '',
    });

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/admin/plans');
            if (res.ok) {
                const data = await res.json();
                setPlans(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch plans:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const handleSeedPlans = async () => {
        if (!confirm('This will create the default plans. Are you sure?')) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/v1/admin/plans', { method: 'PUT' });
            if (res.ok) {
                fetchPlans();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to seed plans');
            }
        } catch (err) {
            console.error('Failed to seed plans:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingPlan(null);
        setFormData({
            name: '',
            slug: '',
            description: '',
            price: { monthly: 0, yearly: 0, currency: 'USD' },
            limits: { ...defaultLimits, features: { ...defaultLimits.features } },
            isActive: true,
            isDefault: false,
            sortOrder: plans.length,
            color: '#6366f1',
            badge: '',
        });
        setShowModal(true);
    };

    const openEditModal = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            slug: plan.slug,
            description: plan.description,
            price: { ...plan.price },
            limits: {
                ...plan.limits,
                features: { ...plan.limits.features },
            },
            isActive: plan.isActive,
            isDefault: plan.isDefault,
            sortOrder: plan.sortOrder,
            color: plan.color,
            badge: plan.badge || '',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.slug || !formData.description) {
            alert('Name, slug, and description are required');
            return;
        }

        setActionLoading(true);
        try {
            const url = editingPlan
                ? `/api/v1/admin/plans/${editingPlan._id}`
                : '/api/v1/admin/plans';
            const method = editingPlan ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowModal(false);
                fetchPlans();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save plan');
            }
        } catch (err) {
            console.error('Failed to save plan:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (plan: Plan) => {
        if (!confirm(`Are you sure you want to delete "${plan.name}"?`)) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/v1/admin/plans/${plan._id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchPlans();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete plan');
            }
        } catch (err) {
            console.error('Failed to delete plan:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const formatLimit = (value: number) => {
        if (value === -1) return 'Unlimited';
        return value.toLocaleString();
    };

    const getPlanIcon = (slug: string) => {
        switch (slug) {
            case 'free': return <Zap className="h-5 w-5" />;
            case 'basic': return <Star className="h-5 w-5" />;
            case 'pro': return <Crown className="h-5 w-5" />;
            case 'enterprise': return <Sparkles className="h-5 w-5" />;
            default: return <CreditCard className="h-5 w-5" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/admin" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-2">
                        <ChevronLeft size={16} /> Back to Admin
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <CreditCard className="h-7 w-7 text-indigo-600" />
                                Subscription Plans
                            </h1>
                            <p className="text-gray-500 mt-1">Manage pricing plans and feature limits</p>
                        </div>
                        <div className="flex gap-3">
                            {plans.length === 0 && (
                                <button
                                    onClick={handleSeedPlans}
                                    disabled={actionLoading}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <RefreshCw size={18} />
                                    Seed Default Plans
                                </button>
                            )}
                            <button
                                onClick={openCreateModal}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                <Plus size={18} />
                                Add Plan
                            </button>
                        </div>
                    </div>
                </div>

                {/* Plans Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                ) : plans.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No plans configured yet</p>
                        <button
                            onClick={handleSeedPlans}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Create Default Plans
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan._id}
                                className={`bg-white rounded-xl border-2 overflow-hidden relative ${plan.isDefault ? 'border-indigo-500' : 'border-gray-200'
                                    }`}
                                style={{ borderTopColor: plan.color, borderTopWidth: '4px' }}
                            >
                                {plan.badge && (
                                    <div className="absolute top-3 right-3">
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                                            {plan.badge}
                                        </span>
                                    </div>
                                )}

                                <div className="p-6">
                                    {/* Plan Header */}
                                    <div className="flex items-center gap-2 mb-2" style={{ color: plan.color }}>
                                        {getPlanIcon(plan.slug)}
                                        <h3 className="font-bold text-lg">{plan.name}</h3>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                                    {/* Price */}
                                    <div className="mb-4">
                                        <span className="text-3xl font-bold text-gray-900">
                                            ${plan.price.monthly}
                                        </span>
                                        <span className="text-gray-500">/mo</span>
                                        {plan.price.yearly > 0 && (
                                            <p className="text-xs text-gray-400">
                                                or ${plan.price.yearly}/year
                                            </p>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {plan.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        {plan.isDefault && (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700">
                                                Default
                                            </span>
                                        )}
                                    </div>

                                    {/* Key Limits */}
                                    <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Keyword Searches</span>
                                            <span className="font-medium">{formatLimit(plan.limits.keywordSearches)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Keywords/Search</span>
                                            <span className="font-medium">{formatLimit(plan.limits.keywordsPerSearch)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">API Requests/Day</span>
                                            <span className="font-medium">{formatLimit(plan.limits.apiRequestsPerDay)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">History Days</span>
                                            <span className="font-medium">{formatLimit(plan.limits.searchHistoryDays)}</span>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
                                        {plan.limits.features.aiOverviewTracking && (
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Check size={14} className="text-green-500" /> AI Overview Tracking
                                            </div>
                                        )}
                                        {plan.limits.features.serpFeatureAnalysis && (
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Check size={14} className="text-green-500" /> SERP Feature Analysis
                                            </div>
                                        )}
                                        {plan.limits.features.exportData && (
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Check size={14} className="text-green-500" /> Export Data
                                            </div>
                                        )}
                                        {plan.limits.features.apiAccess && (
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Check size={14} className="text-green-500" /> API Access
                                            </div>
                                        )}
                                        {plan.limits.features.prioritySupport && (
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Check size={14} className="text-green-500" /> Priority Support
                                            </div>
                                        )}
                                        {plan.limits.features.teamMembers !== 0 && (
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Check size={14} className="text-green-500" />
                                                {plan.limits.features.teamMembers === -1 ? 'Unlimited' : plan.limits.features.teamMembers} Team Members
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => openEditModal(plan)}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                                        >
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(plan)}
                                            disabled={plan.isDefault}
                                            className="flex items-center justify-center gap-1 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Edit/Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-3xl my-8">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingPlan ? 'Edit Plan' : 'Create Plan'}
                            </h2>
                        </div>

                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <FileText size={16} /> Basic Info
                                    </h3>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                            placeholder="e.g., Pro"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Slug</label>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                            placeholder="e.g., pro"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                            rows={2}
                                            placeholder="Short description of the plan"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Price ($)</label>
                                            <input
                                                type="number"
                                                value={formData.price?.monthly || 0}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    price: { ...formData.price!, monthly: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Yearly Price ($)</label>
                                            <input
                                                type="number"
                                                value={formData.price?.yearly || 0}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    price: { ...formData.price!, yearly: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                                            <CustomSelect
                                                options={colorOptions}
                                                value={formData.color || '#6366f1'}
                                                onChange={(v) => setFormData({ ...formData, color: v })}
                                                placeholder="Select color"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Badge</label>
                                            <input
                                                type="text"
                                                value={formData.badge || ''}
                                                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                                placeholder="e.g., Most Popular"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300"
                                            />
                                            <span className="text-sm">Active</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isDefault}
                                                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300"
                                            />
                                            <span className="text-sm">Default Plan</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Limits */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <BarChart3 size={16} /> Limits
                                    </h3>
                                    <p className="text-xs text-gray-500">Use -1 for unlimited</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Keyword Searches/mo</label>
                                            <input
                                                type="number"
                                                value={formData.limits?.keywordSearches || 0}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    limits: { ...formData.limits!, keywordSearches: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Keywords/Search</label>
                                            <input
                                                type="number"
                                                value={formData.limits?.keywordsPerSearch || 0}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    limits: { ...formData.limits!, keywordsPerSearch: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">History Days</label>
                                            <input
                                                type="number"
                                                value={formData.limits?.searchHistoryDays || 0}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    limits: { ...formData.limits!, searchHistoryDays: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">API Requests/Day</label>
                                            <input
                                                type="number"
                                                value={formData.limits?.apiRequestsPerDay || 0}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    limits: { ...formData.limits!, apiRequestsPerDay: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">API Requests/Month</label>
                                            <input
                                                type="number"
                                                value={formData.limits?.apiRequestsPerMonth || 0}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    limits: { ...formData.limits!, apiRequestsPerMonth: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Backlinks Checks</label>
                                            <input
                                                type="number"
                                                value={formData.limits?.backlinksChecks || 0}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    limits: { ...formData.limits!, backlinksChecks: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Site Audits</label>
                                            <input
                                                type="number"
                                                value={formData.limits?.siteAudits || 0}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    limits: { ...formData.limits!, siteAudits: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Team Members</label>
                                            <input
                                                type="number"
                                                value={formData.limits?.features?.teamMembers || 0}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    limits: {
                                                        ...formData.limits!,
                                                        features: {
                                                            ...formData.limits!.features,
                                                            teamMembers: parseInt(e.target.value) || 0
                                                        }
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 pt-4">
                                        <Sparkles size={16} /> Features
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { key: 'aiOverviewTracking', label: 'AI Overview Tracking' },
                                            { key: 'serpFeatureAnalysis', label: 'SERP Feature Analysis' },
                                            { key: 'exportData', label: 'Export Data' },
                                            { key: 'apiAccess', label: 'API Access' },
                                            { key: 'prioritySupport', label: 'Priority Support' },
                                            { key: 'whiteLabel', label: 'White Label' },
                                            { key: 'customReports', label: 'Custom Reports' },
                                        ].map(({ key, label }) => (
                                            <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.limits?.features?.[key as keyof typeof formData.limits.features] as boolean || false}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        limits: {
                                                            ...formData.limits!,
                                                            features: {
                                                                ...formData.limits!.features,
                                                                [key]: e.target.checked
                                                            }
                                                        }
                                                    })}
                                                    className="w-4 h-4 rounded border-gray-300"
                                                />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : (editingPlan ? 'Update' : 'Create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
