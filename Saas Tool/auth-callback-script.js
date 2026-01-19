// Auth callback script - handles syncing auth from website to extension
(function() {
  'use strict';

  // Parse URL parameters
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const email = params.get('email');
  const name = params.get('name');
  const tier = params.get('tier') || 'free';

  const statusIcon = document.getElementById('statusIcon');
  const statusTitle = document.getElementById('statusTitle');
  const statusMessage = document.getElementById('statusMessage');
  const statusBox = document.getElementById('statusBox');
  const statusDetails = document.getElementById('statusDetails');
  const actionButtons = document.getElementById('actionButtons');

  async function syncAuthToExtension() {
    try {
      console.log('🔄 Syncing auth to extension...');
      console.log('Token:', token ? token.substring(0, 20) + '...' : 'missing');
      console.log('Email:', email);
      console.log('Name:', name);
      console.log('Tier:', tier);

      if (!token || !email) {
        throw new Error('Missing authentication data. Please try again from the website.');
      }

      // Save to extension storage
      statusDetails.innerHTML = '💾 Saving your account...';

      await chrome.storage.local.set({
        authToken: token,
        user: {
          email: email,
          name: name,
          tier: tier
        },
        isAuthenticated: true,
        lastSyncTime: Date.now()
      });

      console.log('✅ Auth saved to extension storage');

      // Fetch exclusions from backend
      statusDetails.innerHTML = '📥 Fetching your exclusions...';

      // Send message to background to fetch exclusions
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'refreshExclusions' },
          (resp) => resolve(resp)
        );
      });

      if (response && response.success) {
        console.log('✅ Exclusions fetched successfully');
        statusDetails.innerHTML = '✅ Exclusions synced!';
      } else {
        console.warn('⚠️ Could not fetch exclusions:', response?.error);
        statusDetails.innerHTML = '⚠️ Exclusions will sync later';
      }

      // Success!
      statusIcon.textContent = '✓';
      statusIcon.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      statusTitle.textContent = 'Account Synced Successfully!';
      statusMessage.textContent = 'Your CRMSYNC account is now active. You can close this tab and open the extension popup.';
      statusBox.classList.add('success');
      statusDetails.innerHTML = '<strong>✅ Logged in as ' + email + '</strong><br><small>Tier: ' + tier.toUpperCase() + '</small>';
      actionButtons.style.display = 'block';

      // Auto-close after 3 seconds
      setTimeout(() => {
        window.close();
      }, 3000);

    } catch (error) {
      console.error('❌ Sync failed:', error);

      statusIcon.textContent = '✗';
      statusIcon.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      statusIcon.style.animation = 'none';
      statusTitle.textContent = 'Sync Failed';
      statusMessage.textContent = error.message || 'Something went wrong. Please try signing in manually.';
      statusBox.classList.add('error');
      statusDetails.innerHTML = '<strong>Error:</strong> ' + error.message + '<br><small>You can sign in manually from the extension popup.</small>';
      actionButtons.style.display = 'block';
    }
  }

  // Close button handler
  document.querySelector('.btn')?.addEventListener('click', () => {
    window.close();
  });

  // Run sync on page load
  window.addEventListener('load', () => {
    syncAuthToExtension();
  });
})();
