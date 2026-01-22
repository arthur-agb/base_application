// src/services/api.js
import axios from 'axios';

// Purpose
// 1 - Create requests to the back end API service.
// 2 - Add authentication header with interceptior.

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get the token *when needed*
const getToken = () => {
  return localStorage.getItem('token');
};

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      // Log the token being used for a specific, problematic request
      if (config.url.includes('/dashboard')) {
          console.log('[API Interceptor] Token being used for /dashboard call:', token); 
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid credentials)
    if (error.response && error.response.status === 401) {

      const originalRequestUrl = error.config.url; // Get the URL of the request that failed

      // --- START OF THE FIX ---
      // We must prevent the global logout for BOTH the initial login and the 2FA verification step.
      // A 401 error on these routes is expected for bad credentials and should be handled by the component.
      const isLoginAttempt = originalRequestUrl === '/auth/login' || originalRequestUrl === '/auth/login/verify-2fa';

      if (!isLoginAttempt) {
        // For any other 401 error, the user's session is likely invalid, so we log them out.
        console.warn('Response Interceptor: Caught 401 on a protected route. Clearing auth state and redirecting to login.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login page - triggers reload
        window.location.href = '/login';
      } else {
        // If the 401 error is on a login route, do not refresh the page.
        // Let the promise reject so the component can display an "Invalid credentials" error.
        console.log(`Response Interceptor: Caught 401 on login route (${originalRequestUrl}). Propagating error.`);
      }
      // --- END OF THE FIX ---
    }
    
    return Promise.reject(error);
  }
);

export default api;