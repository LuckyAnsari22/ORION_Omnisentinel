// Check for backend override in URL (e.g. ?backend=https://abcdef.ngrok-free.app)
const urlParams = new URLSearchParams(window.location.search);
const backendOverride = urlParams.get('backend');

// Detect if running locally
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_BASE_URL = backendOverride || import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5001' : 'https://guardian-ai-backend.onrender.com');

export const getApiUrl = (endpoint) => {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_BASE_URL}/${cleanEndpoint}`;
};
