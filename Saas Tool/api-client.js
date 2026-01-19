// API Client with automatic token refresh
// Handles 401 errors and retries with refreshed token

// Use window scope to share API_URL
window.API_URL = window.API_URL || window.CONFIG?.API_URL || 'https://crmsync-api.onrender.com/api';
const API_URL = window.API_URL;

/**
 * Authenticated fetch wrapper that auto-refreshes token on 401
 * @param {string} url - API endpoint URL
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
async function authenticatedFetch(url, options = {}) {
  // Get current auth token
  const { authToken, refreshToken } = await chrome.storage.local.get(['authToken', 'refreshToken']);
  
  if (!authToken) {
    throw new Error('Not authenticated. Please log in.');
  }
  
  // Add authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${authToken}`
  };
  
  // Make initial request
  let response = await fetch(url, {
    ...options,
    headers
  });
  
  // If 401, try to refresh token and retry
  if (response.status === 401 && refreshToken) {
    console.log('🔄 Received 401, attempting token refresh...');
    
    try {
      // Import refreshAccessToken from auth.js
      if (typeof refreshAccessToken === 'undefined') {
        throw new Error('refreshAccessToken not available');
      }
      
      const newToken = await refreshAccessToken(refreshToken, false);
      
      // Retry request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`
        }
      });
      
      console.log('✅ Request retried with refreshed token');
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // If refresh fails, sign out user
      if (typeof signOut !== 'undefined') {
        await signOut();
      } else {
        // Fallback: clear auth data manually
        await chrome.storage.local.remove(['authToken', 'refreshToken', 'user', 'isAuthenticated']);
      }
      
      // Redirect to login if in popup context
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = 'login.html';
      }
      
      throw new Error('Session expired. Please log in again.');
    }
  }
  
  return response;
}

/**
 * Convenience method for GET requests
 * @param {string} url - API endpoint URL
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
async function apiGet(url, options = {}) {
  const response = await authenticatedFetch(url, {
    ...options,
    method: 'GET'
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  
  return response.json();
}

/**
 * Convenience method for POST requests
 * @param {string} url - API endpoint URL
 * @param {any} data - Request body
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
async function apiPost(url, data, options = {}) {
  const response = await authenticatedFetch(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  
  return response.json();
}

/**
 * Convenience method for PUT requests
 * @param {string} url - API endpoint URL
 * @param {any} data - Request body
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
async function apiPut(url, data, options = {}) {
  const response = await authenticatedFetch(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  
  return response.json();
}

/**
 * Convenience method for DELETE requests
 * @param {string} url - API endpoint URL
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
async function apiDelete(url, options = {}) {
  const response = await authenticatedFetch(url, {
    ...options,
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  
  return response.json();
}

console.log('✅ API client loaded with automatic token refresh');
