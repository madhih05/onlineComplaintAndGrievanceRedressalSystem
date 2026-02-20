'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/utils/api';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                router.push('/login');
                return;
            }

            try {
                // Verify token with backend
                const response = await fetchAPI('/api/auth/me', {
                    method: 'POST',
                });

                if (response && response.userId) {
                    // Token is valid, redirect to dashboard
                    const role = localStorage.getItem('role');
                    if (role === 'admin' || role === 'supportStaff') {
                        router.push('/admin');
                    } else {
                        router.push('/dashboard');
                    }
                } else {
                    // Invalid token
                    localStorage.clear();
                    router.push('/login');
                }
            } catch (error) {
                // Token verification failed
                localStorage.clear();
                router.push('/login');
            }
        };

        checkAuth();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading...</p>
            </div>
        </div>
    );
}
