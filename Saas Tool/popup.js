// Popup script
/**
 * Get full name from firstName and lastName.
 * @param {string | null | undefined} firstName
 * @param {string | null | undefined} lastName
 * @returns {string}
 */
function getFullName(firstName, lastName) {
  const parts = [firstName, lastName].filter(p => p && p.trim().length > 0);
  return parts.join(' ');
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('💥 Global error:', event.error);
  if (event.error?.message) {
    showToast(`Error: ${event.error.message}`, true);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('💥 Unhandled promise rejection:', event.reason);
  const message = event.reason?.message || event.reason || 'Something went wrong';
  showToast(`Error: ${message}`, true);
});

// Network status monitoring
window.addEventListener('online', () => {
  console.log('🌐 Back online');
  showToast('✅ Back online! Syncing...', false);
  if (typeof CRMSyncManager !== 'undefined') {
    CRMSyncManager.performFullSync().catch(err => {
      console.error('Sync after reconnect failed:', err);
    });
  }
});

window.addEventListener('offline', () => {
  console.log('📡 Offline');
  showToast('⚠️ You are offline. Changes will sync when reconnected.', false);
});

// Session timeout configuration
const SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

/**
 * Check if session has expired and update last activity
 */
async function checkSession() {
  try {
    const { lastActivity, isAuthenticated } = await chrome.storage.local.get([
      'lastActivity',
      'isAuthenticated'
    ]);
    
    if (!isAuthenticated) {
      return; // Not logged in, no need to check
    }
    
    const now = Date.now();
    
    // Check if session expired
    if (lastActivity && (now - lastActivity > SESSION_TIMEOUT)) {
      console.log('⏰ Session expired (30 days of inactivity), logging out...');
      
      // Sign out
      if (typeof signOut === 'function') {
        await signOut();
      } else {
        await chrome.storage.local.remove([
          'accessToken',
          'refreshToken',
          'user',
          'isAuthenticated',
          'authToken'
        ]);
      }
      
      showToast('Your session expired after 30 days of inactivity. Please sign in again.');
      
      // Reload popup to show login state
      setTimeout(() => {
        location.reload();
      }, 2000);
      
      return false;
    }
    
    // Update last activity timestamp
    await chrome.storage.local.set({ lastActivity: now });
    
    return true;
  } catch (error) {
    console.error('Session check error:', error);
    return true; // Don't block on error
  }
}

// Global error handler for production error tracking
window.addEventListener('error', (e) => {
  console.error('Extension error:', e.message, e.filename, e.lineno);
});

// Failsafe: If initialization takes too long, ensure basic functionality
setTimeout(() => {
  const tbody = document.getElementById('allContactsTableBody');
  if (tbody && tbody.textContent.includes('Loading')) {
    console.warn('⚠️ Initialization timeout - forcing empty state');
    allContactsData = [];
    applyFiltersAndRender();
  }
  
  // Ensure tabs are clickable
  if (typeof setupTabs === 'function') {
    try {
      setupTabs();
    } catch (e) {
      console.error('Tabs setup failed in fallback:', e);
    }
  }
}, 3000); // 3 second failsafe

// Update button immediately when script loads (before DOM ready)
(async () => {
  // Quick check and update button ASAP
  const { isAuthenticated, isGuest } = await chrome.storage.local.get(['isAuthenticated', 'isGuest']);
  console.log('🚀 Script loaded - Quick auth check:', { isAuthenticated, isGuest });
  
  // Check session timeout
  if (isAuthenticated) {
    await checkSession();
  }
})();

document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 DOM Content Loaded - Full initialization starting...');
  
  // CRITICAL: Set up core UI immediately (non-blocking)
  console.log('🚀 Setting up core UI immediately...');
  setupTabs();
  setupEventListeners();
  setupAuthListener();
  console.log('✅ Core UI ready - buttons are now clickable!');
  
  // Then do async initialization in background
  (async () => {
    try {
      // Check session timeout first
      console.log('1️⃣ Checking session...');
      const sessionValid = await checkSession().catch(err => {
        console.warn('⚠️ Session check failed:', err);
        return true; // Continue anyway
      });
      console.log('✓ Session check complete:', sessionValid);
      
      if (!sessionValid) {
        return; // Session expired, will reload
      }
      
      // Check authentication status (with timeout)
      console.log('2️⃣ Checking auth status...');
      Promise.race([
        checkAuthStatus(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 500))
      ]).then(() => {
        console.log('✓ Auth check complete');
      }).catch(err => {
        console.error('⚠️ Auth check failed or timed out:', err.message);
      });
      
      // Update left header button based on auth status (force fresh check)
      console.log('3️⃣ Updating left header button...');
      await updateLeftHeaderButton().catch(err => {
        console.error('⚠️ Button update failed:', err);
      });
      console.log('✓ Button updated');
      
      console.log('4️⃣ Loading settings...');
      await loadSettings().catch(err => {
        console.error('⚠️ Settings load failed:', err);
        // Continue with defaults
      });
      console.log('✓ Settings loaded');
      
      // Load contacts with better error handling
      console.log('5️⃣ Loading contacts...');
      try {
        await Promise.race([
          loadAllContacts(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Contact load timeout')), 3000))
        ]);
        console.log('✓ Contacts loaded');
      } catch (err) {
        console.error('⚠️ Initial contact load failed:', err);
        // Empty state will be shown
      }
      
      // Check if user just logged in and has local data
      console.log('6️⃣ Checking for data merge...');
      await checkForDataMerge().catch(err => {
        console.error('⚠️ Data merge check failed:', err);
        // Not critical, continue
      });
      console.log('✓ Data merge check complete');
      
      // Load and display subscription status
      console.log('7️⃣ Loading subscription status...');
      await displaySubscriptionStatus().catch(err => {
        console.error('⚠️ Subscription status load failed:', err);
        // Not critical, continue
      });
      console.log('✓ Subscription status loaded');
      
      // Set up periodic session checks (every 5 minutes)
      setInterval(() => {
        checkSession().catch(err => console.warn('Periodic session check failed:', err));
      }, 5 * 60 * 1000);
      
      console.log('✅ Popup fully initialized - All ' + document.querySelectorAll('button').length + ' buttons ready');
      
      // Debug: Test button clickability
      const testBtn = document.querySelector('.tab-btn');
      if (testBtn) {
        console.log('🧪 Button test:', {
          exists: !!testBtn,
          disabled: testBtn.disabled,
          pointerEvents: window.getComputedStyle(testBtn).pointerEvents,
          zIndex: window.getComputedStyle(testBtn).zIndex
        });
      }
    } catch (error) {
      console.error('❌ Initialization error:', error);
      console.error('Error stack:', error.stack);
    }
  })();
});

/**
 * Setup listener for auth status changes
 */
function setupAuthListener() {
  // Listen for direct messages from login page
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Popup received message:', message);
    
    if (message.action === 'authStatusChanged') {
      console.log('🔐 Auth status changed via message! Updating UI...');
      
      // Force immediate update
      setTimeout(async () => {
        await updateLeftHeaderButton();
        await updateAccountSettingsDisplay();
        await checkAuthStatus();
        await loadAllContacts();
      }, 100);
      
      sendResponse({ received: true });
    }
    
    return true; // Keep message channel open
  });
  
  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      // Check if auth-related keys changed
      if (changes.isAuthenticated || changes.isGuest || changes.user) {
        console.log('Auth status changed via storage, updating UI...', changes);
        
        // Update left header button
        updateLeftHeaderButton();
        
        // Update account settings
        updateAccountSettingsDisplay();
        
        // Re-check auth status
        checkAuthStatus();
        
        // Reload contacts if needed
        if (changes.isAuthenticated?.newValue === true) {
          loadAllContacts();
        }
      }
      
      // Check if contacts data changed (from sync or background updates)
      if (changes.contacts) {
        console.log('📋 Contacts data changed in storage, refreshing active tab...');
        
        // Get the currently active tab
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
          const targetTab = activeTab.getAttribute('data-tab');
          console.log(`📊 Reloading ${targetTab} tab due to contacts change`);
          
          // Reload the appropriate tab
          if (targetTab === 'all-contacts') {
            loadAllContacts();
          } else if (targetTab === 'overview') {
            loadStatsAndPreview();
          } else if (targetTab === 'daily-review') {
            loadDailyReview();
          }
        }
      }
    }
  });
  
  // Also update when popup becomes visible or gains focus
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      console.log('Popup became visible, refreshing auth status and data...');
      await updateLeftHeaderButton();
      await updateAccountSettingsDisplay();
      
      // Refresh data for the active tab
      const activeTab = document.querySelector('.tab-btn.active');
      if (activeTab) {
        const targetTab = activeTab.getAttribute('data-tab');
        console.log(`📊 Refreshing data for active tab on visibility change: ${targetTab}`);
        if (targetTab === 'all-contacts') {
          await loadAllContacts();
        } else if (targetTab === 'daily-review') {
          await loadDailyReview();
        } else if (targetTab === 'overview') {
          await loadStatsAndPreview();
        }
      }
    }
  });
  
  window.addEventListener('focus', async () => {
    console.log('Popup gained focus, refreshing auth status and data...');
    await updateLeftHeaderButton();
    await updateAccountSettingsDisplay();
    
    // Refresh data for the active tab
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
      const targetTab = activeTab.getAttribute('data-tab');
      console.log(`📊 Refreshing data for active tab on focus: ${targetTab}`);
      if (targetTab === 'all-contacts') {
        await loadAllContacts();
      } else if (targetTab === 'daily-review') {
        await loadDailyReview();
      } else if (targetTab === 'overview') {
        await loadStatsAndPreview();
      }
    }
  });
}

/**
 * Check authentication status and show appropriate UI
 */
async function checkAuthStatus() {
  try {
    const { isAuthenticated, user, isGuest, hasSeenWelcome } = await chrome.storage.local.get([
      'isAuthenticated',
      'user',
      'isGuest',
      'hasSeenWelcome'
    ]);
    
    if (!isAuthenticated && !isGuest && !hasSeenWelcome) {
      // First time user - show welcome prompt (non-blocking)
      showFirstTimeUserPrompt();
      return;
    }
    
    if (isGuest) {
      // Guest mode - check if should show banner
      try {
        if (typeof window.GuestModeBanner !== 'undefined' && window.GuestModeBanner.shouldShow) {
          const shouldShow = await Promise.race([
            window.GuestModeBanner.shouldShow(),
            new Promise((resolve) => setTimeout(() => resolve(false), 1000)) // 1s timeout
          ]);
          if (shouldShow) {
            const container = document.querySelector('.popup-container') || document.body;
            window.GuestModeBanner.show(container);
          }
        }
      } catch (err) {
        console.warn('GuestModeBanner error:', err);
      }
      // Hide account settings for guest users
      hideAccountSettings();
    } else if (isAuthenticated && user) {
      // Logged in - show auth banner and account settings
      showAuthBanner(user);
      showAccountSettings(user);
    } else {
      // Not logged in - hide account settings
      hideAccountSettings();
    }
  } catch (error) {
    console.error('Auth status check error:', error);
  }
}

/**
 * Show first time user prompt (non-blocking, dismissible)
 */
function showFirstTimeUserPrompt() {
  // Create banner instead of overlay to avoid blocking
  const banner = document.createElement('div');
  banner.id = 'welcomeBanner';
  banner.style.cssText = `
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 16px;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    position: relative;
  `;
  
  banner.innerHTML = `
    <button id="closeWelcome" style="
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
    ">×</button>
    <div style="font-size: 36px; margin-bottom: 8px;">👋</div>
    <h3 style="font-size: 18px; margin-bottom: 8px; font-weight: 600;">Welcome to CRMSYNC!</h3>
    <p style="font-size: 13px; margin-bottom: 16px; opacity: 0.95; line-height: 1.4;">
      Track and manage your email contacts effortlessly. Sign in to sync across devices or continue offline.
    </p>
    <div style="display: flex; gap: 8px;">
      <button id="bannerSignIn" style="
        background: white;
        color: #6366f1;
        border: none;
        padding: 10px 16px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        flex: 1;
      ">Sign In / Sign Up</button>
      <button id="bannerGuest" style="
        background: rgba(255,255,255,0.2);
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        flex: 1;
      ">Continue Offline</button>
    </div>
  `;
  
  const container = document.querySelector('.popup-container') || document.body;
  container.prepend(banner);
  
  // Event listeners
  const closeBtn = document.getElementById('closeWelcome');
  if (closeBtn) {
    closeBtn.addEventListener('click', async () => {
      await chrome.storage.local.set({ hasSeenWelcome: true });
      banner.remove();
    });
  }
  
  const signInBtn = document.getElementById('bannerSignIn');
  if (signInBtn) {
    signInBtn.addEventListener('click', async () => {
      try {
        // Redirect to website for login
        const extensionId = chrome.runtime.id;
        const websiteUrl = (window.CONFIG?.WEBSITE_URL || 'https://www.crm-sync.net').replace(/\/$/, '');
        const loginPath = (window.CONFIG?.AUTH?.LOGIN || '/#/login').replace(/^\//, '');

        // For hash routing, put params BEFORE the hash
        const loginUrl = `${websiteUrl}?source=extension&extensionId=${extensionId}&from=popup#/${loginPath.replace('#/', '')}`;
        const tab = await chrome.tabs.create({ url: loginUrl });
        banner.remove();
      } catch (error) {
        console.error('Error opening login page:', error);
        alert('Error: ' + error.message);
      }
    });
  }
  
  const guestBtn = document.getElementById('bannerGuest');
  if (guestBtn) {
    guestBtn.addEventListener('click', async () => {
      try {
        await chrome.storage.local.set({
          isGuest: true,
          hasSeenWelcome: true,
          guestModeChosenAt: new Date().toISOString()
        });
        banner.remove();
        location.reload();
      } catch (error) {
        console.error('Error activating guest mode:', error);
      }
    });
  }
}

/**
 * Show auth banner for logged in users
 */
function showAuthBanner(user) {
  const banner = document.createElement('div');
  banner.id = 'authBanner';
  banner.style.cssText = `
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
  `;
  
  banner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px;">
        ${user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
      </div>
      <div>
        <div style="font-weight: 600; color: var(--text);">${user.displayName || user.email}</div>
        <div style="color: var(--text-secondary); font-size: 11px;" id="syncStatus">Synced</div>
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button id="syncNowBtn" class="btn-small" style="font-size: 11px; padding: 6px 12px;">
        🔄 Sync
      </button>
      <button id="signOutBtn" class="btn-small" style="font-size: 11px; padding: 6px 12px;">
        Sign Out
      </button>
    </div>
  `;
  
  const container = document.querySelector('.popup-container') || document.body;
  container.prepend(banner);
  
  // Event listeners
  document.getElementById('syncNowBtn').addEventListener('click', async () => {
    const btn = document.getElementById('syncNowBtn');
    if (!btn || btn.classList.contains('btn-loading')) return;
    
    if (typeof CRMSyncManager !== 'undefined') {
      try {
        btn.classList.add('btn-loading');
        document.getElementById('syncStatus').textContent = 'Syncing...';
        await CRMSyncManager.manualSync();
        showToast('✅ Sync completed successfully');
        updateSyncStatus();
      } catch (error) {
        console.error('Sync error:', error);
        showToast('❌ Sync failed: ' + (error.message || 'Unknown error'), true);
      } finally {
        btn.classList.remove('btn-loading');
      }
    }
  });
  
  document.getElementById('signOutBtn').addEventListener('click', async () => {
    if (confirm('Sign out? Your local data will remain on this device.')) {
      if (typeof CRMSyncAuth !== 'undefined') {
        await CRMSyncAuth.signOut();
      }
      location.reload();
    }
  });
  
  // Update sync status periodically
  setInterval(updateSyncStatus, 30000);
  updateSyncStatus();
}

/**
 * Update sync status display
 */
async function updateSyncStatus() {
  const statusEl = document.getElementById('syncStatus');
  if (!statusEl) return;
  
  try {
    const { lastSyncAt } = await chrome.storage.local.get(['lastSyncAt']);
    
    if (!lastSyncAt) {
      statusEl.textContent = 'Not synced';
      return;
    }
    
    const lastSync = new Date(lastSyncAt);
    const now = new Date();
    const diffMs = now - lastSync;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      statusEl.textContent = 'Synced just now';
    } else if (diffMins < 60) {
      statusEl.textContent = `Synced ${diffMins}m ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      statusEl.textContent = `Synced ${diffHours}h ago`;
    }
  } catch (error) {
    console.error('Sync status update error:', error);
  }
}

/**
 * Update left header button based on auth status
 */
async function updateLeftHeaderButton() {
  try {
    const { isAuthenticated, isGuest, user } = await chrome.storage.local.get(['isAuthenticated', 'isGuest', 'user']);
    
    const btn = document.getElementById('leftHeaderBtn');
    const icon = document.getElementById('leftHeaderBtnIcon');
    const text = document.getElementById('leftHeaderBtnText');
    
    if (!btn) {
      console.warn('Left header button not found');
      return;
    }
    
    console.log('🔄 Updating left header button - Auth:', isAuthenticated, 'Guest:', isGuest, 'HasUser:', !!user);
    
    // Priority: isAuthenticated takes precedence over isGuest
    if (isAuthenticated === true && user) {
      // Logged in - show All Contacts button
      console.log('✅ Showing All Contacts button (authenticated)');
      btn.classList.remove('sign-in-mode');
      icon.style.display = 'inline';
      icon.textContent = '👥';
      icon.style.fontSize = '20px';
      text.style.display = 'none';
      btn.title = 'All Contacts';
      
      // Remove old onclick and add new one
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      document.getElementById('leftHeaderBtn').addEventListener('click', () => {
        console.log('All Contacts button clicked');
        document.querySelector('[data-tab="all-contacts"]')?.click();
      });
    } else {
      // Not authenticated (guest mode or not logged in) - show Sign In button
      console.log('🔐 Showing Sign In button (not authenticated)');
      btn.classList.add('sign-in-mode');
      icon.style.display = 'inline';
      icon.textContent = '🔐';
      icon.style.fontSize = '16px';
      text.style.display = 'inline';
      text.textContent = 'Sign In';
      btn.title = 'Sign In to sync your data';
      
      // Remove old onclick and add new one
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Add event listener to the NEW button
      newBtn.addEventListener('click', () => {
        console.log('Sign In button clicked');
        const extensionId = chrome.runtime.id;
        const websiteUrl = (window.CONFIG?.WEBSITE_URL || 'https://www.crm-sync.net').replace(/\/$/, '');
        const loginPath = (window.CONFIG?.AUTH?.LOGIN || '/#/login').replace(/^\//, '');

        // For hash routing, put params BEFORE the hash
        const loginUrl = `${websiteUrl}?source=extension&extensionId=${extensionId}&from=popup#/${loginPath.replace('#/', '')}`;
        console.log('Opening login URL:', loginUrl);

        chrome.tabs.create({ url: loginUrl }).catch(err => {
          console.error('Failed to open tab:', err);
          alert('Failed to open login page. Please check the extension permissions.');
        });
      });
    }
  } catch (error) {
    console.error('Error updating left header button:', error);
  }
}

/**
 * Check if user just logged in and has local guest data
 */
async function checkForDataMerge() {
  try {
    const { isAuthenticated, justLoggedIn, dataMergeHandled } = await chrome.storage.local.get([
      'isAuthenticated',
      'justLoggedIn',
      'dataMergeHandled'
    ]);
    
    // Only show dialog if user just logged in and hasn't handled merge yet
    if (!isAuthenticated || !justLoggedIn || dataMergeHandled) {
      return;
    }
    
    // Check if there's local data
    const { contacts } = await chrome.storage.local.get(['contacts']);
    const localContacts = Array.isArray(contacts) ? contacts : [];
    
    if (localContacts.length > 0) {
      // Show data merge dialog
      showDataMergeDialog(localContacts.length);
    } else {
      // No local data, just mark as handled
      await chrome.storage.local.set({ dataMergeHandled: true, justLoggedIn: false });
    }
  } catch (error) {
    console.error('Error checking for data merge:', error);
  }
}

/**
 * Show data merge dialog
 */
function showDataMergeDialog(localContactCount) {
  const dialog = document.getElementById('dataMergeDialog');
  const countEl = document.getElementById('localContactCount');
  
  if (!dialog || !countEl) return;
  
  countEl.textContent = localContactCount;
  dialog.style.display = 'flex';
  
  // Setup button handlers
  document.getElementById('keepLocalDataBtn')?.addEventListener('click', async () => {
    await handleDataMerge('keep');
    dialog.style.display = 'none';
  });
  
  document.getElementById('useSyncedDataBtn')?.addEventListener('click', async () => {
    await handleDataMerge('replace');
    dialog.style.display = 'none';
  });
  
  document.getElementById('cancelMergeBtn')?.addEventListener('click', async () => {
    // Mark as handled but don't change data
    await chrome.storage.local.set({ justLoggedIn: false });
    dialog.style.display = 'none';
  });
}

/**
 * Handle data merge decision
 */
async function handleDataMerge(action) {
  try {
    console.log(`User chose to ${action} local data`);
    
    if (action === 'keep') {
      // Keep local data and sync it to cloud
      console.log('Merging local data with cloud...');
      
      // Get local contacts
      const { contacts } = await chrome.storage.local.get(['contacts']);
      const localContacts = Array.isArray(contacts) ? contacts : [];
      
      // Upload local contacts to backend
      if (typeof CRMSyncManager !== 'undefined' && localContacts.length > 0) {
        await CRMSyncManager.uploadLocalData(localContacts);
        console.log(`✅ ${localContacts.length} local contacts uploaded to cloud`);
      }
      
      // Then perform a full sync to merge
      if (typeof CRMSyncManager !== 'undefined') {
        await CRMSyncManager.performFullSync();
      }
      
      showToast(`✅ ${localContacts.length} local contacts merged with cloud data`);
    } else if (action === 'replace') {
      // Replace local data with cloud data
      console.log('Replacing local data with cloud data...');
      
      // Clear local contacts
      await chrome.storage.local.set({ contacts: [] });
      
      // Perform full sync to get cloud data
      if (typeof CRMSyncManager !== 'undefined') {
        await CRMSyncManager.performFullSync();
      }
      
      showToast('✅ Local data replaced with cloud data');
      
      // Reload contacts display
      await loadAllContacts();
    }
    
    // Mark merge as handled
    await chrome.storage.local.set({ 
      dataMergeHandled: true,
      justLoggedIn: false
    });
    
  } catch (error) {
    console.error('Error handling data merge:', error);
    showToast('Error merging data. Please try again.', true);
  }
}

/**
 * Update account settings display based on auth status
 */
async function updateAccountSettingsDisplay() {
  try {
    const { isAuthenticated, user, isGuest } = await chrome.storage.local.get([
      'isAuthenticated',
      'user',
      'isGuest'
    ]);
    
    console.log('Account settings - Auth status:', { isAuthenticated, isGuest, user });
    
    if (isAuthenticated && user && !isGuest) {
      showAccountSettings(user);
    } else {
      hideAccountSettings();
    }
  } catch (error) {
    console.error('Error updating account settings:', error);
    hideAccountSettings();
  }
}

/**
 * Show account settings in Settings tab
 */
function showAccountSettings(user) {
  const container = document.getElementById('accountSettingsContainer');
  if (!container) {
    console.error('Account settings container not found');
    return;
  }
  
  console.log('Showing account settings for user:', user);
  container.style.display = 'block';
  
  // Get user initials for avatar
  const initials = user.displayName 
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : (user.name 
      ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
      : user.email.charAt(0).toUpperCase());
  
  // Update avatar
  const avatar = document.getElementById('accountAvatar');
  if (avatar) {
    avatar.textContent = initials;
  }
  
  // Update name
  const nameEl = document.getElementById('accountName');
  if (nameEl) {
    nameEl.textContent = user.displayName || user.name || user.email.split('@')[0] || 'User';
  }
  
  // Update email
  const emailEl = document.getElementById('accountEmail');
  if (emailEl) {
    emailEl.textContent = user.email;
  }
  
  // Update tier badge (in settings tab)
  const tierEl = document.getElementById('accountTier');
  if (tierEl && user.tier) {
    const tierUpper = user.tier.toUpperCase();
    tierEl.textContent = tierUpper;
    
    // Set tier badge color
    if (user.tier === 'free') {
      tierEl.style.background = '#10b981'; // green
    } else if (user.tier === 'pro') {
      tierEl.style.background = '#667eea'; // purple
    } else if (user.tier === 'enterprise') {
      tierEl.style.background = '#f59e0b'; // gold
    }
  }
  
  // Update header tier badge
  const headerBadge = document.getElementById('subscriptionTierBadge');
  if (headerBadge && user.tier) {
    const tierUpper = user.tier.toUpperCase();
    headerBadge.textContent = tierUpper;
    
    // Remove all tier classes
    headerBadge.classList.remove('tier-free', 'tier-pro', 'tier-business', 'tier-enterprise');
    
    // Add appropriate tier class
    headerBadge.classList.add(`tier-${user.tier.toLowerCase()}`);
  }
  
  // Show/hide upgrade button based on tier
  const upgradeBtn = document.getElementById('upgradeBtn');
  if (upgradeBtn) {
    if (user.tier === 'free') {
      upgradeBtn.style.display = 'block';
      setupUpgradeButton();
    } else {
      upgradeBtn.style.display = 'none';
    }
  }
  
  // Setup sign out button (only once)
  setupSignOutButton();
}

/**
 * Update limit warning banner visibility and text
 */
function updateLimitWarningBanner(count, limit, tier, isOverLimit, isNearLimit) {
  const banner = document.getElementById('limitWarningBanner');
  const warningText = document.getElementById('limitWarningText');
  const upgradeBtn = document.getElementById('upgradeLimitBtn');
  
  if (!banner || !warningText || !upgradeBtn) return;
  
  // Only show for free tier users at or near limit
  if (tier === 'free' && (isOverLimit || isNearLimit)) {
    banner.style.display = 'block';
    
    if (isOverLimit) {
      warningText.textContent = `You're over your limit! (${count}/${limit}) Delete contacts or upgrade.`;
      banner.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else if (isNearLimit) {
      warningText.textContent = `Almost at your limit! (${count}/${limit}) Upgrade for 1,000 contacts.`;
      banner.style.background = 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)';
    }
    
    // Set up upgrade button click
    const newUpgradeBtn = upgradeBtn.cloneNode(true);
    upgradeBtn.parentNode.replaceChild(newUpgradeBtn, upgradeBtn);
    
    newUpgradeBtn.addEventListener('click', () => {
      const websiteUrl = window.CONFIG?.WEBSITE_URL || 'https://www.crm-sync.net';
      const pricingPath = window.CONFIG?.AUTH?.PRICING || '/#/pricing';
      const pricingUrl = `${websiteUrl}?source=extension${pricingPath}`;
      chrome.tabs.create({ url: pricingUrl });
    });
  } else {
    banner.style.display = 'none';
  }
}

/**
 * Setup upgrade button event listener
 */
function setupUpgradeButton() {
  const upgradeBtn = document.getElementById('upgradeBtn');
  if (!upgradeBtn) return;
  
  // Remove existing listener by cloning
  const newUpgradeBtn = upgradeBtn.cloneNode(true);
  upgradeBtn.parentNode.replaceChild(newUpgradeBtn, upgradeBtn);
  
  newUpgradeBtn.addEventListener('click', () => {
    // Open website pricing page
    const websiteUrl = window.CONFIG?.WEBSITE_URL || 'https://www.crm-sync.net';
    const pricingPath = window.CONFIG?.AUTH?.PRICING || '/#/pricing';
    
    // For hash routing, put params BEFORE the hash
    const pricingUrl = `${websiteUrl}?source=extension${pricingPath}`;
    chrome.tabs.create({ url: pricingUrl });
  });
}

/**
 * Setup sign out button event listener
 */
function setupSignOutButton() {
  const signOutBtn = document.getElementById('settingsSignOutBtn');
  if (!signOutBtn) return;
  
  // Remove existing listener by cloning
  const newSignOutBtn = signOutBtn.cloneNode(true);
  signOutBtn.parentNode.replaceChild(newSignOutBtn, signOutBtn);
  
  newSignOutBtn.addEventListener('click', async () => {
    if (confirm('Sign out? Your local data will remain on this device.')) {
      try {
        console.log('Signing out...');
        // Use auth.js signOut if available
        if (typeof signOut === 'function') {
          await signOut();
        } else {
          // Fallback: clear auth data manually
          await chrome.storage.local.remove(['accessToken', 'refreshToken', 'user', 'isAuthenticated']);
        }
        location.reload();
      } catch (error) {
        console.error('Sign out error:', error);
        alert('Error signing out. Please try again.');
      }
    }
  });
}

/**
 * Hide account settings in Settings tab
 */
function hideAccountSettings() {
  const container = document.getElementById('accountSettingsContainer');
  if (container) {
    container.style.display = 'none';
  }
}

function setupTabs() {
  console.log('📑 Setting up tabs...');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  console.log(`Found ${tabButtons.length} tab buttons and ${tabContents.length} tab contents`);

  tabButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      // Update buttons
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${targetTab}-tab`) {
          content.classList.add('active');
        }
      });

      // Always reload data for active tab when switching
      console.log(`📊 Refreshing data for tab: ${targetTab}`);
      if (targetTab === 'all-contacts') {
        loadAllContacts();
      } else if (targetTab === 'daily-review') {
        loadDailyReview();
      } else if (targetTab === 'overview') {
        loadStatsAndPreview();
      }
    });
  });
}

async function loadSettings() {
  const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
  const settings = response.settings || {};

  document.getElementById('darkMode').checked = settings.darkMode || false;
  document.getElementById('autoApprove').checked = settings.autoApprove || false;
  document.getElementById('sidebarEnabled').checked = settings.sidebarEnabled !== false;
  document.getElementById('soundEffects').checked = settings.soundEffects || false;
  const hotkeysInput = document.getElementById('hotkeysEnabled');
  if (hotkeysInput) {
    hotkeysInput.checked = settings.hotkeysEnabled || false;
  }
  const reminderDaysInput = document.getElementById('reminderDays');
  if (reminderDaysInput) {
    reminderDaysInput.value = settings.reminderDays || 3;
  }
  
  // Follow-up queue days
  const noReplyDays = Array.isArray(settings.noReplyAfterDays) ? settings.noReplyAfterDays.join(',') : '3,7,14';
  const noReplyInput = document.getElementById('noReplyAfterDays');
  if (noReplyInput) {
    noReplyInput.value = noReplyDays;
  }
  
  // Gmail labels
  const trackedLabels = settings.trackedLabels || [];
  const labelsInput = document.getElementById('gmailLabelsInput');
  if (labelsInput) {
    labelsInput.value = Array.isArray(trackedLabels) ? trackedLabels.join(', ') : '';
  }
  
  // Exclusions - render as tags
  const excludeDomains = settings.excludeDomains || [];
  renderTags('excludeDomains', excludeDomains);
  
  const excludeNames = settings.excludeNames || [];
  renderTags('excludeNames', excludeNames);
  
  const excludePhones = settings.excludePhones || [];
  renderTags('excludePhones', excludePhones);
  
  // Apply theme
  document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
  
  // Update account settings display
  await updateAccountSettingsDisplay();
}

// Tag Management Functions
function renderTags(type, items) {
  const tagsContainer = document.getElementById(`${type}Tags`);
  if (!tagsContainer) return;
  
  tagsContainer.innerHTML = '';
  items.forEach(item => {
    const tag = document.createElement('span');
    tag.className = 'exclusion-tag';
    tag.innerHTML = `
      <span>${item}</span>
      <span class="tag-remove" data-type="${type}" data-value="${item}">×</span>
    `;
    tagsContainer.appendChild(tag);
  });
}

async function addTag(type, value) {
  if (!value || !value.trim()) return;
  
  const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
  const settings = response.settings || {};
  const settingKey = type; // excludeDomains, excludeNames, excludePhones
  const currentItems = settings[settingKey] || [];
  
  // Don't add duplicates
  if (currentItems.includes(value.trim())) {
    showToast('Already in exclusion list', true);
    return;
  }
  
  currentItems.push(value.trim());
  settings[settingKey] = currentItems;
  
  await chrome.runtime.sendMessage({ action: 'updateSettings', settings });
  renderTags(type, currentItems);
  showToast('Exclusion added');
}

async function removeTag(type, value) {
  const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
  const settings = response.settings || {};
  const settingKey = type;
  const currentItems = settings[settingKey] || [];
  
  settings[settingKey] = currentItems.filter(item => item !== value);
  
  await chrome.runtime.sendMessage({ action: 'updateSettings', settings });
  renderTags(type, settings[settingKey]);
  showToast('Exclusion removed');
}

let columnVisibility = {
  name: true,
  email: true,
  company: true,
  title: true,
  phone: true,
  threadStatus: true,
  activity: true,
  tags: true
};

// Cache for overview tab lists
let lastPendingContacts = [];

// Keyboard shortcuts state
let keyboardState = {
  selectedIndex: -1,
  selectedForExport: new Set(),
  currentContacts: [],
  isDailyReviewActive: false
};

async function loadDailyReview() {
  try {
    // Reset keyboard state
    keyboardState.selectedIndex = -1;
    keyboardState.selectedForExport.clear();
    
    const response = await chrome.runtime.sendMessage({ type: 'GET_DAILY_REVIEW' });
    const reviewData = (response && response.reviewData) || {
      contacts: [],
      duplicates: [],
      followUpQueue: [],
      winsAndObjections: { positive: [], objections: [], meetings: [], notInterested: [] },
      stats: { newToday: 0, awaitingReplies: 0, followUpsDue: 0, totalToday: 0, positiveReplies: 0, objections: 0, meetingsBooked: 0 }
    };

    document.getElementById('reviewNewToday').textContent = reviewData.stats.newToday || 0;
    const totalTodayEl = document.getElementById('reviewTotalToday');
    if (totalTodayEl) {
      totalTodayEl.textContent = reviewData.stats.totalToday || 0;
    }

    renderFollowUpQueue(reviewData.followUpQueue || []);
    renderDuplicates(reviewData.duplicates || []);
    renderDailyReviewList(reviewData.contacts || []);
    
    // Reset export button (if function exists)
    if (typeof updateExportButton === 'function') {
      updateExportButton();
    }
  } catch (error) {
    console.error('Error loading daily review:', error);
  }
}

/**
 * Update export button state based on available data
 */
function updateExportButton() {
  const exportBtn = document.getElementById('exportAndMarkReviewed');
  if (!exportBtn) return;
  
  const hasData = allContactsData && allContactsData.length > 0;
  exportBtn.disabled = !hasData;
  
  if (!hasData) {
    exportBtn.title = 'No contacts to export';
  } else {
    exportBtn.title = `Export ${allContactsData.length} contacts to CSV`;
  }
}

function renderFollowUpQueue(queue) {
  const section = document.getElementById('followUpQueueSection');
  const container = document.getElementById('followUpQueueList');
  
  if (!section || !container) return;

  if (!queue || queue.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  container.innerHTML = queue.map(item => {
    const contact = item.contact;
    const lastMessage = item.lastOutboundMessage;
    const subject = lastMessage ? (lastMessage.subject || 'No subject') : 'No subject';
    const sentDate = lastMessage ? new Date(lastMessage.timestamp).toLocaleDateString() : '';

    return `
      <div class="contact-item follow-up-item" data-email="${contact.email}">
        <div class="contact-info">
          <strong>${getFullName(contact.firstName, contact.lastName) || contact.email}</strong>
          ${contact.company ? `<div class="contact-meta">${contact.company}</div>` : ''}
          <div class="contact-meta" style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
            Last sent: ${sentDate} • ${item.daysSinceLastContact} days ago
          </div>
          <div class="contact-meta" style="font-size: 11px; font-style: italic; margin-top: 2px;">
            "${subject}"
          </div>
        </div>
        <div class="contact-actions" style="display: flex; flex-direction: column; gap: 4px;">
          <button class="btn-small btn-send-nudge" data-email="${contact.email}" style="font-size: 11px; padding: 4px 8px;">📧 Send Nudge</button>
          <button class="btn-small btn-archive" data-email="${contact.email}" style="font-size: 11px; padding: 4px 8px;">📦 Archive</button>
          <button class="btn-small btn-mark-lost" data-email="${contact.email}" style="font-size: 11px; padding: 4px 8px;">❌ Mark Lost</button>
        </div>
      </div>
    `;
  }).join('');

  // Attach event handlers
  container.querySelectorAll('.btn-send-nudge').forEach(btn => {
    btn.addEventListener('click', () => handleSendNudge(btn.getAttribute('data-email')));
  });
  container.querySelectorAll('.btn-archive').forEach(btn => {
    btn.addEventListener('click', () => handleArchive(btn.getAttribute('data-email')));
  });
  container.querySelectorAll('.btn-mark-lost').forEach(btn => {
    btn.addEventListener('click', () => handleMarkLost(btn.getAttribute('data-email')));
  });
}

function renderWinsAndObjections(winsAndObjections) {
  const container = document.getElementById('winsObjectionsList');
  if (!container) return;

  const all = [
    ...(winsAndObjections.positive || []).map(c => ({ ...c, category: 'positive', label: '✅ Positive' })),
    ...(winsAndObjections.meetings || []).map(c => ({ ...c, category: 'meeting_booked', label: '📅 Meeting Booked' })),
    ...(winsAndObjections.objections || []).map(c => ({ ...c, category: 'objection', label: '⚠️ Objection' })),
    ...(winsAndObjections.notInterested || []).map(c => ({ ...c, category: 'not_interested', label: '❌ Not Interested' }))
  ];

  if (all.length === 0) {
    container.innerHTML = '<div class="empty-state" style="font-size: 12px; padding: 20px;">No replies classified yet today.</div>';
    return;
  }

  container.innerHTML = all.slice(0, 10).map(contact => {
    return `
      <div class="contact-item" style="padding: 8px; border-bottom: 1px solid var(--border);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="font-size: 13px;">${getFullName(contact.firstName, contact.lastName) || contact.email}</strong>
            ${contact.company ? `<div class="contact-meta" style="font-size: 11px;">${contact.company}</div>` : ''}
          </div>
          <span class="reply-category-badge ${contact.category}" style="font-size: 10px; padding: 2px 6px; border-radius: 10px; font-weight: 600;">
            ${contact.label}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function renderDuplicates(duplicates) {
  const alertDiv = document.getElementById('duplicatesAlert');
  const listDiv = document.getElementById('duplicatesList');
  
  if (!alertDiv || !listDiv) return;

  if (!duplicates || duplicates.length === 0) {
    alertDiv.style.display = 'none';
    return;
  }

  alertDiv.style.display = 'block';
  listDiv.innerHTML = duplicates.map((dup, idx) => `
    <div class="duplicate-group">
      <div class="duplicate-reason">${dup.reason}</div>
      <div class="duplicate-contacts">
        ${dup.contacts.map(c => `${c.name || c.email} (${c.email})`).join(', ')}
      </div>
      <button class="btn-merge-duplicates" data-index="${idx}">Merge These Contacts</button>
    </div>
  `).join('');

  // Add merge handlers
  listDiv.querySelectorAll('.btn-merge-duplicates').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.getAttribute('data-index'));
      const dup = duplicates[idx];
      if (!dup || !dup.contacts || dup.contacts.length < 2) return;

      const emails = dup.contacts.map(c => c.email);
      btn.disabled = true;
      btn.textContent = 'Merging...';

      try {
        const response = await chrome.runtime.sendMessage({
          type: 'MERGE_CONTACTS',
          payload: { emails }
        });
        if (response && response.success) {
          showToast('Contacts merged successfully.');
          await loadDailyReview();
        } else {
          showToast('Failed to merge contacts.', true);
        }
      } catch (error) {
        console.error('Error merging contacts:', error);
        showToast('Error merging contacts.', true);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Merge These Contacts';
      }
    });
  });
}

function renderDailyReviewList(contacts) {
  const container = document.getElementById('dailyReviewList');
  if (!container) return;

  // Store contacts for keyboard navigation
  keyboardState.currentContacts = contacts;

  if (!contacts || contacts.length === 0) {
    container.innerHTML = '<div class="empty-state">No prospects touched today. Start emailing to build your pipeline!</div>';
    keyboardState.selectedIndex = -1;
    return;
  }

  // Group by company
  const grouped = groupByCompany(contacts);
  const companies = Object.keys(grouped).sort();

  // Flatten contacts for keyboard navigation (maintain order)
  const flatContacts = [];
  companies.forEach(company => {
    grouped[company].forEach(contact => flatContacts.push(contact));
  });
  keyboardState.currentContacts = flatContacts;

  container.innerHTML = companies.map(company => {
    const companyContacts = grouped[company];
    return `
      <div class="company-group">
        <div class="company-group-header">
          ${company || 'No Company'}
          <span style="opacity: 0.6; font-weight: normal; margin-left: 8px;">(${companyContacts.length})</span>
        </div>
        <div class="company-group-contacts">
          ${companyContacts.map((contact, idx) => {
            const globalIndex = flatContacts.indexOf(contact);
            return renderContactItem(contact, globalIndex);
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Update selection highlight (if function exists)
  if (typeof updateSelectionHighlight === 'function') {
    updateSelectionHighlight();
  }

  // Attach tag input handlers
  attachTagHandlers();
}

/**
 * Update visual indication of selected contacts
 */
function updateSelectionHighlight() {
  const checkboxes = document.querySelectorAll('.contact-checkbox:checked');
  const selectedCount = checkboxes.length;
  
  // Update any selection counter if it exists
  const selectionCounter = document.getElementById('selectionCounter');
  if (selectionCounter) {
    if (selectedCount > 0) {
      selectionCounter.textContent = `${selectedCount} selected`;
      selectionCounter.style.display = 'block';
    } else {
      selectionCounter.style.display = 'none';
    }
  }
  
  // Update row highlighting
  checkboxes.forEach(checkbox => {
    const row = checkbox.closest('tr');
    if (row) {
      row.classList.add('selected');
    }
  });
  
  // Remove highlighting from unchecked rows
  const uncheckedBoxes = document.querySelectorAll('.contact-checkbox:not(:checked)');
  uncheckedBoxes.forEach(checkbox => {
    const row = checkbox.closest('tr');
    if (row) {
      row.classList.remove('selected');
    }
  });
}

function groupByCompany(contacts) {
  const grouped = {};
  for (const contact of contacts) {
    const company = (contact.company || '').trim() || 'No Company';
    if (!grouped[company]) {
      grouped[company] = [];
    }
    grouped[company].push(contact);
  }
  return grouped;
}

function renderContactItem(contact, index = -1) {
  const outbound = contact.outboundCount || 0;
  const inbound = contact.inboundCount || 0;
  const nextStep = getNextStep(contact, outbound, inbound);
  const threadStatus = contact.threadStatus || null;
  const tags = Array.isArray(contact.tags) ? contact.tags : [];

  const threadStatusBadge = threadStatus ? 
    `<span class="thread-status-badge ${threadStatus}">${threadStatus.replace('_', ' ')}</span>` : '';

  const isSelected = index === keyboardState.selectedIndex;
  const isSelectedForExport = keyboardState.selectedForExport.has(contact.email);

  return `
    <div class="contact-item ${isSelected ? 'keyboard-selected' : ''} ${isSelectedForExport ? 'selected-for-export' : ''}" 
         data-email="${contact.email}" 
         data-index="${index}">
      <div class="contact-info">
        ${columnVisibility.name ? `<strong>${getFullName(contact.firstName, contact.lastName) || contact.email}</strong>` : ''}
        ${columnVisibility.email && getFullName(contact.firstName, contact.lastName) ? `<div class="contact-meta">${contact.email}</div>` : ''}
        ${columnVisibility.company && contact.company ? `<div class="contact-meta">${contact.company}</div>` : ''}
        ${columnVisibility.title && contact.title ? `<div class="contact-meta">${contact.title}</div>` : ''}
        ${columnVisibility.phone && contact.phone ? `<div class="contact-meta">📞 ${contact.phone}</div>` : ''}
        ${columnVisibility.threadStatus ? threadStatusBadge : ''}
        <div class="next-step-badge ${nextStep.class}">${nextStep.text}</div>
        ${columnVisibility.activity ? `
          <div class="contact-meta" style="margin-top: 4px;">
            ↗ ${outbound} sent · ↘ ${inbound} received
          </div>
        ` : ''}
        ${columnVisibility.tags ? `
          <div class="contact-tags" data-email="${contact.email}">
            ${tags.map(tag => `<span class="contact-tag">${tag}</span>`).join('')}
            <div class="tag-input-container" style="display: none;">
              <input type="text" class="tag-input" placeholder="Add tag (e.g., campaign, source)" data-email="${contact.email}">
            </div>
            <button class="btn-small btn-add-tag" style="font-size: 10px; padding: 2px 6px; margin-top: 2px;" data-email="${contact.email}">+ Tag</button>
          </div>
        ` : ''}
      </div>
      <div class="contact-status ${(contact.status || 'new').toLowerCase().replace(/\s+/g, '-')}">
        ${contact.status || 'New'}
      </div>
    </div>
  `;
}

function toggleTagInput(email) {
  const tagsContainer = document.querySelector(`.contact-tags[data-email="${email}"]`);
  if (!tagsContainer) return;

  const inputContainer = tagsContainer.querySelector('.tag-input-container');
  if (!inputContainer) return;

  if (inputContainer.style.display === 'none') {
    inputContainer.style.display = 'flex';
    const input = inputContainer.querySelector('.tag-input');
    if (input) {
      input.focus();
      input.addEventListener('blur', async () => {
        const tagValue = input.value.trim();
        if (tagValue) {
          const currentTags = Array.from(tagsContainer.querySelectorAll('.contact-tag')).map(t => t.textContent);
          if (!currentTags.includes(tagValue)) {
            await updateContactTags(email, [...currentTags, tagValue]);
          }
        }
        inputContainer.style.display = 'none';
        input.value = '';
      });
      input.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const tagValue = input.value.trim();
          if (tagValue) {
            const currentTags = Array.from(tagsContainer.querySelectorAll('.contact-tag')).map(t => t.textContent);
            if (!currentTags.includes(tagValue)) {
              await updateContactTags(email, [...currentTags, tagValue]);
            }
          }
          inputContainer.style.display = 'none';
          input.value = '';
        }
      });
    }
  } else {
    inputContainer.style.display = 'none';
  }
}

async function updateContactTags(email, tags) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE_CONTACT_TAGS',
      payload: { email, tags }
    });
    if (response && response.success) {
      await loadDailyReview();
    } else {
      showToast('Failed to update tags.', true);
    }
  } catch (error) {
    console.error('Error updating tags:', error);
    showToast('Error updating tags.', true);
  }
}

function attachTagHandlers() {
  // Use event delegation for tag buttons
  const container = document.getElementById('dailyReviewList');
  if (container) {
    container.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-add-tag')) {
        const email = e.target.getAttribute('data-email');
        if (email) {
          toggleTagInput(email);
        }
      }
    });
  }
}

function getNextStep(contact, outbound, inbound) {
  if (outbound > 0 && inbound === 0) {
    return { text: 'Awaiting reply', class: 'awaiting' };
  }
  
  if (contact.followUpDate) {
    const followUp = new Date(contact.followUpDate);
    const now = new Date();
    const daysUntil = Math.ceil((followUp - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 0) {
      return { text: 'Follow up now', class: 'follow-up' };
    } else if (daysUntil <= 2) {
      return { text: `Follow up in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`, class: 'follow-up' };
    }
  }
  
  if (inbound > 0 && outbound === 0) {
    return { text: 'New contact', class: 'new' };
  }
  
  return { text: 'Active', class: 'new' };
}

async function loadStatsAndPreview() {
  const [previewRes, statsRes, pendingRes, allContactsRes] = await Promise.all([
    chrome.runtime.sendMessage({ type: 'GET_EXPORT_PREVIEW' }),
    chrome.runtime.sendMessage({ type: 'GET_DASHBOARD_STATS' }),
    chrome.runtime.sendMessage({ type: 'GET_PENDING_CONTACTS' }),
    chrome.runtime.sendMessage({ action: 'getContacts' })
  ]);

  const previewContacts = (previewRes && previewRes.contacts) || [];
  const stats = (statsRes && statsRes.stats) || {};
  const pendingContacts = (pendingRes && pendingRes.contacts) || [];
  const allContacts = (allContactsRes && allContactsRes.contacts) || [];

  document.getElementById('totalContacts').textContent = stats.totalContacts != null
    ? stats.totalContacts
    : previewContacts.length;
  document.getElementById('newToday').textContent = stats.newToday != null
    ? stats.newToday
    : 0;
  document.getElementById('pendingApprovals').textContent = stats.pendingApprovals != null
    ? stats.pendingApprovals
    : pendingContacts.length;

  renderPreviewList(previewContacts);
  renderPendingApprovals(pendingContacts);
  renderRecentContacts(allContacts);
  await loadRejectedContacts();
}

// Load and render rejected contacts
async function loadRejectedContacts() {
  try {
    const result = await chrome.storage.local.get(['rejectedEmails']);
    const rejectedEmails = result.rejectedEmails || [];
    
    const container = document.getElementById('rejectedContactsList');
    if (!container) return;
    
    if (rejectedEmails.length === 0) {
      container.innerHTML = '<div class="empty-state">No rejected contacts</div>';
      return;
    }
    
    container.innerHTML = rejectedEmails.map(email => `
      <div class="contact-item">
        <div class="contact-info">
          <strong>${email}</strong>
          <div class="contact-meta">Rejected</div>
        </div>
        <button class="btn-restore" data-email="${email}" title="Un-reject this contact">
          ↺ Restore
        </button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading rejected contacts:', error);
  }
}

// Restore a rejected contact (remove from rejected list)
async function restoreRejectedContact(email) {
  try {
    const result = await chrome.storage.local.get(['rejectedEmails']);
    const rejectedEmails = result.rejectedEmails || [];
    
    const updatedRejected = rejectedEmails.filter(e => e !== email);
    await chrome.storage.local.set({ rejectedEmails: updatedRejected });
    
    await loadRejectedContacts();
    showToast(`${email} restored - will be detected again`);
  } catch (error) {
    console.error('Error restoring rejected contact:', error);
    showToast('Error restoring contact', true);
  }
}

// All Contacts CRM functionality
let allContactsData = [];
let filteredContacts = [];
let currentPage = 1;
const contactsPerPage = 20;
let currentSort = { field: 'lastContact', direction: 'desc' };

async function loadAllContacts() {
  console.log('📋 Loading all contacts...');
  
  // Clear any loading state immediately
  const tbody = document.getElementById('allContactsTableBody');
  if (tbody && tbody.textContent.includes('Loading')) {
    tbody.innerHTML = ''; // Clear loading state
  }
  
  try {
    // Add timeout to prevent infinite loading (increased to 10 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Loading contacts timed out')), 10000)
    );
    
    console.log('📤 Sending getContacts message...');
    const messagePromise = chrome.runtime.sendMessage({ action: 'getContacts' });
    
    const response = await Promise.race([messagePromise, timeoutPromise]);
    console.log('📥 Received contacts response:', response);
    allContactsData = (response && response.contacts) || [];
    
    console.log(`✅ Loaded ${allContactsData.length} contacts`);
    
    // Sort by lastContact descending by default
    allContactsData.sort((a, b) => {
      const dateA = a.lastContactAt ? new Date(a.lastContactAt) : new Date(0);
      const dateB = b.lastContactAt ? new Date(b.lastContactAt) : new Date(0);
      return dateB - dateA;
    });
    
    // Update mini stats with limit info
    const allCountEl = document.getElementById('contactLimitInfo');
    if (allCountEl) {
      // Get limit info from background
      chrome.runtime.sendMessage({ action: 'getContactLimit' }, (response) => {
        if (response && response.success) {
          const { count, limit, isOverLimit, isNearLimit, tier } = response;
          
          if (limit === -1) {
            // Unlimited
            allCountEl.textContent = count;
            allCountEl.style.color = '';
          } else {
            // Show count/limit
            allCountEl.textContent = `${count}/${limit}`;
            
            // Color code based on status
            if (isOverLimit) {
              allCountEl.style.color = '#ef4444'; // Red if over limit
              allCountEl.title = 'Over contact limit! Delete contacts or upgrade.';
            } else if (isNearLimit) {
              allCountEl.style.color = '#f59e0b'; // Orange if near limit
              allCountEl.title = 'Almost at contact limit. Consider upgrading.';
            } else {
              allCountEl.style.color = '';
              allCountEl.title = '';
            }
          }
          
          // Show/hide limit warning banner
          updateLimitWarningBanner(count, limit, tier, isOverLimit, isNearLimit);
        } else {
          allCountEl.textContent = allContactsData.length;
        }
      });
    }
    
    const pendingCountEl = document.getElementById('pendingCount');
    if (pendingCountEl) {
      const pendingCount = allContactsData.filter(c => c.status === 'pending').length;
      pendingCountEl.textContent = pendingCount;
    }
    
    const newTodayEl = document.getElementById('newTodayMini');
    if (newTodayEl) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newToday = allContactsData.filter(c => {
        const createdAt = c.createdAt ? new Date(c.createdAt) : null;
        return createdAt && createdAt >= today;
      }).length;
      newTodayEl.textContent = newToday;
    }
    
    // Always render, even with 0 contacts
    applyFiltersAndRender();
    
    // Refresh subscription display to update contact count
    if (typeof refreshSubscriptionDisplay === 'function') {
      await refreshSubscriptionDisplay();
    }
  } catch (error) {
    console.error('❌ Error loading all contacts:', error);
    
    // Set empty array to show empty state
    allContactsData = [];
    
    // Update counts immediately
    const allCountEl = document.getElementById('contactLimitInfo');
    if (allCountEl) {
      // Also update with limit when showing 0
      chrome.runtime.sendMessage({ action: 'getContactLimit' }, (response) => {
        if (response && response.success) {
          const { limit } = response;
          allCountEl.textContent = limit === -1 ? '0' : `0/${limit}`;
        } else {
          allCountEl.textContent = '0';
        }
      });
    }
    
    const pendingCountEl = document.getElementById('pendingCount');
    if (pendingCountEl) pendingCountEl.textContent = '0';
    
    const newTodayEl = document.getElementById('newTodayMini');
    if (newTodayEl) newTodayEl.textContent = '0';
    
    const tbody = document.getElementById('allContactsTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="padding: 0; border: none;">
            <div class="empty-state">
              <div class="empty-state-icon">⚠️</div>
              <h3 class="empty-state-title">Failed to Load Contacts</h3>
              <p class="empty-state-description">
                ${error.message || 'Something went wrong'}<br>
                This might be a temporary issue.
              </p>
              <button class="btn-primary reload-contacts-btn" style="margin-top: 8px;">
                Try Again
              </button>
            </div>
          </td>
        </tr>
      `;
      
      // Add reload button listener
      setTimeout(() => {
        const reloadBtn = tbody.querySelector('.reload-contacts-btn');
        if (reloadBtn) {
          reloadBtn.addEventListener('click', () => {
            loadAllContacts();
          });
        }
      }, 0);
    }
    
    // Refresh subscription display even on error
    if (typeof refreshSubscriptionDisplay === 'function') {
      await refreshSubscriptionDisplay().catch(err => console.error('Subscription display error:', err));
    }
  } finally {
    // Ensure we always render something, even on error
    if (!allContactsData || allContactsData.length === 0) {
      const tbody = document.getElementById('allContactsTableBody');
      if (tbody && (!tbody.innerHTML || tbody.innerHTML.includes('Loading'))) {
        // Force render empty state
        applyFiltersAndRender();
      }
    }
  }
}

function applyFiltersAndRender() {
  const searchTerm = (document.getElementById('contactSearchInput')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('statusFilter')?.value || '';
  
  // Filter contacts
  filteredContacts = allContactsData.filter(contact => {
    // Search filter
    const matchesSearch = !searchTerm || 
      (getFullName(contact.firstName, contact.lastName) || '').toLowerCase().includes(searchTerm) ||
      (contact.email || '').toLowerCase().includes(searchTerm) ||
      (contact.company || '').toLowerCase().includes(searchTerm) ||
      (contact.title || '').toLowerCase().includes(searchTerm);
    
    // Status filter
    const matchesStatus = !statusFilter || contact.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Apply sorting
  applySorting();
  
  // Update count
  const countEl = document.getElementById('allContactsCount');
  if (countEl) {
    countEl.textContent = filteredContacts.length;
  }
  
  // Render table
  renderContactsTable();
  updatePagination();
}

function applySorting() {
  const { field, direction } = currentSort;
  
  filteredContacts.sort((a, b) => {
    let aVal, bVal;
    
    switch (field) {
      case 'name':
        aVal = (a.name || a.email || '').toLowerCase();
        bVal = (b.name || b.email || '').toLowerCase();
        break;
      case 'company':
        aVal = (a.company || '').toLowerCase();
        bVal = (b.company || '').toLowerCase();
        break;
      case 'email':
        aVal = (a.email || '').toLowerCase();
        bVal = (b.email || '').toLowerCase();
        break;
      case 'lastContact':
        aVal = a.lastContactAt ? new Date(a.lastContactAt) : new Date(0);
        bVal = b.lastContactAt ? new Date(b.lastContactAt) : new Date(0);
        break;
      case 'firstContact':
        aVal = a.firstContactAt ? new Date(a.firstContactAt) : new Date(0);
        bVal = b.firstContactAt ? new Date(b.firstContactAt) : new Date(0);
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function renderContactsTable() {
  const tbody = document.getElementById('allContactsTableBody');
  if (!tbody) return;
  
  if (filteredContacts.length === 0) {
    // Show better empty state
    const isFiltered = allContactsData.length > 0;
    const emptyStateHTML = isFiltered ? `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3 class="empty-state-title">No Matches Found</h3>
        <p class="empty-state-description">
          Try adjusting your search or filters to find what you're looking for.
        </p>
        <button class="btn-primary clear-search-btn" style="margin-top: 8px;">
          Clear Search
        </button>
      </div>
    ` : `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <h3 class="empty-state-title">No Contacts Yet</h3>
        <p class="empty-state-description">
          Open Gmail and start sending emails.<br>
          We'll automatically track your contacts!
        </p>
        <button class="btn-primary open-gmail-btn" style="margin-top: 8px;">
          Open Gmail
        </button>
      </div>
    `;
    
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="padding: 0; border: none;">
          ${emptyStateHTML}
        </td>
      </tr>
    `;
    
    // Add event listeners to empty state buttons (can't use onclick due to CSP)
    setTimeout(() => {
      const clearSearchBtn = tbody.querySelector('.clear-search-btn');
      if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
          document.getElementById('contactSearchInput').value = '';
          applyFiltersAndRender();
        });
      }
      
      const openGmailBtn = tbody.querySelector('.open-gmail-btn');
      if (openGmailBtn) {
        openGmailBtn.addEventListener('click', () => {
          chrome.tabs.create({ url: 'https://mail.google.com' });
        });
      }
    }, 0);
    
    return;
  }
  
  // Calculate pagination
  const startIndex = (currentPage - 1) * contactsPerPage;
  const endIndex = startIndex + contactsPerPage;
  const pageContacts = filteredContacts.slice(startIndex, endIndex);
  
  tbody.innerHTML = pageContacts.map((contact, index) => {
    const statusClass = getStatusClass(contact.status);
    const rowIndex = startIndex + index;
    const fullName = getFullName(contact.firstName, contact.lastName) || contact.email || 'Unknown';
    
    return `
      <tr class="contact-row" data-email="${contact.email || ''}" data-row-index="${rowIndex}" style="border-bottom: 1px solid var(--border);">
        <td style="padding: 10px 12px;">
          <div style="font-weight: 500; color: var(--text); margin-bottom: 2px;">${fullName}</div>
          <div style="font-size: 11px; color: var(--text-secondary);">${contact.email || ''}</div>
        </td>
        <td style="padding: 10px 12px; color: var(--text);">
          ${contact.company || '-'}
        </td>
        <td style="padding: 10px 12px;">
          <span class="status-badge ${statusClass}">${contact.status || 'approved'}</span>
        </td>
        <td style="padding: 10px 12px; text-align: center; width: 40px;" class="action-cell">
          <button class="btn-small edit-contact-btn" data-email="${contact.email || ''}" title="Edit" style="background: transparent; border: none; cursor: pointer; font-size: 16px; opacity: 0.6; transition: opacity 0.2s;">
            ✏️
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  // Attach event listeners to rows
  tbody.querySelectorAll('.contact-row').forEach(row => {
    row.addEventListener('click', (e) => {
      // Don't trigger if clicking on action button
      if (e.target.closest('.action-cell')) return;
      const email = row.getAttribute('data-email');
      const contact = filteredContacts.find(c => c.email === email);
      if (contact) {
        showContactDetailsPopup(contact);
      }
    });
  });
  
  // Attach event listeners to edit buttons
  tbody.querySelectorAll('.edit-contact-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const email = btn.getAttribute('data-email');
      const contact = filteredContacts.find(c => c.email === email);
      if (contact) {
        showContactDetailsPopup(contact);
      }
    });
  });
  
  // Update showing count
  const showingEl = document.getElementById('contactsShowing');
  const totalEl = document.getElementById('contactsTotal');
  if (showingEl) showingEl.textContent = `${startIndex + 1}-${Math.min(endIndex, filteredContacts.length)}`;
  if (totalEl) totalEl.textContent = filteredContacts.length;
}

function updatePagination() {
  const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
  const pageInfo = document.getElementById('pageInfo');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  
  if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

function getStatusClass(status) {
  switch (status) {
    case 'approved': return 'status-approved';
    case 'pending': return 'status-pending';
    case 'archived': return 'status-archived';
    case 'lost': return 'status-lost';
    case 'Follow-up Scheduled': return 'status-followup';
    default: return 'status-approved';
  }
}

function renderPreviewList(contacts) {
  const previewContainer = document.getElementById('previewList');
  if (!previewContainer) return;

  if (!contacts || contacts.length === 0) {
    previewContainer.innerHTML = '<div class="empty-state">No CRM activity yet today.</div>';
    return;
  }

  const topContacts = contacts.slice(0, 10);
  previewContainer.innerHTML = topContacts.map(contact => `
    <div class="preview-row">
      <div class="preview-main">
        <span class="preview-name">${getFullName(contact.firstName, contact.lastName) || contact.email}</span>
        <span class="preview-email">${contact.email}</span>
      </div>
      <div class="preview-meta">
        ${contact.company ? `<span class="preview-company">${contact.company}</span>` : ''}
        ${(contact.outboundCount || 0) || (contact.inboundCount || 0) ?
          `<span class="preview-counts">
            ↗ ${contact.outboundCount || 0} · ↘ ${contact.inboundCount || 0}
          </span>` : ''}
      </div>
    </div>
  `).join('');
}

function renderPendingApprovals(pendingContacts) {
  const container = document.getElementById('pendingList');
  if (!container) return;

  // Cache for click-to-details
  lastPendingContacts = Array.isArray(pendingContacts) ? pendingContacts : [];

  if (!pendingContacts || pendingContacts.length === 0) {
    container.innerHTML = '<div class="empty-state">No pending approvals. You\'re all caught up!</div>';
    return;
  }

  container.innerHTML = pendingContacts.map(contact => `
    <div class="contact-item">
      <div class="contact-info">
        <strong>${getFullName(contact.firstName, contact.lastName) || contact.email}</strong>
        ${contact.company ? `<div class="contact-meta">${contact.company}</div>` : ''}
        ${contact.title ? `<div class="contact-meta">${contact.title}</div>` : ''}
      </div>
      <div class="contact-status new">
        <button class="btn-inline-approve" data-email="${contact.email}">Approve</button>
      </div>
    </div>
  `).join('');
}

function renderRecentContacts(contacts) {
  const container = document.getElementById('recentContactsList');
  if (!container) return;

  if (!contacts || contacts.length === 0) {
    container.innerHTML = '<div class="empty-state">No contacts yet. Start emailing or scan your emails!</div>';
    return;
  }

  const recent = contacts
    .slice()
    .sort((a, b) => new Date(b.lastContactAt || b.lastContact || b.createdAt) - new Date(a.lastContactAt || a.lastContact || a.createdAt))
    .slice(0, 10);

  container.innerHTML = recent.map(contact => `
    <div class="contact-item recent-contact-item" data-email="${contact.email}">
      <div class="contact-info">
        <strong>${getFullName(contact.firstName, contact.lastName) || contact.email}</strong>
        ${contact.company ? `<div class="contact-meta">${contact.company}</div>` : ''}
        ${contact.title ? `<div class="contact-meta">${contact.title}</div>` : ''}
      </div>
      <div class="contact-status ${(contact.status || 'new').toLowerCase().replace(/\s+/g, '-')}">
        ${contact.status || 'New'}
      </div>
    </div>
  `).join('');

  // Attach click handlers to show contact details
  container.querySelectorAll('.recent-contact-item').forEach(item => {
    item.addEventListener('click', () => {
      const email = item.getAttribute('data-email');
      const contact = contacts.find(c => c.email === email);
      if (contact) {
        showContactDetailsPopup(contact);
      }
    });
  });
}

function setupEventListeners() {
  console.log('🎧 Setting up event listeners...');
  
  // Show Widget button
  const showWidgetBtn = document.getElementById('showWidgetBtn');
  if (showWidgetBtn) {
    console.log('✓ Show Widget button found');
    
    // Add mousedown for debugging
    showWidgetBtn.addEventListener('mousedown', () => {
      console.log('🖱️ Show Widget button mousedown detected');
    });
    
    showWidgetBtn.addEventListener('click', async () => {
      console.log('📌 Show Widget button clicked!');
      try {
        // Get the active Gmail tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Current tabs:', tabs);
        if (tabs[0] && tabs[0].url?.includes('mail.google.com')) {
          // Send message to content script to show widget
          console.log('Sending showWidget message to tab', tabs[0].id);
          chrome.tabs.sendMessage(tabs[0].id, { action: 'showWidget' });
          showToast('Widget shown on Gmail page');
        } else {
          console.log('Not on Gmail, current URL:', tabs[0]?.url);
          showToast('Please open Gmail first', true);
        }
      } catch (error) {
        console.error('Error showing widget:', error);
        showToast('Failed to show widget', true);
      }
    });
  } else {
    console.error('❌ Show Widget button not found!');
  }

  // Settings changes
  document.getElementById('darkMode').addEventListener('change', async (e) => {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    const settings = response.settings || {};
    settings.darkMode = e.target.checked;
    await chrome.runtime.sendMessage({ action: 'updateSettings', settings });
    // Apply theme to popup
    document.documentElement.setAttribute('data-theme', e.target.checked ? 'dark' : 'light');
    // Notify all tabs to update theme
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'themeChanged', darkMode: e.target.checked }).catch(() => {});
      });
    });
  });

  document.getElementById('autoApprove').addEventListener('change', async (e) => {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    const settings = response.settings || {};
    settings.autoApprove = e.target.checked;
    await chrome.runtime.sendMessage({ action: 'updateSettings', settings });
  });

  document.getElementById('sidebarEnabled').addEventListener('change', async (e) => {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    const settings = response.settings || {};
    settings.sidebarEnabled = e.target.checked;
    await chrome.runtime.sendMessage({ action: 'updateSettings', settings });
  });

  const soundEffectsInput = document.getElementById('soundEffects');
  if (soundEffectsInput) {
    soundEffectsInput.addEventListener('change', async (e) => {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      const settings = response.settings || {};
      settings.soundEffects = e.target.checked;
      await chrome.runtime.sendMessage({ action: 'updateSettings', settings });
    });
  }

  const hotkeysInput = document.getElementById('hotkeysEnabled');
  if (hotkeysInput) {
    hotkeysInput.addEventListener('change', async (e) => {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      const settings = response.settings || {};
      settings.hotkeysEnabled = e.target.checked;
      await chrome.runtime.sendMessage({ action: 'updateSettings', settings });
    });
  }

  const reminderDaysInput = document.getElementById('reminderDays');
  if (reminderDaysInput) {
    reminderDaysInput.addEventListener('change', async (e) => {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      const settings = response.settings || {};
      settings.reminderDays = parseInt(e.target.value) || 3;
      await chrome.runtime.sendMessage({ action: 'updateSettings', settings });
    });
  }

  const noReplyInput = document.getElementById('noReplyAfterDays');
  if (noReplyInput) {
    noReplyInput.addEventListener('change', async (e) => {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      const settings = response.settings || {};
      const value = e.target.value.trim();
      if (value) {
        settings.noReplyAfterDays = value.split(',').map(s => parseInt(s.trim())).filter(n => !Number.isNaN(n) && n > 0);
      } else {
        settings.noReplyAfterDays = [3, 7, 14];
      }
      await chrome.runtime.sendMessage({ action: 'updateSettings', settings });
    });
  }

  // Gmail labels input
  const labelsInput = document.getElementById('gmailLabelsInput');
  if (labelsInput) {
    labelsInput.addEventListener('blur', async (e) => {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      const settings = response.settings || {};
      const labelsText = e.target.value.trim();
      settings.trackedLabels = labelsText 
        ? labelsText.split(',').map(l => l.trim()).filter(l => l.length > 0)
        : [];
      await chrome.runtime.sendMessage({ action: 'updateSettings', settings });
    });
  }

  // Exclusion inputs - Tag style (press Enter to add)
  const excludeDomainsInput = document.getElementById('excludeDomainsInput');
  if (excludeDomainsInput) {
    excludeDomainsInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = e.target.value.trim().toLowerCase();
        if (value) {
          await addTag('excludeDomains', value);
          e.target.value = '';
        }
      }
    });
  }

  const excludeNamesInput = document.getElementById('excludeNamesInput');
  if (excludeNamesInput) {
    excludeNamesInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = e.target.value.trim();
        if (value) {
          await addTag('excludeNames', value);
          e.target.value = '';
        }
      }
    });
  }

  const excludePhonesInput = document.getElementById('excludePhonesInput');
  if (excludePhonesInput) {
    excludePhonesInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = e.target.value.trim().replace(/\s+/g, '');
        if (value) {
          await addTag('excludePhones', value);
          e.target.value = '';
        }
      }
    });
  }
  
  // Handle tag removal clicks (event delegation)
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag-remove')) {
      const type = e.target.getAttribute('data-type');
      const value = e.target.getAttribute('data-value');
      if (type && value) {
        removeTag(type, value);
      }
    }
    
    // Handle restore rejected contact
    if (e.target.classList.contains('btn-restore') || e.target.closest('.btn-restore')) {
      const btn = e.target.classList.contains('btn-restore') ? e.target : e.target.closest('.btn-restore');
      const email = btn.getAttribute('data-email');
      if (email) {
        restoreRejectedContact(email);
      }
    }
  });
  
  // Clear all rejected contacts
  const clearRejectedBtn = document.getElementById('clearRejected');
  if (clearRejectedBtn) {
    clearRejectedBtn.addEventListener('click', async () => {
      if (confirm('Clear all rejected contacts? This will allow them to be detected again.')) {
        await chrome.storage.local.set({ rejectedEmails: [] });
        await loadRejectedContacts();
        showToast('Rejected contacts cleared');
      }
    });
  }

  // Actions
  const exportCSVBtn = document.getElementById('exportCSV');
  if (exportCSVBtn) {
    exportCSVBtn.addEventListener('click', async () => {
      const btn = exportCSVBtn;
      const originalText = btn.textContent;

      try {
        btn.disabled = true;
        btn.textContent = 'Exporting...';

        const response = await chrome.runtime.sendMessage({ type: 'EXPORT_CSV_TODAY' });
        if (response && response.success) {
          btn.textContent = '✓ Exported';
          showToast('CSV export started for today\'s CRM activity.');
        } else {
          btn.textContent = 'Retry Export';
          showToast(response && response.message ? response.message : 'Export failed. Please try again.', true);
        }
      } catch (error) {
        console.error('Export CSV error in popup:', error);
        btn.textContent = 'Retry Export';
        showToast('Export failed due to an unexpected error.', true);
      } finally {
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
        }, 2500);
      }
    });
  }

  const viewDashboardBtn = document.getElementById('viewDashboard');
  if (viewDashboardBtn) {
    viewDashboardBtn.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url?.includes('mail.google.com')) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'showSidebar' });
        } else {
          chrome.tabs.create({ url: 'https://mail.google.com' });
        }
      });
    });
  }

  // Clear all contacts
  const clearBtn = document.getElementById('clearContacts');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (!confirm('This will remove all saved contacts from CRMSYNC. Are you sure?')) {
        return;
      }
      clearBtn.disabled = true;
      const originalText = clearBtn.textContent;
      clearBtn.textContent = 'Clearing...';
      try {
        const response = await chrome.runtime.sendMessage({ type: 'CLEAR_CONTACTS' });
        if (response && response.success) {
          showToast('All contacts have been cleared.');
          await loadStatsAndPreview();
          await loadDailyReview();
        } else {
          showToast('Failed to clear contacts.', true);
        }
      } catch (error) {
        console.error('Error clearing contacts:', error);
        showToast('Unexpected error clearing contacts.', true);
      } finally {
        setTimeout(() => {
          clearBtn.disabled = false;
          clearBtn.textContent = originalText;
        }, 1500);
      }
    });
  }

  // Daily review: click contact row to see details (but not when editing tags)
  const dailyList = document.getElementById('dailyReviewList');
  if (dailyList) {
    dailyList.addEventListener('click', (event) => {
      const target = event.target;
      if (!target) return;

      // Ignore clicks on tag controls
      if (target.classList.contains('btn-add-tag') || target.classList.contains('tag-input')) {
        return;
      }

      const item = target.closest('.contact-item');
      if (!item) return;

      const email = item.getAttribute('data-email');
      if (!email) return;

      const contact = (keyboardState.currentContacts || []).find(c => c.email === email);
      if (contact) {
        showContactDetailsPopup(contact);
      }
    });
  }

  // Pending approvals: click row to see details, button still approves
  const pendingList = document.getElementById('pendingList');
  if (pendingList) {
    pendingList.addEventListener('click', async (event) => {
      const target = event.target;
      if (!target) return;

      if (target.classList.contains('btn-inline-approve')) {
        const email = target.getAttribute('data-email');
        if (!email) return;
        target.disabled = true;
        target.textContent = 'Approving...';
        try {
          const response = await chrome.runtime.sendMessage({
            type: 'APPROVE_CONTACT',
            payload: { email }
          });
          if (response && response.success) {
            showToast('Contact approved and will be included in exports.');
            await loadStatsAndPreview();
          } else {
            showToast('Failed to approve contact.', true);
          }
        } catch (error) {
          console.error('Error approving contact from popup:', error);
          showToast('Unexpected error approving contact.', true);
        }
        return;
      }

      const item = target.closest('.contact-item');
      if (!item) return;
      const email = item.getAttribute('data-email');
      if (!email) return;
      const contact = lastPendingContacts.find(c => c.email === email);
      if (contact) {
        showContactDetailsPopup(contact);
      }
    });
  }

  // Keyboard help button
  const showKeyboardHelpBtn = document.getElementById('showKeyboardHelp');
  if (showKeyboardHelpBtn) {
    showKeyboardHelpBtn.addEventListener('click', () => {
      toggleHelpOverlay();
    });
  }

  // Column toggle button
  const toggleColumnsBtn = document.getElementById('toggleColumns');
  if (toggleColumnsBtn) {
    toggleColumnsBtn.addEventListener('click', () => {
      const panel = document.getElementById('columnTogglePanel');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      }
    });
  }

  // Column toggle checkboxes
  const columnToggles = document.querySelectorAll('.column-toggle');
  columnToggles.forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const column = e.target.getAttribute('data-column');
      columnVisibility[column] = e.target.checked;
      // Re-render the list with new visibility
      loadDailyReview();
    });
  });

  // Export & Mark Reviewed button
  const exportAndMarkReviewedBtn = document.getElementById('exportAndMarkReviewed');
  if (exportAndMarkReviewedBtn) {
    exportAndMarkReviewedBtn.addEventListener('click', async () => {
      const btn = exportAndMarkReviewedBtn;
      const originalText = btn.textContent;

      try {
        btn.disabled = true;
        btn.textContent = 'Exporting...';

        console.log('Exporting today\'s contacts...');
        const response = await chrome.runtime.sendMessage({ type: 'EXPORT_AND_MARK_REVIEWED' });
        console.log('Export response:', response);
        
        if (response && response.success) {
          btn.textContent = '✓ Exported';
          showToast('✅ CSV exported successfully');
          await loadDailyReview();
        } else {
          btn.textContent = 'Retry';
          const message = response?.message || 'Export failed. Please try again.';
          showToast(message, true);
        }
      } catch (error) {
        console.error('Export & Mark Reviewed error:', error);
        btn.textContent = 'Retry';
        showToast(`Export failed: ${error.message}`, true);
      } finally {
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
        }, 2500);
      }
    });
  }

  // All Contacts Tab Event Listeners
  setupAllContactsListeners();

}

function setupAllContactsListeners() {
  // Search input
  const searchInput = document.getElementById('contactSearchInput');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentPage = 1;
        applyFiltersAndRender();
      }, 300);
    });
  }

  // Status filter
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      currentPage = 1;
      applyFiltersAndRender();
    });
  }

  // Sort dropdown
  const sortBy = document.getElementById('sortBy');
  if (sortBy) {
    sortBy.addEventListener('change', (e) => {
      currentSort.field = e.target.value;
      currentSort.direction = 'desc';
      applyFiltersAndRender();
    });
  }

  // Filter buttons
  const filterButtons = document.querySelectorAll('[id^="filter"]');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.getAttribute('data-filter');
      if (filter === 'all') {
        if (statusFilter) statusFilter.value = '';
      } else if (filter === 'approved') {
        if (statusFilter) statusFilter.value = 'approved';
      } else if (filter === 'pending') {
        if (statusFilter) statusFilter.value = 'pending';
      } else if (filter === 'archived') {
        if (statusFilter) statusFilter.value = 'archived';
      } else if (filter === 'followup') {
        // Filter for contacts needing follow-up
        if (statusFilter) statusFilter.value = '';
        // This would need custom logic - for now just show all
      }
      currentPage = 1;
      applyFiltersAndRender();
    });
  });

  // Sort column headers
  const sortHeaders = document.querySelectorAll('[data-sort]');
  sortHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const field = header.getAttribute('data-sort');
      if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.field = field;
        currentSort.direction = 'desc';
      }
      applyFiltersAndRender();
      updateSortIndicators();
    });
  });

  // Pagination
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        applyFiltersAndRender();
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        applyFiltersAndRender();
      }
    });
  }

  // Refresh button
  const refreshBtn = document.getElementById('refreshAllContacts');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadAllContacts();
    });
  }

  // Export buttons
  const exportAllBtn = document.getElementById('exportAllContactsCSV');
  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', async () => {
      try {
        // Check if we have contacts to export
        if (!allContactsData || allContactsData.length === 0) {
          showToast('No contacts to export', true);
          return;
        }
        
        exportAllBtn.disabled = true;
        exportAllBtn.textContent = 'Exporting...';
        
        console.log('Exporting contacts:', allContactsData.length);
        const response = await chrome.runtime.sendMessage({ 
          type: 'EXPORT_CSV_CUSTOM', 
          payload: { contacts: allContactsData } 
        });
        
        console.log('Export response:', response);
        
        if (response && response.success) {
          showToast(`✅ Exported ${allContactsData.length} contacts to CSV`);
        } else {
          const message = response?.message || 'Export failed. Please try again.';
          showToast(message, true);
        }
      } catch (error) {
        console.error('Export error:', error);
        showToast(`Export failed: ${error.message}`, true);
      } finally {
        exportAllBtn.disabled = false;
        exportAllBtn.textContent = 'Export CSV';
      }
    });
  }

  const exportFilteredBtn = document.getElementById('exportFilteredCSV');
  if (exportFilteredBtn) {
    exportFilteredBtn.addEventListener('click', async () => {
      try {
        exportFilteredBtn.disabled = true;
        exportFilteredBtn.textContent = 'Exporting...';
        const response = await chrome.runtime.sendMessage({ 
          type: 'EXPORT_CSV_CUSTOM', 
          payload: { contacts: filteredContacts } 
        });
        if (response && response.success) {
          showToast(`Exported ${filteredContacts.length} contacts to CSV.`);
        } else {
          showToast('Export failed.', true);
        }
      } catch (error) {
        console.error('Export error:', error);
        showToast('Export failed.', true);
      } finally {
        exportFilteredBtn.disabled = false;
        exportFilteredBtn.textContent = 'Export Filtered';
      }
    });
  }
}

function updateSortIndicators() {
  const sortHeaders = document.querySelectorAll('[data-sort]');
  sortHeaders.forEach(header => {
    const field = header.getAttribute('data-sort');
    const indicator = header.querySelector('.sort-indicator');
    if (indicator) {
      if (currentSort.field === field) {
        indicator.textContent = currentSort.direction === 'asc' ? '▲' : '▼';
      } else {
        indicator.textContent = '▼';
      }
    }
  });
}

function showToast(message, isError) {
  const existing = document.getElementById('popup-toast');
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'popup-toast';
  toast.textContent = message;
  toast.className = 'popup-toast';
  toast.style.position = 'fixed';
  toast.style.bottom = '8px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.padding = '6px 12px';
  toast.style.borderRadius = '999px';
  toast.style.fontSize = '12px';
  toast.style.zIndex = '1000';
  toast.style.color = '#fff';
  toast.style.backgroundColor = isError ? '#c62828' : '#2e7d32';

  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 2500);
}

function showContactDetailsPopup(contact) {
  // Remove existing overlay if any
  const existing = document.getElementById('contactDetailsOverlay');
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = 'contactDetailsOverlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.background = 'rgba(0,0,0,0.35)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '999';

  const card = document.createElement('div');
  card.style.background = 'var(--bg)';
  card.style.color = 'var(--text)';
  card.style.borderRadius = '12px';
  card.style.padding = '24px';
  card.style.minWidth = '460px';
  card.style.maxWidth = '500px';
  card.style.boxShadow = '0 20px 60px rgba(0,0,0,0.4)';
  card.style.fontSize = '14px';
  card.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  card.style.border = '1px solid var(--border)';

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
      <div style="flex:1;">
        <div style="font-weight:600;font-size:18px;color:var(--text);margin-bottom:4px;line-height:1.3;">${getFullName(contact.firstName, contact.lastName) || contact.email}</div>
        <div style="font-size:13px;color:var(--text-secondary,var(--text));opacity:0.7;">${contact.email}</div>
      </div>
      <button id="contactDetailsCloseBtn" style="border:none;background:transparent;color:var(--text);font-size:20px;cursor:pointer;opacity:0.5;transition:all 0.2s;line-height:1;padding:4px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px;flex-shrink:0;" onmouseover="this.style.opacity='0.8';this.style.background='var(--surface)'" onmouseout="this.style.opacity='0.5';this.style.background='transparent'">×</button>
    </div>
    <form id="contactDetailsForm" style="display:flex;flex-direction:column;gap:20px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <label style="display:block;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:500;color:var(--text);display:block;">First Name</span>
          </label>
          <input type="text" name="firstName" value="${contact.firstName || ''}" class="text-input" style="width:100%;" placeholder="First name" />
        </div>
        <div>
          <label style="display:block;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:500;color:var(--text);display:block;">Last Name</span>
          </label>
          <input type="text" name="lastName" value="${contact.lastName || ''}" class="text-input" style="width:100%;" placeholder="Last name" />
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr;gap:16px;">
        <div>
          <label style="display:block;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:500;color:var(--text);display:block;">Email</span>
          </label>
          <input type="text" name="email" value="${contact.email || ''}" class="text-input" style="width:100%;opacity:0.7;cursor:not-allowed;" readonly />
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <label style="display:block;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:500;color:var(--text);display:block;">Job Title</span>
          </label>
          <input type="text" name="title" value="${contact.title || ''}" class="text-input" style="width:100%;" placeholder="Enter job title" />
        </div>
        <div>
          <label style="display:block;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:500;color:var(--text);display:block;">Company</span>
          </label>
          <input type="text" name="company" value="${contact.company || ''}" class="text-input" style="width:100%;" placeholder="Enter company" />
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <label style="display:block;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:500;color:var(--text);display:block;">Phone</span>
          </label>
          <input type="text" name="phone" value="${contact.phone || ''}" class="text-input" style="width:100%;" placeholder="Enter phone number" />
        </div>
        <div>
          <label style="display:block;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:500;color:var(--text);display:block;">LinkedIn</span>
          </label>
          <input type="text" name="linkedin" value="${contact.linkedin || ''}" class="text-input" style="width:100%;" placeholder="LinkedIn URL" />
        </div>
      </div>
      <div style="padding-top:16px;border-top:1px solid var(--border);">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <label style="display:block;margin-bottom:6px;">
              <span style="font-size:13px;font-weight:500;color:var(--text);display:block;">Status</span>
            </label>
            <select name="status" class="text-input" style="width:100%;">
              ${['approved','pending','archived','lost','Follow-up Scheduled'].map(s => `
                <option value="${s}" ${String(contact.status || '').toLowerCase() === s.toLowerCase() ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label style="display:block;margin-bottom:6px;">
              <span style="font-size:13px;font-weight:500;color:var(--text);display:block;">Follow-up Date</span>
            </label>
            <input type="date" name="followUpDate" value="${contact.followUpDate ? new Date(contact.followUpDate).toISOString().split('T')[0] : ''}" class="text-input" style="width:100%;" />
          </div>
        </div>
      </div>
      <div style="padding-top:16px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px;">
        <button type="button" id="contactDetailsCancelBtn" class="btn-secondary" style="padding:10px 20px;font-size:14px;font-weight:600;min-width:80px;">Cancel</button>
        <button type="submit" id="contactDetailsSaveBtn" class="btn-primary" style="padding:10px 20px;font-size:14px;font-weight:600;min-width:80px;">Save</button>
      </div>
    </form>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Add focus styles to inputs to match popup.css
  const style = document.createElement('style');
  style.textContent = `
    #contactDetailsOverlay .text-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    #contactDetailsOverlay .btn-primary:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }
    #contactDetailsOverlay .btn-secondary:hover {
      background: var(--surface);
      border-color: var(--primary);
      color: var(--primary);
    }
  `;
  document.head.appendChild(style);

  const close = () => {
    overlay.remove();
    style.remove();
  };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  const closeBtn = document.getElementById('contactDetailsCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', close);
  }

  const cancelBtn = document.getElementById('contactDetailsCancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', close);
  }

  const form = document.getElementById('contactDetailsForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const updated = {
        ...contact,
        firstName: formData.get('firstName') || '',
        lastName: formData.get('lastName') || '',
        email: formData.get('email') || '',
        title: formData.get('title') || '',
        company: formData.get('company') || '',
        phone: formData.get('phone') || '',
        linkedin: formData.get('linkedin') || '',
        lastContactAt: formData.get('lastContactAt') || contact.lastContactAt || undefined,
        followUpDate: formData.get('followUpDate') || undefined,
        status: formData.get('status') || contact.status
      };

      const saveBtn = document.getElementById('contactDetailsSaveBtn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
      }

      try {
        const resp = await chrome.runtime.sendMessage({ action: 'updateContact', contact: updated });
        if (resp && resp.success) {
          showToast('Contact updated.');
          close();
          // Refresh both views so data stays in sync
          await loadDailyReview();
          await loadStatsAndPreview();
        } else {
          showToast('Failed to update contact.', true);
        }
      } catch (err) {
        console.error('Error updating contact from details form', err);
        showToast('Error updating contact.', true);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save';
        }
      }
    });
  }
}

