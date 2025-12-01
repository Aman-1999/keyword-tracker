'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, TrendingUp, LogOut, User, LayoutDashboard, History, Settings } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearUser } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();

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
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
                            Home
                        </Link>

                        {isAuthenticated ? (
                            <>
                                {user?.role === 'admin' ? (
                                    <Link href="/admin" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
                                        Admin
                                    </Link>
                                ) : (
                                    <>
                                        <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
                                            Dashboard
                                        </Link>
                                        <Link href="/history" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
                                            History
                                        </Link>
                                    </>
                                )}
                            </>
                        ) : null}
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600 font-medium">
                                    {user?.name}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                                    title="Logout"
                                >
                                    <LogOut size={20} />
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
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
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
                            className="text-gray-600 hover:text-gray-900 focus:outline-none"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white border-b border-gray-100">
                    <div className="px-4 pt-2 pb-4 space-y-1">
                        <Link
                            href="/"
                            className="block px-3 py-2 rounded-md text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium"
                            onClick={() => setIsOpen(false)}
                        >
                            Home
                        </Link>

                        {isAuthenticated ? (
                            <>
                                {user?.role === 'admin' ? (
                                    <Link
                                        href="/admin"
                                        className="block px-3 py-2 rounded-md text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Admin Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href="/dashboard"
                                            className="block px-3 py-2 rounded-md text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Dashboard
                                        </Link>
                                        <Link
                                            href="/history"
                                            className="block px-3 py-2 rounded-md text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            History
                                        </Link>
                                    </>
                                )}
                                <div className="pt-4 border-t border-gray-100 mt-2">
                                    <div className="px-3 py-2 text-sm font-medium text-gray-500">
                                        Signed in as {user?.email}
                                    </div>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsOpen(false);
                                        }}
                                        className="block w-full text-left px-3 py-2 rounded-md text-red-600 hover:bg-red-50 font-medium"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="pt-4 space-y-2">
                                <Link
                                    href="/login"
                                    className="block px-3 py-2 rounded-md text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className="block px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-center"
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
