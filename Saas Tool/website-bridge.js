/**
 * Website Bridge - Content Script for crm-sync.net
 * Enables bidirectional communication between website and extension
 * Handles login/logout synchronization in both directions
 */

(function() {
  'use strict';
  
  console.log('🌉 CRM-Sync Website Bridge loaded');

  // Create bridge object that website can call
  const CRMSyncExtension = {
    /**
     * Notify extension that user logged in on website
     */
    notifyLogin: async function(authData) {
      try {
        console.log('📤 Website → Extension: Login notification');
        
        const response = await chrome.runtime.sendMessage({
          action: 'WEBSITE_LOGIN',
          userData: {
            token: authData.token,
            refreshToken: authData.refreshToken,
            user: authData.user
          }
        });

        if (response && response.success) {
          console.log('✅ Extension synced with website login');
        } else {
          console.warn('⚠️ Extension login sync failed:', response);
        }
      } catch (error) {
        console.error('❌ Failed to notify extension of login:', error);
      }
    },

    /**
     * Notify extension that user logged out on website
     */
    notifyLogout: async function() {
      try {
        console.log('📤 Website → Extension: Logout notification');
        
        const response = await chrome.runtime.sendMessage({
          action: 'WEBSITE_LOGOUT'
        });

        if (response && response.success) {
          console.log('✅ Extension logged out from website trigger');
        } else {
          console.warn('⚠️ Extension logout sync failed:', response);
        }
      } catch (error) {
        console.error('❌ Failed to notify extension of logout:', error);
      }
    },

    /**
     * Request extension to refresh user profile (after subscription change)
     */
    refreshProfile: async function() {
      try {
        console.log('📤 Website → Extension: Refresh profile request');
        
        const response = await chrome.runtime.sendMessage({
          action: 'REFRESH_USER_PROFILE'
        });

        if (response && response.success) {
          console.log('✅ Extension profile refreshed');
        }
      } catch (error) {
        console.error('❌ Failed to refresh extension profile:', error);
      }
    },

    /**
     * Check if extension is installed
     */
    isInstalled: function() {
      return true; // If this script is running, extension is installed
    },

    /**
     * Get extension version
     */
    getVersion: function() {
      return chrome.runtime.getManifest().version;
    }
  };

  // Inject into website's window object
  // We need to inject a script tag because content scripts have isolated contexts
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      window.CRMSyncExtension = {
        notifyLogin: function(authData) {
          window.postMessage({ 
            type: 'CRMSYNC_LOGIN', 
            data: authData 
          }, '*');
        },
        notifyLogout: function() {
          window.postMessage({ 
            type: 'CRMSYNC_LOGOUT' 
          }, '*');
        },
        refreshProfile: function() {
          window.postMessage({ 
            type: 'CRMSYNC_REFRESH_PROFILE' 
          }, '*');
        },
        isInstalled: function() {
          return true;
        },
        getVersion: function() {
          return '${chrome.runtime.getManifest().version}';
        }
      };
      
      // Dispatch event to notify website that extension is ready
      window.dispatchEvent(new CustomEvent('crmsync-extension-ready', {
        detail: { version: '${chrome.runtime.getManifest().version}' }
      }));
      
      console.log('✅ CRM-Sync Extension bridge initialized');
    })();
  `;
  (document.head || document.documentElement).appendChild(script);
  script.remove();

  // Listen for messages from website
  window.addEventListener('message', async (event) => {
    // Only accept messages from same origin
    if (event.origin !== window.location.origin) return;

    const { type, data } = event.data;

    switch (type) {
      case 'CRMSYNC_LOGIN':
        await CRMSyncExtension.notifyLogin(data);
        break;

      case 'CRMSYNC_LOGOUT':
        await CRMSyncExtension.notifyLogout();
        break;

      case 'CRMSYNC_REFRESH_PROFILE':
        await CRMSyncExtension.refreshProfile();
        break;
    }
  });

  // Listen for logout from extension
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTENSION_LOGGED_OUT') {
      console.log('📥 Extension → Website: Logout notification');
      
      // Trigger website logout by dispatching custom event
      window.dispatchEvent(new CustomEvent('crmsync-logout-from-extension'));
      
      sendResponse({ success: true });
    }
    return true;
  });

  console.log('✅ CRM-Sync Website Bridge ready');
})();
