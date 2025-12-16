// Authentication module for CRMSYNC Extension
// Handles email/password and Google OAuth authentication

// Use window scope to share API_URL across modules
window.API_URL = window.API_URL || 'https://crmsync-extension.onrender.com/api';
const API_URL = window.API_URL;

/**
 * Sign in with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{user, accessToken, refreshToken}>}
 */
async function signInWithEmail(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    
    const data = await response.json();
    
    // Store auth data in chrome.storage (clear guest mode)
    await chrome.storage.local.set({
      authToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
      isAuthenticated: true,
      authMethod: 'email',
      isGuest: false  // Clear guest mode when logging in
    });
    
    console.log('✅ User logged in:', data.user.email);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Register new user with email and password
 * @param {string} email 
 * @param {string} password 
 * @param {string} displayName 
 * @returns {Promise<{user, accessToken, refreshToken}>}
 */
async function registerWithEmail(email, password, displayName) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    
    const data = await response.json();
    
    // Store auth data (clear guest mode)
    await chrome.storage.local.set({
      authToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
      isAuthenticated: true,
      authMethod: 'email',
      isGuest: false  // Clear guest mode when registering
    });
    
    console.log('✅ User registered:', data.user.email);
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Sign in with Google OAuth
 * Uses Chrome Identity API
 * @returns {Promise<{user, accessToken, refreshToken}>}
 */
async function signInWithGoogle() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, async (googleToken) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      try {
        // Exchange Google token for backend JWT
        const response = await fetch(`${API_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ googleToken })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Google login failed');
        }
        
        const data = await response.json();
        
        // Store auth data (clear guest mode)
        await chrome.storage.local.set({
          authToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          isAuthenticated: true,
          authMethod: 'google',
          googleToken: googleToken,
          isGuest: false  // Clear guest mode when logging in with Google
        });
        
        console.log('✅ User logged in with Google:', data.user.email);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Sign out user
 * Clears auth data and revokes tokens
 */
async function signOut() {
  try {
    const { authToken, authMethod } = await chrome.storage.local.get(['authToken', 'authMethod']);
    
    // Call backend logout endpoint
    if (authToken) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      } catch (error) {
        console.error('Logout API error:', error);
      }
    }
    
    // Clear Google OAuth token if applicable
    if (authMethod === 'google') {
      chrome.identity.clearAllCachedAuthTokens(() => {
        console.log('Google tokens cleared');
      });
    }
    
    // Clear local storage
    await chrome.storage.local.remove([
      'authToken',
      'refreshToken',
      'user',
      'isAuthenticated',
      'authMethod',
      'googleToken',
      'lastSyncAt'
    ]);
    
    console.log('✅ User signed out');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Get current auth token
 * Automatically refreshes if expired
 * @returns {Promise<string|null>}
 */
async function getAuthToken() {
  const { authToken, refreshToken } = await chrome.storage.local.get(['authToken', 'refreshToken']);
  
  if (!authToken) {
    return null;
  }
  
  // Check if token is expired (simple check - JWT decode would be better)
  try {
    const tokenParts = authToken.split('.');
    if (tokenParts.length !== 3) {
      return authToken; // Not a JWT, return as is
    }
    
    const payload = JSON.parse(atob(tokenParts[1]));
    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    // Refresh if token expires in less than 1 minute
    if (expiresAt - now < 60000) {
      console.log('🔄 Token expiring soon, refreshing...');
      return await refreshAccessToken(refreshToken);
    }
    
    return authToken;
  } catch (error) {
    console.error('Token parse error:', error);
    return authToken; // Return token anyway, let server validate
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken 
 * @returns {Promise<string>}
 */
async function refreshAccessToken(refreshToken) {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    
    // Update stored token
    await chrome.storage.local.set({
      authToken: data.accessToken
    });
    
    console.log('✅ Token refreshed');
    return data.accessToken;
  } catch (error) {
    console.error('Token refresh error:', error);
    // Token refresh failed, user needs to log in again
    await signOut();
    throw new Error('Session expired, please log in again');
  }
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
async function isAuthenticated() {
  const { isAuthenticated, authToken } = await chrome.storage.local.get(['isAuthenticated', 'authToken']);
  return isAuthenticated === true && !!authToken;
}

/**
 * Get current user info
 * @returns {Promise<Object|null>}
 */
async function getCurrentUser() {
  try {
    const token = await getAuthToken();
    if (!token) {
      return null;
    }
    
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user info');
    }
    
    const data = await response.json();
    
    // Update stored user info
    await chrome.storage.local.set({ user: data.user });
    
    return data.user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Continue as guest (no authentication)
 * Sets a flag that user chose guest mode
 */
async function continueAsGuest() {
  await chrome.storage.local.set({
    isAuthenticated: false,
    isGuest: true,
    guestModeChosenAt: new Date().toISOString()
  });
  console.log('👤 Continuing as guest');
}

/**
 * Check if user is in guest mode
 * @returns {Promise<boolean>}
 */
async function isGuestMode() {
  const { isGuest } = await chrome.storage.local.get(['isGuest']);
  return isGuest === true;
}

/**
 * Show login prompt to guest users (periodic reminder)
 * @returns {Promise<boolean>} True if user should see login prompt
 */
async function shouldShowLoginPrompt() {
  const { isGuest, guestModeChosenAt, lastLoginPrompt } = await chrome.storage.local.get([
    'isGuest',
    'guestModeChosenAt',
    'lastLoginPrompt'
  ]);
  
  if (!isGuest) {
    return false; // User is logged in or hasn't chosen yet
  }
  
  // Show prompt once per week
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const lastPrompt = lastLoginPrompt ? new Date(lastLoginPrompt).getTime() : 0;
  
  if (now - lastPrompt > ONE_WEEK) {
    await chrome.storage.local.set({ lastLoginPrompt: new Date().toISOString() });
    return true;
  }
  
  return false;
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.CRMSyncAuth = {
    signInWithEmail,
    registerWithEmail,
    signInWithGoogle,
    signOut,
    getAuthToken,
    isAuthenticated,
    getCurrentUser,
    continueAsGuest,
    isGuestMode,
    shouldShowLoginPrompt,
  };
}

