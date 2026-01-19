// =====================================================
// AUTHENTICATED FETCH WRAPPER
// =====================================================
// Automatically handles:
// - Auth token injection
// - 401 auto-retry with token refresh
// - Network error retry with exponential backoff
// - Request timeout
// - Structured error responses

const API_FETCH_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000,
  timeout: 30000, // 30 seconds
  retryOn: [408, 429, 500, 502, 503, 504]
};

/**
 * Sleep helper for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create an AbortController with timeout
 */
function createTimeoutController(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeoutId };
}

/**
 * Make an authenticated API request with automatic token refresh
 * @param {string} url - The API endpoint URL
 * @param {RequestInit} options - Fetch options
 * @param {Object} config - Additional config (retries, timeout)
 * @returns {Promise<Response>}
 */
async function authenticatedFetch(url, options = {}, config = {}) {
  const maxRetries = config.retries ?? API_FETCH_CONFIG.maxRetries;
  const timeout = config.timeout ?? API_FETCH_CONFIG.timeout;
  
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Get current auth token
      const { authToken } = await chrome.storage.local.get(['authToken']);
      
      if (!authToken && !config.allowUnauthenticated) {
        throw new AuthError('No authentication token available', 'NO_TOKEN');
      }
      
      // Set up timeout
      const { controller, timeoutId } = createTimeoutController(timeout);
      
      // Build headers
      const headers = {
        ...options.headers
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      // Make request
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Handle 401 Unauthorized - token might be expired
      if (response.status === 401 && attempt === 0) {
        console.log('🔄 Got 401, attempting token refresh...');
        
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          continue; // Retry with new token
        }
        
        // Refresh failed - throw auth error
        throw new AuthError('Session expired. Please sign in again.', 'SESSION_EXPIRED');
      }
      
      // Handle retryable status codes
      if (API_FETCH_CONFIG.retryOn.includes(response.status) && attempt < maxRetries) {
        console.log(`⚠️ Got ${response.status}, retrying (${attempt + 1}/${maxRetries})...`);
        await sleep(API_FETCH_CONFIG.retryDelay * Math.pow(2, attempt));
        continue;
      }
      
      return response;
      
    } catch (error) {
      lastError = error;
      
      // Don't retry auth errors
      if (error instanceof AuthError) {
        throw error;
      }
      
      // Handle abort (timeout)
      if (error.name === 'AbortError') {
        if (attempt < maxRetries) {
          console.log(`⏱️ Request timeout, retrying (${attempt + 1}/${maxRetries})...`);
          await sleep(API_FETCH_CONFIG.retryDelay);
          continue;
        }
        throw new NetworkError('Request timed out', 'TIMEOUT');
      }
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        if (attempt < maxRetries) {
          console.log(`🌐 Network error, retrying (${attempt + 1}/${maxRetries})...`);
          await sleep(API_FETCH_CONFIG.retryDelay * Math.pow(2, attempt));
          continue;
        }
        throw new NetworkError('Network connection failed', 'NETWORK_ERROR');
      }
      
      throw error;
    }
  }
  
  throw lastError || new Error('Request failed after retries');
}

/**
 * Try to refresh the access token
 * @returns {Promise<boolean>} - True if refresh succeeded
 */
async function tryRefreshToken() {
  try {
    const { refreshToken } = await chrome.storage.local.get(['refreshToken']);
    
    if (!refreshToken) {
      console.log('❌ No refresh token available');
      return false;
    }
    
    // Use refreshAccessToken if available (from auth.js)
    if (typeof refreshAccessToken === 'function') {
      await refreshAccessToken(refreshToken, false);
      console.log('✅ Token refreshed successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    
    // Force logout on invalid refresh token
    if (error.message === 'INVALID_REFRESH_TOKEN') {
      if (typeof signOut === 'function') {
        await signOut();
      }
    }
    
    return false;
  }
}

/**
 * Custom error class for authentication errors
 */
class AuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

/**
 * Custom error class for network errors
 */
class NetworkError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'NetworkError';
    this.code = code;
  }
}

/**
 * Convenience method for JSON API requests
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Request options
 * @param {Object} config - Additional config
 * @returns {Promise<any>} - Parsed JSON response
 */
async function authenticatedFetchJSON(url, options = {}, config = {}) {
  const response = await authenticatedFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    }
  }, config);
  
  // Handle non-OK responses
  if (!response.ok) {
    let errorData = { error: 'Request failed' };
    try {
      errorData = await response.json();
    } catch (e) {
      // Response not JSON
    }
    
    const error = new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  
  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return null;
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

/**
 * POST helper with JSON body
 */
async function postJSON(url, body, config = {}) {
  return authenticatedFetchJSON(url, {
    method: 'POST',
    body: JSON.stringify(body)
  }, config);
}

/**
 * PUT helper with JSON body
 */
async function putJSON(url, body, config = {}) {
  return authenticatedFetchJSON(url, {
    method: 'PUT',
    body: JSON.stringify(body)
  }, config);
}

/**
 * DELETE helper
 */
async function deleteJSON(url, config = {}) {
  return authenticatedFetchJSON(url, {
    method: 'DELETE'
  }, config);
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.authenticatedFetch = authenticatedFetch;
  window.authenticatedFetchJSON = authenticatedFetchJSON;
  window.postJSON = postJSON;
  window.putJSON = putJSON;
  window.deleteJSON = deleteJSON;
  window.AuthError = AuthError;
  window.NetworkError = NetworkError;
}
