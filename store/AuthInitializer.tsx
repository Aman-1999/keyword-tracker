'use client';

import { useEffect } from 'react';
import { useAppDispatch } from './hooks';
import { setUser, setLoading } from './slices/authSlice';

export default function AuthInitializer() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                const data = await res.json();

                if (res.ok && data.user) {
                    dispatch(setUser(data.user));
                } else {
                    dispatch(setLoading(false));
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                dispatch(setLoading(false));
            }
        };

        checkAuth();
    }, [dispatch]);

    return null;
}
