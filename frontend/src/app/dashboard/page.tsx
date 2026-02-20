'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/utils/api';
import type { Complaint } from '@/types';

export default function DashboardPage() {
    const router = useRouter();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [newComplaintId, setNewComplaintId] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<File | null>(null);

    // Check authentication
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token) {
            router.push('/login');
            return;
        }

        if (role === 'admin' || role === 'supportStaff') {
            router.push('/admin');
            return;
        }

        fetchComplaints();
    }, [router]);

    const fetchComplaints = async () => {
        try {
            const response = await fetchAPI('/complaints', {
                method: 'GET',
            });
            setComplaints(response.complaints || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch complaints');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccessMessage('');
        setNewComplaintId(null);

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            if (image) {
                formData.append('image', image);
            }

            const response = await fetchAPI('/complaints', {
                method: 'POST',
                body: formData,
            });

            // Clear form
            setTitle('');
            setDescription('');
            setImage(null);
            const fileInput = document.getElementById('image-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            // Set success message and complaint ID
            setSuccessMessage('Complaint submitted successfully!');
            setNewComplaintId(response.complaintId);

            // Refresh complaints list
            await fetchComplaints();
        } catch (err: any) {
            setError(err.message || 'Failed to submit complaint');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open':
                return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
            case 'assigned':
                return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
            case 'inProgress':
                return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
            case 'resolved':
                return 'bg-green-500/20 text-green-400 border border-green-500/30';
            case 'closed':
                return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
        }
    };

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Navigation Bar */}
            <nav className="bg-gray-900 border-b border-gray-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-2xl font-bold text-indigo-500">
                            User Dashboard
                        </h1>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Success Alert */}
                {successMessage && (
                    <div className="mb-6 bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center">
                                <svg
                                    className="w-5 h-5 text-green-400 mr-2"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <p className="text-green-400 font-medium">{successMessage}</p>
                            </div>
                            {newComplaintId && (
                                <button
                                    onClick={() => router.push(`/complaints/${newComplaintId}`)}
                                    className="mt-2 ml-7 text-sm text-green-400 underline hover:text-green-300"
                                >
                                    Open Complaint →
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setSuccessMessage('');
                                setNewComplaintId(null);
                            }}
                            className="text-green-400 hover:text-green-300"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Two Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Submit Form */}
                    <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            Submit New Complaint
                        </h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    placeholder="Brief summary of your complaint"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={6}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
                                    placeholder="Provide detailed information about your complaint..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Image (Optional)
                                </label>
                                <input
                                    id="image-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setImage(e.target.files ? e.target.files[0] : null)
                                    }
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-indigo-50 hover:file:bg-indigo-700"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
                            >
                                {submitting ? 'Submitting...' : 'Submit Complaint'}
                            </button>
                        </form>
                    </div>

                    {/* Right Column - My Complaints */}
                    <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            My Complaints
                        </h2>

                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                            </div>
                        ) : complaints.length === 0 ? (
                            <div className="text-center py-12">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-700"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <p className="mt-2 text-gray-400">No complaints yet</p>
                                <p className="text-sm text-gray-500">
                                    Submit your first complaint using the form
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                {complaints.map((complaint) => (
                                    <div
                                        key={complaint._id}
                                        className="border border-gray-800 bg-gray-800/30 rounded-lg p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/complaints/${complaint._id}`)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-white hover:text-indigo-400 transition-colors">
                                                {complaint.title}
                                            </h3>
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                    complaint.status
                                                )}`}
                                            >
                                                {complaint.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                                            {complaint.description}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(complaint.createdAt)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
