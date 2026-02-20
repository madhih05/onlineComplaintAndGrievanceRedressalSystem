'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchAPI } from '@/utils/api';
import type { Complaint } from '@/types';

export default function ComplaintDetailPage() {
    const router = useRouter();
    const params = useParams();
    const complaintId = params.id as string;

    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [userRole, setUserRole] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState('');

    // Edit form state
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [editPriority, setEditPriority] = useState('');
    const [editAssignedTo, setEditAssignedTo] = useState('');
    const [editComment, setEditComment] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token) {
            router.push('/login');
            return;
        }

        setUserRole(role || '');
        fetchComplaint();
    }, [complaintId, router]);

    const fetchComplaint = async () => {
        try {
            const response = await fetchAPI(`/complaints/${complaintId}`, {
                method: 'GET',
            });
            setComplaint(response.complaint);
            // Initialize edit form with current values
            setEditTitle(response.complaint.title);
            setEditDescription(response.complaint.description);
            setEditStatus(response.complaint.status);
            setEditPriority(response.complaint.priority);
            setEditAssignedTo(response.assigneeEmail || '');
        } catch (err: any) {
            setError(err.message || 'Failed to fetch complaint');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const body: any = {};

            // Role-based field inclusion
            if (userRole === 'user') {
                body.title = editTitle;
                body.description = editDescription;
                body.status = editStatus;
            } else if (userRole === 'supportStaff') {
                body.status = editStatus;
                body.priority = editPriority;
            } else if (userRole === 'admin') {
                body.status = editStatus;
                body.priority = editPriority;
                if (editAssignedTo) {
                    body.assignedTo = editAssignedTo;
                }
            }

            // Add comment if provided
            if (editComment.trim()) {
                body.comment = editComment;
            }

            await fetchAPI(`/complaints/${complaintId}`, {
                method: 'PUT',
                body,
            });

            setSuccessMessage('Complaint updated successfully!');
            setIsEditMode(false);
            setEditComment('');

            // Re-fetch complaint to get updated data
            await fetchComplaint();
        } catch (err: any) {
            setError(err.message || 'Failed to update complaint');
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        if (userRole === 'admin' || userRole === 'supportStaff') {
            router.push('/admin');
        } else {
            router.push('/dashboard');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading complaint...</p>
                </div>
            </div>
        );
    }

    if (error && !complaint) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!complaint) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <button
                            onClick={handleBack}
                            className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                            Back to Dashboard
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">
                            Complaint Details
                        </h1>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center">
                            <svg
                                className="w-5 h-5 text-green-600 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <p className="text-green-800 font-medium">{successMessage}</p>
                        </div>
                        <button
                            onClick={() => setSuccessMessage('')}
                            className="text-green-600 hover:text-green-800"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - 2/3 width */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Complaint Card */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {isEditMode ? 'Edit Complaint' : 'Complaint Details'}
                                </h2>
                                {!isEditMode && (
                                    <button
                                        onClick={() => setIsEditMode(true)}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                    >
                                        Edit Ticket
                                    </button>
                                )}
                            </div>

                            {!isEditMode ? (
                                /* View Mode */
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                                            Title
                                        </h3>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {complaint.title}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                                            Description
                                        </h3>
                                        <p className="text-gray-700 whitespace-pre-wrap">
                                            {complaint.description}
                                        </p>
                                    </div>

                                    <div className="flex gap-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 mb-1">
                                                Status
                                            </h3>
                                            <span
                                                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                                    complaint.status
                                                )}`}
                                            >
                                                {complaint.status}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 mb-1">
                                                Priority
                                            </h3>
                                            <span
                                                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                                                    complaint.priority
                                                )}`}
                                            >
                                                {complaint.priority}
                                            </span>
                                        </div>
                                    </div>

                                    {complaint.imageUrl && (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 mb-2">
                                                Attached Image
                                            </h3>
                                            <img
                                                src={complaint.imageUrl}
                                                alt="Complaint"
                                                className="max-w-full h-auto rounded-lg shadow-md"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 mb-1">
                                                Created By
                                            </h3>
                                            <p className="text-gray-900">
                                                {complaint.createdBy?.username || 'Unknown'}
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 mb-1">
                                                Created At
                                            </h3>
                                            <p className="text-gray-900">
                                                {formatDate(complaint.createdAt)}
                                            </p>
                                        </div>

                                        {complaint.assignedTo && (
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500 mb-1">
                                                    Assigned To
                                                </h3>
                                                <p className="text-gray-900">
                                                    {complaint.assignedTo.username}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Edit Mode */
                                <form onSubmit={handleSave} className="space-y-4">
                                    {/* User role fields */}
                                    {userRole === 'user' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Title
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Description
                                                </label>
                                                <textarea
                                                    required
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    rows={6}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Status field - role-based options */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={editStatus}
                                            onChange={(e) => setEditStatus(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        >
                                            {userRole === 'user' ? (
                                                <>
                                                    <option value={editStatus}>{editStatus.charAt(0).toUpperCase() + editStatus.slice(1)}</option>
                                                    <option value="resolved">Resolved</option>
                                                    <option value="closed">Closed</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="open">Open</option>
                                                    <option value="assigned">Assigned</option>
                                                    <option value="inProgress">In Progress</option>
                                                    <option value="resolved">Resolved</option>
                                                    <option value="closed">Closed</option>
                                                </>
                                            )}
                                        </select>
                                    </div>

                                    {/* Admin and Staff can edit priority */}
                                    {(userRole === 'admin' || userRole === 'supportStaff') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Priority
                                            </label>
                                            <select
                                                value={editPriority}
                                                onChange={(e) => setEditPriority(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="critical">Critical</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Admin can reassign */}
                                    {userRole === 'admin' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Assign To (Email)
                                            </label>
                                            <input
                                                type="email"
                                                value={editAssignedTo}
                                                onChange={(e) => setEditAssignedTo(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                                placeholder="staff@example.com"
                                            />
                                        </div>
                                    )}

                                    {/* Comment field for all */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Comment (Optional)
                                        </label>
                                        <textarea
                                            value={editComment}
                                            onChange={(e) => setEditComment(e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                                            placeholder="Add a note to the timeline..."
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditMode(false);
                                                setEditComment('');
                                                setError('');
                                            }}
                                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Timeline - 1/3 width */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                Timeline
                            </h3>

                            {complaint.timeline && complaint.timeline.length > 0 ? (
                                <div className="space-y-4">
                                    {complaint.timeline.map((entry, index) => (
                                        <div key={index} className="relative pl-6 pb-4">
                                            {/* Timeline line */}
                                            {index !== complaint.timeline!.length - 1 && (
                                                <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200" />
                                            )}

                                            {/* Timeline dot */}
                                            <div className="absolute left-0 top-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white" />

                                            {/* Timeline content */}
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {entry.status}
                                                </p>
                                                {entry.comment && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {entry.comment}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatDate(entry.timestamp)}
                                                </p>
                                                {entry.createdBy && (
                                                    <p className="text-xs text-gray-500">
                                                        by {entry.createdBy.username}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No timeline entries yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
