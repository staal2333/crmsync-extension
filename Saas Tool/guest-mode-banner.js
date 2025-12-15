// Guest mode banner - Shows prompts to encourage sign-up
// Displayed in popup when user is in guest mode

/**
 * Show guest mode banner in popup
 * @param {HTMLElement} container - Container to inject banner into
 */
function showGuestModeBanner(container) {
  const banner = document.createElement('div');
  banner.id = 'guestModeBanner';
  banner.style.cssText = `
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  `;
  
  banner.innerHTML = `
    <div style="display: flex; align-items: start; gap: 12px;">
      <div style="font-size: 24px;">☁️</div>
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">
          Unlock Cloud Sync
        </div>
        <div style="font-size: 12px; opacity: 0.9; margin-bottom: 12px; line-height: 1.4;">
          Sign in to sync your contacts across all your devices and never lose data again.
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="guestSignInBtn" style="
            background: white;
            color: #6366f1;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
          ">
            Sign In
          </button>
          <button id="dismissGuestBanner" style="
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
          ">
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  `;
  
  container.prepend(banner);
  
  // Add hover effects
  const signInBtn = banner.querySelector('#guestSignInBtn');
  const dismissBtn = banner.querySelector('#dismissGuestBanner');
  
  signInBtn.addEventListener('mouseover', () => {
    signInBtn.style.transform = 'translateY(-1px)';
    signInBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
  });
  
  signInBtn.addEventListener('mouseout', () => {
    signInBtn.style.transform = 'translateY(0)';
    signInBtn.style.boxShadow = 'none';
  });
  
  dismissBtn.addEventListener('mouseover', () => {
    dismissBtn.style.background = 'rgba(255,255,255,0.3)';
  });
  
  dismissBtn.addEventListener('mouseout', () => {
    dismissBtn.style.background = 'rgba(255,255,255,0.2)';
  });
  
  // Event handlers
  signInBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('login.html') });
  });
  
  dismissBtn.addEventListener('click', async () => {
    banner.remove();
    // Set dismiss timestamp
    await chrome.storage.local.set({ guestBannerDismissedAt: new Date().toISOString() });
  });
}

/**
 * Check if guest banner should be shown
 * @returns {Promise<boolean>}
 */
async function shouldShowGuestBanner() {
  const { isGuest, guestBannerDismissedAt, guestModeChosenAt } = await chrome.storage.local.get([
    'isGuest',
    'guestBannerDismissedAt',
    'guestModeChosenAt'
  ]);
  
  if (!isGuest) {
    return false;
  }
  
  // Show banner 1 day after choosing guest mode
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const chosenAt = guestModeChosenAt ? new Date(guestModeChosenAt).getTime() : now;
  const dismissedAt = guestBannerDismissedAt ? new Date(guestBannerDismissedAt).getTime() : 0;
  
  // Don't show if dismissed in last 7 days
  if (dismissedAt && now - dismissedAt < 7 * ONE_DAY) {
    return false;
  }
  
  // Show after 1 day of guest mode
  return now - chosenAt > ONE_DAY;
}

// Make available globally
if (typeof window !== 'undefined') {
  window.GuestModeBanner = {
    show: showGuestModeBanner,
    shouldShow: shouldShowGuestBanner,
  };
}

