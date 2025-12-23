'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import CustomSelect from '@/components/CustomSelect';
import {
    Users, Search, Loader2, ChevronLeft, ChevronRight,
    Edit2, Trash2, Coins, AlertCircle, Check, X,
    RefreshCw, UserPlus, Shield, User as UserIcon
} from 'lucide-react';
import Link from 'next/link';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    requestTokens: number;
    lastActiveAt?: string;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface UserStats {
    totalUsers: number;
    activeToday: number;
    lowTokenUsers: number;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [page, setPage] = useState(1);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTokenModal, setShowTokenModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
        requestTokens: 100,
    });
    const [tokenAdjust, setTokenAdjust] = useState({ amount: 0, operation: 'add' });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
            });
            if (search) params.append('search', search);
            if (roleFilter) params.append('role', roleFilter);

            const res = await fetch(`/api/v1/admin/users?${params}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.data || []);
                setPagination(data.pagination);
                setStats(data.meta?.stats);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    }, [page, search, roleFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleCreate = async () => {
        setActionLoading(true);
        setError('');
        try {
            const res = await fetch('/api/v1/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create user');
            setSuccess('User created successfully');
            setShowCreateModal(false);
            setFormData({ name: '', email: '', password: '', role: 'user', requestTokens: 100 });
            fetchUsers();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create user');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/v1/admin/users/${selectedUser._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    ...(formData.password && { password: formData.password }),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update user');
            setSuccess('User updated successfully');
            setShowEditModal(false);
            fetchUsers();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update user');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/v1/admin/users/${selectedUser._id}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete user');
            }
            setSuccess('User deleted successfully');
            setShowDeleteConfirm(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to delete user');
        } finally {
            setActionLoading(false);
        }
    };

    const handleTokenAdjust = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/v1/admin/users/${selectedUser._id}/tokens`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tokenAdjust),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to adjust tokens');
            setSuccess(`Tokens ${tokenAdjust.operation === 'add' ? 'added' : tokenAdjust.operation === 'subtract' ? 'subtracted' : 'set'} successfully`);
            setShowTokenModal(false);
            fetchUsers();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to adjust tokens');
        } finally {
            setActionLoading(false);
        }
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            requestTokens: user.requestTokens,
        });
        setShowEditModal(true);
    };

    const openTokenModal = (user: User) => {
        setSelectedUser(user);
        setTokenAdjust({ amount: 100, operation: 'add' });
        setShowTokenModal(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link href="/admin" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-2">
                            <ChevronLeft size={16} /> Back to Admin
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Users className="h-7 w-7 text-indigo-600" />
                            User Management
                        </h1>
                    </div>
                    <button
                        onClick={() => {
                            setFormData({ name: '', email: '', password: '', role: 'user', requestTokens: 100 });
                            setShowCreateModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                        <UserPlus size={18} />
                        Add User
                    </button>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                        <Check size={18} />
                        {success}
                        <button onClick={() => setSuccess('')} className="ml-auto"><X size={18} /></button>
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                        <AlertCircle size={18} />
                        {error}
                        <button onClick={() => setError('')} className="ml-auto"><X size={18} /></button>
                    </div>
                )}

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <p className="text-sm text-gray-500">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <p className="text-sm text-gray-500">Active Today</p>
                            <p className="text-2xl font-bold text-green-600">{stats.activeToday}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <p className="text-sm text-gray-500">Low Tokens (&lt;10)</p>
                            <p className="text-2xl font-bold text-amber-600">{stats.lowTokenUsers}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div className="min-w-[140px]">
                            <CustomSelect
                                options={[
                                    { value: '', label: 'All Roles' },
                                    { value: 'user', label: 'Users' },
                                    { value: 'admin', label: 'Admins' },
                                ]}
                                value={roleFilter}
                                onChange={(v) => { setRoleFilter(v); setPage(1); }}
                                placeholder="Filter by role"
                            />
                        </div>
                        <button
                            onClick={() => fetchUsers()}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            <RefreshCw size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">No users found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tokens</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-100' : 'bg-indigo-100'}`}>
                                                        {user.role === 'admin' ? <Shield size={18} className="text-purple-600" /> : <UserIcon size={18} className="text-indigo-600" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{user.name}</p>
                                                        <p className="text-sm text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-semibold ${user.requestTokens < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {user.requestTokens}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDate(user.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openTokenModal(user)}
                                                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                                                        title="Adjust Tokens"
                                                    >
                                                        <Coins size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="Edit User"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedUser(user); setShowDeleteConfirm(true); }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                            <p className="text-sm text-gray-500">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => p - 1)}
                                    disabled={!pagination.hasPrev}
                                    className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={!pagination.hasNext}
                                    className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New User</h2>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                            <CustomSelect
                                options={[
                                    { value: 'user', label: 'User' },
                                    { value: 'admin', label: 'Admin' },
                                ]}
                                value={formData.role}
                                onChange={(v) => setFormData({ ...formData, role: v })}
                                placeholder="Select role"
                            />
                            <input
                                type="number"
                                placeholder="Initial Tokens"
                                value={formData.requestTokens}
                                onChange={(e) => setFormData({ ...formData, requestTokens: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit User</h2>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                            <input
                                type="password"
                                placeholder="New Password (leave empty to keep)"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                            <CustomSelect
                                options={[
                                    { value: 'user', label: 'User' },
                                    { value: 'admin', label: 'Admin' },
                                ]}
                                value={formData.role}
                                onChange={(v) => setFormData({ ...formData, role: v })}
                                placeholder="Select role"
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Token Adjustment Modal */}
            {showTokenModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Adjust Tokens</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Current balance: <span className="font-semibold">{selectedUser.requestTokens}</span> tokens
                        </p>
                        <div className="space-y-4">
                            <CustomSelect
                                options={[
                                    { value: 'add', label: 'Add Tokens' },
                                    { value: 'subtract', label: 'Subtract Tokens' },
                                    { value: 'set', label: 'Set Tokens To' },
                                ]}
                                value={tokenAdjust.operation}
                                onChange={(v) => setTokenAdjust({ ...tokenAdjust, operation: v })}
                                placeholder="Select operation"
                            />
                            <input
                                type="number"
                                placeholder="Amount"
                                value={tokenAdjust.amount}
                                onChange={(e) => setTokenAdjust({ ...tokenAdjust, amount: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowTokenModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleTokenAdjust}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Delete User</h2>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete <span className="font-semibold">{selectedUser.name}</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
