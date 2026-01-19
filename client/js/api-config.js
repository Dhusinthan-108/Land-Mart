// API Configuration for Land Mart
// Centralized configuration for all backend API calls

const API_CONFIG = {
    // Base URL for API endpoints
    BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5503'
        : window.location.origin,

    // API Endpoints
    ENDPOINTS: {
        // User endpoints
        REGISTER: '/api/users/register',
        LOGIN: '/api/users/login',
        GET_USER: '/api/users/profile',
        UPDATE_USER: '/api/users/profile',

        // Property endpoints
        GET_PROPERTIES: '/api/properties',
        GET_PROPERTY: '/api/properties/:id',
        CREATE_PROPERTY: '/api/properties',
        UPDATE_PROPERTY: '/api/properties/:id',
        DELETE_PROPERTY: '/api/properties/:id',
        MY_PROPERTIES: '/api/properties/my-properties',
        GET_USER_PROPERTIES: '/api/properties/user/:userId',
        SAVED_PROPERTIES: '/api/properties/saved/:userId',
        SAVE_PROPERTY: '/api/properties/:id/save',
        UNSAVE_PROPERTY: '/api/properties/:id/unsave',

        // Message endpoints
        GET_MESSAGES: '/api/messages/conversations',
        SEND_MESSAGE: '/api/messages',
        GET_CONVERSATION_MESSAGES: '/api/messages/conversation/:conversationId',
        GET_CONVERSATION: '/api/messages/conversation/:userId',
        CONVERSATIONS: '/api/messages/conversations',

        // App settings
        GET_SETTINGS: '/api/app-settings',
        UPDATE_SETTINGS: '/api/app-settings',

        // Transactions
        GET_TRANSACTIONS: '/api/transactions',
        CREATE_TRANSACTION: '/api/transactions'
    }
};

// Helper function to build full URL
function getApiUrl(endpoint, params = {}) {
    let url = API_CONFIG.BASE_URL + endpoint;

    // Replace path parameters (e.g., :id)
    Object.keys(params).forEach(key => {
        url = url.replace(`:${key}`, params[key]);
    });

    return url;
}

// Helper function for API calls with error handling
async function apiCall(endpoint, options = {}) {
    const url = typeof endpoint === 'string' ? getApiUrl(endpoint) : endpoint;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };

    try {
        const response = await fetch(url, mergedOptions);

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            throw new Error(data.message || data || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, getApiUrl, apiCall };
}
