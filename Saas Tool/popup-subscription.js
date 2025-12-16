// ============================================
// Subscription Management Functions
// ============================================

/**
 * Display subscription status in popup
 */
async function displaySubscriptionStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SUBSCRIPTION' });
    
    console.log('📊 Subscription status:', response);
    
    // Update tier badge if it exists
    const tierBadge = document.getElementById('subscriptionTierBadge');
    if (tierBadge) {
      tierBadge.textContent = response.tier.toUpperCase();
      tierBadge.className = `tier-badge tier-${response.tier}`;
    }
    
    // Always show contact count with limit for free tier (including guest mode)
    const contactLimitInfo = document.getElementById('contactLimitInfo');
    if (contactLimitInfo) {
      // Get actual contact count from storage to ensure accuracy
      const { contacts } = await chrome.storage.local.get(['contacts']);
      const contactList = contacts || [];
      const currentCount = contactList.length;
      
      if (response.tier === 'free' || response.isGuestMode) {
        const limit = response.contactLimit || 50;
        const percentage = (currentCount / limit) * 100;
        
        // Always show "X / 50" format for free tier
        contactLimitInfo.textContent = `${currentCount} / ${limit}`;
        contactLimitInfo.style.color = percentage > 80 ? '#ef4444' : 'inherit';
        
        console.log(`📈 Contact limit display: ${currentCount} / ${limit} (${percentage.toFixed(0)}%)`);
        
        // Show upgrade banner if approaching limit
        if (percentage > 80 && currentCount > 0) {
          showUpgradeBanner({...response, currentContactCount: currentCount});
        }
      } else {
        // For paid tiers, just show count
        contactLimitInfo.textContent = currentCount.toString();
      }
    }
    
  } catch (error) {
    console.error('Failed to load subscription:', error);
  }
}

/**
 * Show upgrade banner at top of popup
 */
function showUpgradeBanner(subscription) {
  // Check if banner already exists
  if (document.querySelector('.upgrade-banner')) {
    return;
  }
  
  const banner = document.createElement('div');
  banner.className = 'upgrade-banner';
  banner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; margin-bottom: 16px;">
      <span style="font-size: 24px;">🚀</span>
      <div style="flex: 1;">
        <div style="font-weight: 600; color: white; font-size: 14px;">Unlock Unlimited Contacts</div>
        <div style="font-size: 12px; color: rgba(255,255,255,0.9);">You're at ${subscription.currentContactCount}/${subscription.contactLimit} contacts. Upgrade to Pro!</div>
      </div>
      <button id="upgradeBannerBtn" style="background: white; color: #667eea; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;">
        Upgrade
      </button>
    </div>
  `;
  
  const container = document.querySelector('.popup-container');
  if (container && container.firstChild) {
    container.insertBefore(banner, container.firstChild.nextSibling);
    
    banner.querySelector('#upgradeBannerBtn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_PRICING' });
    });
  }
}

/**
 * Show upgrade dialog modal
 */
function showUpgradeDialog(reason, feature) {
  const dialog = document.createElement('div');
  dialog.className = 'upgrade-dialog-overlay';
  dialog.innerHTML = `
    <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
      <div style="background: white; padding: 32px; border-radius: 16px; max-width: 400px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">⭐</div>
        <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #1e293b;">Upgrade to Continue</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">${reason}</p>
        <div style="display: flex; gap: 12px;">
          <button id="dismissUpgrade" style="flex: 1; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; font-size: 14px;">
            Maybe Later
          </button>
          <button id="goToUpgrade" style="flex: 1; padding: 12px; border: none; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; cursor: pointer; font-size: 14px;">
            View Plans
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  dialog.querySelector('#dismissUpgrade').addEventListener('click', () => {
    dialog.remove();
  });
  
  dialog.querySelector('#goToUpgrade').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_PRICING' });
    dialog.remove();
  });
}

/**
 * Check if user can perform action, show upgrade prompt if not
 */
async function checkFeatureAccess(feature, actionCallback) {
  try {
    const canAccess = await chrome.runtime.sendMessage({ 
      type: 'CHECK_FEATURE_ACCESS',
      feature
    });
    
    if (canAccess.allowed) {
      await actionCallback();
    } else {
      showUpgradeDialog(canAccess.reason, feature);
    }
  } catch (error) {
    console.error('Error checking feature access:', error);
    // Allow action on error to avoid blocking users
    await actionCallback();
  }
}

/**
 * Refresh subscription display (call this after contacts change)
 */
async function refreshSubscriptionDisplay() {
  await displaySubscriptionStatus();
}

