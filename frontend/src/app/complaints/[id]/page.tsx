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

    // Feedback form state
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

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

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            setError('Please select a rating before submitting');
            return;
        }

        setIsSubmittingFeedback(true);
        setError('');

        try {
            await fetchAPI(`/complaints/${complaintId}/feedback`, {
                method: 'POST',
                body: { rating, comment: feedbackComment },
            });

            setSuccessMessage('Thank you for your feedback!');
            setRating(0);
            setFeedbackComment('');

            // Re-fetch complaint to refresh and show read-only feedback view
            await fetchComplaint();
        } catch (err: any) {
            setError(err.message || 'Failed to submit feedback');
        } finally {
            setIsSubmittingFeedback(false);
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

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low':
                return 'bg-green-500/20 text-green-400 border border-green-500/30';
            case 'medium':
                return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
            case 'high':
                return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
            case 'critical':
                return 'bg-red-500/20 text-red-400 border border-red-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Loading complaint...</p>
                </div>
            </div>
        );
    }

    if (error && !complaint) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!complaint) return null;

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Navigation Bar */}
            <nav className="bg-gray-900 border-b border-gray-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <button
                            onClick={handleBack}
                            className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
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
                        <h1 className="text-xl font-bold text-white">
                            Complaint Details
                        </h1>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 bg-green-500/20 border border-green-500/30 rounded-2xl p-4 flex items-center justify-between">
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
                        <button
                            onClick={() => setSuccessMessage('')}
                            className="text-green-400 hover:text-green-300"
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
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - 2/3 width */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Complaint Card */}
                        <div className="bg-gray-900 rounded-3xl border border-gray-800 shadow-lg p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-2xl font-bold text-white">
                                    {isEditMode ? 'Edit Complaint' : 'Complaint Details'}
                                </h2>
                                {!isEditMode && (
                                    <button
                                        onClick={() => setIsEditMode(true)}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium"
                                    >
                                        Edit Ticket
                                    </button>
                                )}
                            </div>

                            {!isEditMode ? (
                                /* View Mode */
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-400 mb-1">
                                            Title
                                        </h3>
                                        <p className="text-lg font-semibold text-white">
                                            {complaint.title}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-400 mb-1">
                                            Description
                                        </h3>
                                        <p className="text-gray-300 whitespace-pre-wrap">
                                            {complaint.description}
                                        </p>
                                    </div>

                                    <div className="flex gap-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-400 mb-1">
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
                                            <h3 className="text-sm font-medium text-gray-400 mb-1">
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
                                            <h3 className="text-sm font-medium text-gray-400 mb-2">
                                                Attached Image
                                            </h3>
                                            <img
                                                src={complaint.imageUrl}
                                                alt="Complaint"
                                                className="max-w-full h-auto rounded-2xl shadow-md"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-400 mb-1">
                                                Created By
                                            </h3>
                                            <p className="text-white">
                                                {complaint.createdBy?.username || 'Unknown'}
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-gray-400 mb-1">
                                                Created At
                                            </h3>
                                            <p className="text-white">
                                                {formatDate(complaint.createdAt)}
                                            </p>
                                        </div>

                                        {complaint.assignedTo && (
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-400 mb-1">
                                                    Assigned To
                                                </h3>
                                                <p className="text-white">
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
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Title
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Description
                                                </label>
                                                <textarea
                                                    required
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    rows={6}
                                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Status field - role-based options */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={editStatus}
                                            onChange={(e) => setEditStatus(e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                Priority
                                            </label>
                                            <select
                                                value={editPriority}
                                                onChange={(e) => setEditPriority(e.target.value)}
                                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                Assign To (Email)
                                            </label>
                                            <input
                                                type="email"
                                                value={editAssignedTo}
                                                onChange={(e) => setEditAssignedTo(e.target.value)}
                                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                                placeholder="staff@example.com"
                                            />
                                        </div>
                                    )}

                                    {/* Comment field for all */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Comment (Optional)
                                        </label>
                                        <textarea
                                            value={editComment}
                                            onChange={(e) => setEditComment(e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                            placeholder="Add a note to the timeline..."
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium border border-gray-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Timeline & Feedback - Right Column */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Timeline Card */}
                        <div className="bg-gray-900 rounded-3xl border border-gray-800 shadow-lg p-6 sticky top-8">
                            <h3 className="text-lg font-bold text-white mb-4">
                                Timeline
                            </h3>

                            {complaint.timeline && complaint.timeline.length > 0 ? (
                                <div className="space-y-4">
                                    {complaint.timeline.map((entry, index) => (
                                        <div key={index} className="relative pl-6 pb-4">
                                            {/* Timeline line */}
                                            {index !== complaint.timeline!.length - 1 && (
                                                <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-800" />
                                            )}

                                            {/* Timeline dot */}
                                            <div className="absolute left-0 top-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-gray-900" />

                                            {/* Timeline content */}
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    {entry.status}
                                                </p>
                                                {entry.comment && (
                                                    <p className="text-sm text-gray-400 mt-1">
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

                        {/* Feedback Card */}
                        {complaint.feedback && complaint.feedback.rating ? (
                            /* Read-Only Feedback View */
                            <div className="bg-gray-900 rounded-3xl p-6 mt-6 border border-gray-800 shadow-lg">
                                <h3 className="text-lg font-bold text-white mb-4">
                                    Your Feedback
                                </h3>

                                {/* Star Rating Display */}
                                <div className="flex items-center gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <svg
                                            key={star}
                                            className={`w-6 h-6 ${star <= complaint.feedback!.rating
                                                ? 'text-yellow-400'
                                                : 'text-gray-700'
                                                }`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>

                                {/* Comment Display */}
                                {complaint.feedback.comment && (
                                    <p className="text-gray-300 text-sm mb-4">
                                        {complaint.feedback.comment}
                                    </p>
                                )}

                                {/* Date */}
                                <p className="text-xs text-gray-500">
                                    Submitted on {formatDate(complaint.feedback.createdAt)}
                                </p>
                            </div>
                        ) : userRole === 'user' &&
                            (complaint.status === 'resolved' || complaint.status === 'closed') ? (
                            /* Interactive Feedback Form */
                            <form
                                onSubmit={handleFeedbackSubmit}
                                className="bg-gray-900 rounded-3xl p-6 mt-6 border border-gray-800 shadow-lg"
                            >
                                <h3 className="text-lg font-bold text-white mb-4">
                                    Share Your Feedback
                                </h3>

                                {/* Star Rating Input */}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-sm text-gray-400 mr-2">Rate this resolution:</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setRating(star)}
                                                className="transition-transform hover:scale-110"
                                            >
                                                <svg
                                                    className={`w-7 h-7 cursor-pointer transition-colors ${star <= (hoverRating || rating)
                                                        ? 'text-yellow-400'
                                                        : 'text-gray-700'
                                                        }`}
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Error when no rating selected */}
                                {error && error.includes('rating') && (
                                    <p className="text-sm text-red-400 mb-3">{error}</p>
                                )}

                                {/* Comment Textarea */}
                                <textarea
                                    value={feedbackComment}
                                    onChange={(e) => setFeedbackComment(e.target.value)}
                                    placeholder="Share any comments about how your complaint was resolved (optional)"
                                    rows={4}
                                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-2xl p-4 mt-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
                                />

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmittingFeedback}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 px-4 w-full mt-4 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                            </form>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
