const API_BASE_URL = 'http://localhost:3000';

interface FetchAPIOptions extends RequestInit {
    body?: any;
}

export async function fetchAPI(endpoint: string, options: FetchAPIOptions = {}) {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // Prepare headers
    const headers: Record<string, string> = {};
    if (options.headers && typeof options.headers === 'object') {
        Object.assign(headers, options.headers);
    }

    // Add Authorization header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Only set Content-Type to application/json if body is NOT FormData
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }

    // Make the fetch request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    // Handle errors
    if (!response.ok) {
        const errorMessage = typeof data === 'object' && data.message
            ? data.message
            : typeof data === 'string'
                ? data
                : 'An error occurred';
        throw new Error(errorMessage);
    }

    return data;
}
