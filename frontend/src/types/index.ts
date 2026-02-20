export interface User {
    _id: string;
    username: string;
}

export interface Complaint {
    _id: string;
    title: string;
    description: string;
    status: 'open' | 'assigned' | 'inProgress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    imageUrl?: string;
    createdAt: string;
    createdBy?: User;
    assignedTo?: User;
    timeline?: TimelineEntry[];
    feedback?: Feedback;
}

export interface TimelineEntry {
    status: string;
    timestamp: string;
    comment?: string;
    createdAt: string;
    createdBy?: User;
}

export interface Feedback {
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    message: string;
    token: string;
    userId: string;
    role: 'user' | 'admin' | 'supportStaff';
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    username: string;
    email: string;
    password: string;
    role?: 'user' | 'admin' | 'supportStaff';
    adminSecret?: string;
}
