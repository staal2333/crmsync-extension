/**
 * CRMSYNC Extension - Stripe Payment Integration
 * Handles checkout session creation and payment flow
 */

const STRIPE_PRICE_IDS = {
  PRO_MONTHLY: 'price_1SewtEFyB6BgsXQ0urEgr6hN', // Live Pro Monthly Price ID
  PRO_YEARLY: 'price_1SewtzFyB6BgsXQ028jd0Xmo',  // Live Pro Yearly Price ID
};

/**
 * Create Stripe Checkout Session
 * Opens Stripe checkout in a new tab
 * @param {string} tier - Subscription tier ('pro', 'business', etc.)
 * @param {string} interval - Billing interval ('monthly' or 'yearly')
 * @returns {Promise<void>}
 */
async function createCheckoutSession(tier = 'pro', interval = 'monthly') {
  try {
    console.log(`💳 Creating Stripe checkout for ${tier} (${interval})...`);
    
    // Get auth token
    const { authToken } = await chrome.storage.local.get(['authToken']);
    
    if (!authToken) {
      console.error('❌ Not authenticated');
      showPaymentError('Please sign in to upgrade');
      return;
    }
    
    // Determine price ID
    const priceId = interval === 'yearly' ? STRIPE_PRICE_IDS.PRO_YEARLY : STRIPE_PRICE_IDS.PRO_MONTHLY;
    
    if (priceId.includes('1234567890')) {
      // Price IDs not configured yet - redirect to website
      console.warn('⚠️ Stripe Price IDs not configured, redirecting to website');
      const websiteUrl = window.CONFIG?.WEBSITE_URL || 'https://www.crm-sync.net';
      chrome.tabs.create({ url: `${websiteUrl}/#/pricing?source=extension` });
      return;
    }
    
    // Get extension ID for return URL
    const extensionId = chrome.runtime.id;
    const successUrl = `https://${extensionId}.chromiumapp.org/payment-success.html`;
    const cancelUrl = `https://${extensionId}.chromiumapp.org/payment-cancel.html`;
    
    // Call backend to create checkout session
    const API_URL = window.CONFIG?.API_URL || 'https://crmsync-api.onrender.com/api';
    
    // Use authenticatedFetchJSON if available, fallback to regular fetch
    let data;
    if (typeof authenticatedFetchJSON === 'function') {
      data = await authenticatedFetchJSON(`${API_URL}/subscription/create-checkout`, {
        method: 'POST',
        body: JSON.stringify({
          priceId,
          tier,
          successUrl,
          cancelUrl
        })
      });
    } else {
      const response = await fetch(`${API_URL}/subscription/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          priceId,
          tier,
          successUrl,
          cancelUrl
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }
      
      data = await response.json();
    }
    
    console.log('✅ Checkout session created:', data.sessionId);
    
    // Open Stripe Checkout in new tab
    if (data.url) {
      chrome.tabs.create({ url: data.url });
      
      // Show success message in popup
      showPaymentMessage('Opening payment page...', 'success');
      
      // Set up listener for successful payment
      setupPaymentSuccessListener();
    } else {
      throw new Error('No checkout URL returned');
    }
    
  } catch (error) {
    console.error('❌ Checkout error:', error);
    showPaymentError(error.message || 'Failed to start checkout');
  }
}

/**
 * Set up listener for payment success
 * Listens for messages from payment-success.html
 */
function setupPaymentSuccessListener() {
  // Remove existing listener if any
  if (window._paymentListener) {
    chrome.runtime.onMessage.removeListener(window._paymentListener);
  }
  
  // Create new listener
  window._paymentListener = async (message, sender, sendResponse) => {
    if (message.type === 'PAYMENT_SUCCESS') {
      console.log('🎉 Payment successful! Syncing user tier...');
      
      // Sync user tier from backend
      if (window.CRMSyncAuth && window.CRMSyncAuth.syncUserTier) {
        try {
          const result = await window.CRMSyncAuth.syncUserTier();
          
          if (result.changed) {
            console.log(`✅ Tier updated: ${result.tier}`);
            showPaymentMessage('🎉 Welcome to Pro! Your account has been upgraded.', 'success', 5000);
            
            // Reload popup to show new tier
            if (typeof loadDashboard === 'function') {
              await loadDashboard();
            } else {
              // Fallback: reload the popup
              window.location.reload();
            }
          }
        } catch (error) {
          console.error('Failed to sync tier:', error);
        }
      }
      
      sendResponse({ success: true });
    }
  };
  
  chrome.runtime.onMessage.addListener(window._paymentListener);
}

/**
 * Open Stripe Customer Portal
 * Allows users to manage subscription, update payment method, etc.
 */
async function openCustomerPortal() {
  try {
    console.log('🔧 Opening Stripe Customer Portal...');
    
    const { authToken } = await chrome.storage.local.get(['authToken']);
    
    if (!authToken) {
      showPaymentError('Please sign in to manage subscription');
      return;
    }
    
    const API_URL = window.CONFIG?.API_URL || 'https://crmsync-api.onrender.com/api';
    
    // Use authenticatedFetchJSON if available
    let data;
    if (typeof authenticatedFetchJSON === 'function') {
      data = await authenticatedFetchJSON(`${API_URL}/subscription/create-portal`, {
        method: 'POST'
      });
    } else {
      const response = await fetch(`${API_URL}/subscription/create-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to open portal');
      }
      
      data = await response.json();
    }
    
    if (data && data.url) {
      chrome.tabs.create({ url: data.url });
      showPaymentMessage('Opening billing portal...', 'success');
    }
    
  } catch (error) {
    console.error('❌ Portal error:', error);
    showPaymentError(error.message || 'Failed to open billing portal');
  }
}

/**
 * Show payment-related message in popup
 */
function showPaymentMessage(message, type = 'info', duration = 3000) {
  // Try to use existing notification system
  if (typeof showNotification === 'function') {
    showNotification(message, type);
    return;
  }
  
  // Fallback: Create simple toast
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    animation: slideDown 0.3s ease;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Show payment error
 */
function showPaymentError(message) {
  showPaymentMessage(message, 'error', 4000);
}

/**
 * Initialize payment buttons
 * Call this when popup loads
 */
function initializePaymentButtons() {
  console.log('💳 Initializing payment buttons...');
  
  // Upgrade button in limit warning banner
  const upgradeBtn = document.getElementById('upgradeLimitBtn');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('💳 Upgrade button clicked (banner)');
      createCheckoutSession('pro', 'monthly');
    });
  }
  
  // Upgrade button in subscription section
  const upgradeProBtn = document.getElementById('upgradeProBtn');
  if (upgradeProBtn) {
    upgradeProBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('💳 Upgrade to Pro button clicked (subscription)');
      createCheckoutSession('pro', 'monthly');
    });
  }
  
  // Manage billing button in subscription section
  const manageBillingBtn = document.getElementById('manageBillingBtn');
  if (manageBillingBtn) {
    manageBillingBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('💳 Manage Billing button clicked');
      openCustomerPortal();
    });
  }
  
  console.log('✅ Payment buttons initialized');
}

// Export functions for use in popup.js
if (typeof window !== 'undefined') {
  window.CRMSyncPayment = {
    createCheckoutSession,
    openCustomerPortal,
    initializePaymentButtons,
    setupPaymentSuccessListener
  };
}
