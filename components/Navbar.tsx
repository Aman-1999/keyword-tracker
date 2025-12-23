'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import {
    Menu, X, TrendingUp, LogOut, ChevronDown,
    LayoutDashboard, History, BarChart3, Globe, Sparkles,
    Users, Shield, Activity, User, Target, CreditCard, Eye, FileText, List
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearUser } from '@/store/slices/authSlice';
import { useRouter, usePathname } from 'next/navigation';

interface DropdownItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    description?: string;
}

const analyticsLinks: DropdownItem[] = [
    { href: '/analytics', label: 'Dashboard', icon: <BarChart3 size={16} />, description: 'Quick summary' },
    { href: '/analytics/report', label: 'SEO Report', icon: <FileText size={16} />, description: 'Full performance report' },
    { href: '/analytics/visibility', label: 'Visibility Score', icon: <Eye size={16} />, description: 'Market share & trends' },
    { href: '/analytics/keywords', label: 'Keyword Analytics', icon: <Target size={16} />, description: 'Per-keyword performance' },
    { href: '/analytics/trends', label: 'Ranking Trends', icon: <TrendingUp size={16} />, description: 'Track rank changes' },
    { href: '/analytics/domains', label: 'Domain Analytics', icon: <Globe size={16} />, description: 'Per-domain performance' },
    { href: '/analytics/serp-features', label: 'SERP Features', icon: <Sparkles size={16} />, description: 'AI Overview, PAA & more' },
];

const adminLinks: DropdownItem[] = [
    { href: '/admin', label: 'Dashboard', icon: <Shield size={16} />, description: 'Admin overview' },
    { href: '/admin/users', label: 'User Management', icon: <Users size={16} />, description: 'Manage accounts' },
    { href: '/admin/plans', label: 'Subscription Plans', icon: <CreditCard size={16} />, description: 'Manage pricing' },
    { href: '/admin/api-usage', label: 'API Usage', icon: <Activity size={16} />, description: 'Monitor credits' },
];

function NavDropdown({ label, items, isActive }: { label: string; items: DropdownItem[]; isActive: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1 font-medium transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
                    }`}
            >
                {label}
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className="flex items-start gap-3 px-4 py-2.5 hover:bg-indigo-50 transition-colors"
                        >
                            <span className="text-indigo-600 mt-0.5">{item.icon}</span>
                            <div>
                                <div className="font-medium text-gray-900 text-sm">{item.label}</div>
                                {item.description && (
                                    <div className="text-xs text-gray-500">{item.description}</div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'logout' }),
            });
            dispatch(clearUser());
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const isActiveLink = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="bg-indigo-600 p-1.5 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl text-gray-900">RankTracker</span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link
                            href="/"
                            className={`font-medium transition-colors ${isActiveLink('/') && pathname === '/' ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
                                }`}
                        >
                            Home
                        </Link>

                        {isAuthenticated && (
                            <>
                                <Link
                                    href="/dashboard"
                                    className={`flex items-center gap-1.5 font-medium transition-colors ${isActiveLink('/dashboard') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
                                        }`}
                                >
                                    <LayoutDashboard size={16} />
                                    Dashboard
                                </Link>
                                <Link
                                    href="/history"
                                    className={`flex items-center gap-1.5 font-medium transition-colors ${isActiveLink('/history') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
                                        }`}
                                >
                                    <History size={16} />
                                    History
                                </Link>
                                <Link
                                    href="/keyword-lists"
                                    className={`flex items-center gap-1.5 font-medium transition-colors ${isActiveLink('/keyword-lists') ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
                                        }`}
                                >
                                    <List size={16} />
                                    Lists
                                </Link>

                                <NavDropdown
                                    label="Analytics"
                                    items={analyticsLinks}
                                    isActive={isActiveLink('/analytics')}
                                />

                                {user?.role === 'admin' && (
                                    <NavDropdown
                                        label="Admin"
                                        items={adminLinks}
                                        isActive={isActiveLink('/admin')}
                                    />
                                )}
                            </>
                        )}
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/user"
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${isActiveLink('/user')
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <User size={16} />
                                    <span className="text-sm font-medium">{user?.name}</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-600 hover:text-gray-900 focus:outline-none p-2"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
                    <div className="px-4 pt-2 pb-4 space-y-1">
                        <Link
                            href="/"
                            className={`block px-3 py-2.5 rounded-lg font-medium ${pathname === '/' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            onClick={() => setIsOpen(false)}
                        >
                            Home
                        </Link>

                        {isAuthenticated ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg font-medium ${isActiveLink('/dashboard') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <LayoutDashboard size={18} />
                                    Dashboard
                                </Link>
                                <Link
                                    href="/history"
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg font-medium ${isActiveLink('/history') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <History size={18} />
                                    History
                                </Link>

                                {/* Analytics Section */}
                                <div className="pt-2">
                                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Analytics
                                    </div>
                                    {analyticsLinks.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${pathname === item.href ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {item.icon}
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>

                                {/* Admin Section */}
                                {user?.role === 'admin' && (
                                    <div className="pt-2">
                                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Admin
                                        </div>
                                        {adminLinks.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${pathname === item.href ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                                onClick={() => setIsOpen(false)}
                                            >
                                                {item.icon}
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {/* User Section */}
                                <div className="pt-4 mt-2 border-t border-gray-100">
                                    <Link
                                        href="/user"
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg font-medium ${isActiveLink('/user') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <User size={18} />
                                        Profile ({user?.name})
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsOpen(false);
                                        }}
                                        className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 font-medium"
                                    >
                                        <LogOut size={18} />
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="pt-4 space-y-2">
                                <Link
                                    href="/login"
                                    className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className="block px-3 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-center"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
