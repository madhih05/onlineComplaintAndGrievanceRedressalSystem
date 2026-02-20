'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/utils/api';
import type { Complaint } from '@/types';

export default function AdminPage() {
    const router = useRouter();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState<string>('');
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token) {
            router.push('/login');
            return;
        }

        if (role !== 'admin' && role !== 'supportStaff') {
            router.push('/dashboard');
            return;
        }

        setUserRole(role);
        fetchComplaints('', '', '');
    }, [router]);

    // Debounce search query
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchComplaints(searchQuery, statusFilter, priorityFilter);
        }, 500); // 500ms debounce

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, statusFilter, priorityFilter]);

    const fetchComplaints = async (q: string = '', status: string = '', priority: string = '') => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (q) queryParams.append('q', q);
            if (status) queryParams.append('status', status);
            if (priority) queryParams.append('priority', priority);

            const endpoint = queryParams.toString()
                ? `/complaints?${queryParams.toString()}`
                : '/complaints';

            const response = await fetchAPI(endpoint, {
                method: 'GET',
            });
            setComplaints(response.complaints || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch complaints');
        } finally {
            setLoading(false);
        }
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setPriorityFilter('');
    };

    const handleStatusChange = async (complaintId: string, newStatus: string) => {
        setUpdatingStatus(complaintId);
        try {
            await fetchAPI(`/complaints/${complaintId}/status`, {
                method: 'PUT',
                body: { status: newStatus },
            });

            // Update local state
            setComplaints((prev) =>
                prev.map((c) =>
                    c._id === complaintId ? { ...c, status: newStatus as any } : c
                )
            );
        } catch (err: any) {
            alert(err.message || 'Failed to update status');
        } finally {
            setUpdatingStatus(null);
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

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low':
                return 'bg-green-100 text-green-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'high':
                return 'bg-orange-100 text-orange-800';
            case 'critical':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open':
                return 'bg-blue-100 text-blue-800';
            case 'assigned':
                return 'bg-purple-100 text-purple-800';
            case 'inProgress':
                return 'bg-yellow-100 text-yellow-800';
            case 'resolved':
                return 'bg-green-100 text-green-800';
            case 'closed':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div>
                            <h1 className="text-2xl font-bold text-indigo-600">
                                {userRole === 'admin' ? 'Admin Dashboard' : 'Staff Dashboard'}
                            </h1>
                            <p className="text-xs text-gray-500">
                                {userRole === 'admin'
                                    ? 'Manage all complaints'
                                    : 'View assigned complaints'}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                        <h2 className="text-xl font-bold text-gray-900">
                            Complaints Overview
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {complaints.length} total complaints
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Filter Bar */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search Input */}
                            <div className="relative">
                                <svg
                                    className="absolute left-3 top-3 h-5 w-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search complaints..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                />
                            </div>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white"
                            >
                                <option value="">All Statuses</option>
                                <option value="open">Open</option>
                                <option value="assigned">Assigned</option>
                                <option value="inProgress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>

                            {/* Priority Filter */}
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white"
                            >
                                <option value="">All Priorities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>

                            {/* Reset Button */}
                            <button
                                onClick={handleResetFilters}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : complaints.length === 0 ? (
                        <div className="text-center py-12">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
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
                            <p className="mt-2 text-gray-500">No complaints found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Title
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        {userRole === 'admin' && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Assigned To
                                            </th>
                                        )}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Priority
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {complaints.map((complaint) => (
                                        <tr
                                            key={complaint._id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() =>
                                                        router.push(`/complaints/${complaint._id}`)
                                                    }
                                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900 hover:underline text-left"
                                                >
                                                    {complaint.title}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                                                    {complaint.description}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm text-gray-900">
                                                    {complaint.createdBy?.username || 'Unknown'}
                                                </p>
                                            </td>
                                            {userRole === 'admin' && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="text-sm text-gray-900">
                                                        {complaint.assignedTo?.username || 'Unassigned'}
                                                    </p>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                                        complaint.priority
                                                    )}`}
                                                >
                                                    {complaint.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(complaint.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={complaint.status}
                                                    onChange={(e) =>
                                                        handleStatusChange(complaint._id, e.target.value)
                                                    }
                                                    disabled={updatingStatus === complaint._id}
                                                    className={`text-sm rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${updatingStatus === complaint._id
                                                        ? 'opacity-50 cursor-not-allowed'
                                                        : 'cursor-pointer'
                                                        } ${getStatusColor(complaint.status)} font-medium px-3 py-1`}
                                                >
                                                    <option value="open">Open</option>
                                                    <option value="assigned">Assigned</option>
                                                    <option value="inProgress">In Progress</option>
                                                    <option value="resolved">Resolved</option>
                                                    <option value="closed">Closed</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
