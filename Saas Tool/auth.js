// Authentication module for CRMSYNC Extension
// Handles email/password and Google OAuth authentication

// API_URL - works in both popup and service worker contexts
const API_URL = (typeof window !== 'undefined' && window.CONFIG?.API_URL) || 
                (typeof self !== 'undefined' && self.CONFIG?.API_URL) ||
                'https://crmsync-api.onrender.com/api';

// Export to window if available (popup context)
if (typeof window !== 'undefined') {
  window.API_URL = API_URL;
}

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
    
    // Ensure tier field exists for popup compatibility
    if (data.user && !data.user.tier && data.user.subscriptionTier) {
      data.user.tier = data.user.subscriptionTier;
    }
    
    // Store auth data in chrome.storage (clear guest mode)
    await chrome.storage.local.set({
      authToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
      isAuthenticated: true,
      authMethod: 'email',
      isGuest: false  // Clear guest mode when logging in
    });
    
    console.log('✅ User logged in:', data.user.email, 'tier:', data.user.tier);
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
    
    // Ensure tier field exists for popup compatibility
    if (data.user && !data.user.tier && data.user.subscriptionTier) {
      data.user.tier = data.user.subscriptionTier;
    }
    
    // Store auth data (clear guest mode)
    await chrome.storage.local.set({
      authToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
      isAuthenticated: true,
      authMethod: 'email',
      isGuest: false  // Clear guest mode when registering
    });
    
    console.log('✅ User registered:', data.user.email, 'tier:', data.user.tier);
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Sign in with Google OAuth
 * Uses Chrome Identity API
 * Note: Currently disabled - requires OAuth Client ID configuration
 * @returns {Promise<{user, accessToken, refreshToken}>}
 */
async function signInWithGoogle() {
  // Check if OAuth is configured
  const manifest = chrome.runtime.getManifest();
  if (!manifest.oauth2 || manifest.oauth2.client_id.includes('YOUR_GOOGLE_CLIENT_ID')) {
    throw new Error('Google Sign-In is not configured yet. Please use email/password to sign in.');
  }
  
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
        
        // Ensure tier field exists for popup compatibility
        if (data.user && !data.user.tier && data.user.subscriptionTier) {
          data.user.tier = data.user.subscriptionTier;
        }
        
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
        
        console.log('✅ User logged in with Google:', data.user.email, 'tier:', data.user.tier);
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

    // Clear ALL authentication and user data from storage
    await chrome.storage.local.remove([
      'authToken',
      'refreshToken',
      'user',
      'isAuthenticated',
      'authMethod',
      'googleToken',
      'lastSyncAt',
      'subscription',
      'accessToken',
      'lastActivity',
      'contacts',  // Clear all contacts
      'contactCount',  // Clear contact count
      'recentlyUpdatedContacts',  // Clear recent updates
      'pendingUpdates',  // Clear pending updates
      'syncHistory',  // Clear sync history
      'lastSeenCountAtSidebarOpen',  // Clear sidebar notification state
      'upgradePanel_lastDismissed'  // Clear upgrade panel dismissal
    ]);

    // Also clear from sync storage if used
    await chrome.storage.sync.remove([
      'authToken',
      'refreshToken',
      'user',
      'isAuthenticated'
    ]).catch(() => {
      // Ignore errors if nothing to remove
    });

    console.log('✅ User signed out from extension (auth, contacts, and sync data cleared)');

    // ✅ Notify website about logout (bidirectional sync)
    try {
      // Find all website tabs and notify them
      const tabs = await chrome.tabs.query({ 
        url: ['https://www.crm-sync.net/*', 'https://crm-sync.net/*'] 
      });
      
      if (tabs && tabs.length > 0) {
        // User has website open, notify those tabs
        for (const tab of tabs) {
          try {
            await chrome.tabs.sendMessage(tab.id, { 
              action: 'EXTENSION_LOGGED_OUT' 
            });
            console.log('✅ Notified website tab of extension logout');
          } catch (err) {
            // Tab might not have content script loaded yet
            console.log('Could not notify tab:', err.message);
          }
        }
      } else {
        // No website tabs open, that's fine - user is logged out from extension
        console.log('ℹ️ No website tabs open to notify');
      }
    } catch (error) {
      console.error('Error notifying website tabs:', error);
    }

    console.log('✅ Logout complete');
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
  
  // Skip expiration check if no refresh token available
  if (!refreshToken) {
    console.log('📋 No refresh token, using existing token');
    return authToken;
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
    
    // Only refresh if token expires in less than 5 minutes
    if (expiresAt - now < 300000) { // Changed from 60000 to 300000
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
 * @param {boolean} autoSignOut - Whether to automatically sign out on failure (default: false)
 * @returns {Promise<string>}
 */
async function refreshAccessToken(refreshToken, autoSignOut = false) {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!response.ok) {
      // Check status codes
      if (response.status === 401 || response.status === 403) {
        throw new Error('INVALID_REFRESH_TOKEN');
      }
      throw new Error(`Token refresh failed (${response.status})`);
    }
    
    const data = await response.json();
    
    // Update stored token
    await chrome.storage.local.set({
      authToken: data.accessToken
    });
    
    if (typeof logger !== 'undefined') {
      logger.log('✅ Token refreshed');
    } else {
      console.log('✅ Token refreshed');
    }
    return data.accessToken;
  } catch (error) {
    // Use logger if available
    if (typeof logger !== 'undefined') {
      logger.error('❌ Token refresh error:', error.message);
    } else {
      console.error('❌ Token refresh error:', error.message);
    }
    
    // Only auto-sign out if explicitly requested AND it's an invalid token
    if (autoSignOut && error.message === 'INVALID_REFRESH_TOKEN') {
      if (typeof logger !== 'undefined') {
        logger.warn('🚪 Invalid refresh token, signing out');
      } else {
        console.log('🚪 Invalid refresh token, signing out');
      }
      await signOut();
      
      // Show user-friendly message if ErrorHandler available
      if (typeof ErrorHandler !== 'undefined') {
        ErrorHandler.showError({
          title: 'Session Expired',
          message: 'Your session has expired. Please sign in again.',
          action: 'Sign In'
        });
      }
      
      throw new Error('Session expired, please log in again');
    }
    
    // For other errors, fail silently to avoid disrupting user
    // This allows sync to fail gracefully without logging the user out
    throw error;
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
    
    // Ensure tier field exists for popup compatibility
    if (data.user && !data.user.tier && data.user.subscriptionTier) {
      data.user.tier = data.user.subscriptionTier;
    }
    
    // Update stored user info
    await chrome.storage.local.set({ user: data.user });
    
    console.log('✅ User profile refreshed, tier:', data.user.tier);
    return data.user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Sync user tier from backend (checks for subscription changes)
 * Call this when popup opens or periodically
 * @returns {Promise<{tier: string, changed: boolean}>}
 */
async function syncUserTier() {
  try {
    const { user: cachedUser } = await chrome.storage.local.get(['user']);
    
    if (!cachedUser) {
      console.log('⚠️ Not authenticated, skipping tier sync');
      return { tier: 'free', changed: false };
    }
    
    console.log('🔄 Syncing user tier from backend...');
    
    // Use getCurrentUser which already updates storage
    const freshUser = await getCurrentUser();
    
    if (!freshUser) {
      console.warn('Failed to sync tier, using cached value');
      return { tier: cachedUser.tier || 'free', changed: false };
    }
    
    // Normalize tier field
    const backendTier = freshUser.tier || freshUser.subscriptionTier || 'free';
    const cachedTier = cachedUser.tier || 'free';
    
    // Check if tier changed
    const changed = backendTier !== cachedTier;
    
    if (changed) {
      console.log(`🎉 Tier updated: ${cachedTier} → ${backendTier}`);
      
      // Also update sync storage for cross-device sync
      await chrome.storage.sync.set({ userTier: backendTier });
      
      // Return true so UI can reload/update
      return { tier: backendTier, changed: true };
    } else {
      console.log(`✅ Tier unchanged: ${backendTier}`);
    }
    
    return { tier: backendTier, changed: false };
  } catch (error) {
    console.error('❌ Tier sync error:', error);
    // Return cached value on error
    const { user } = await chrome.storage.local.get(['user']);
    return { tier: user?.tier || 'free', changed: false };
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
    syncUserTier, // NEW: Sync tier from backend
    continueAsGuest,
    isGuestMode,
    shouldShowLoginPrompt,
    checkAuth: isAuthenticated, // Alias for compatibility
  };
}


