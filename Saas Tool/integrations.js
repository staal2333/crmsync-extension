// =====================================================
// CRM INTEGRATIONS MANAGER
// =====================================================
// Handles HubSpot and Salesforce integrations

class IntegrationManager {
  constructor() {
    this.apiUrl = 'https://crmsync-api.onrender.com/api/integrations';
    this.statusCache = {
      hubspot: null,
      salesforce: null,
      lastChecked: null
    };
    
    console.log('🔌 Integration Manager initialized');
  }
  
  // =====================================================
  // INITIALIZATION
  // =====================================================
  
  async init() {
    console.log('🔌 Initializing integrations...');
    
    try {
      await this.checkIntegrationStatus();
      await this.loadAutoSyncSetting();
      this.setupEventListeners();
      this.setupHistoryListeners();
      this.renderSyncHistory();
      console.log('✅ Integrations initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize integrations:', error);
    }
  }
  
  async loadAutoSyncSetting() {
    try {
      const settings = await chrome.storage.sync.get(['autoSyncEnabled']);
      const autoSyncToggle = document.getElementById('autoSyncEnabled');
      if (autoSyncToggle) {
        autoSyncToggle.checked = settings.autoSyncEnabled || false;
        autoSyncToggle.addEventListener('change', (e) => {
          chrome.storage.sync.set({ autoSyncEnabled: e.target.checked });
          this.showNotification(
            e.target.checked ? 'Auto-sync enabled' : 'Auto-sync disabled',
            'success'
          );
        });
      }
    } catch (error) {
      console.error('❌ Failed to load auto-sync setting:', error);
    }
  }
  
  setupEventListeners() {
    // HubSpot buttons
    const hubspotConnectBtn = document.getElementById('hubspot-connect-btn');
    const hubspotDisconnectBtn = document.getElementById('hubspot-disconnect-btn');
    const hubspotSyncBtn = document.getElementById('hubspot-sync-all-btn');
    const hubspotPullBtn = document.getElementById('hubspot-pull-contacts-btn');
    const hubspotViewDetails = document.getElementById('hubspot-view-details');
    
    if (hubspotConnectBtn) {
      hubspotConnectBtn.addEventListener('click', () => this.connectIntegration('hubspot'));
    }
    
    if (hubspotDisconnectBtn) {
      hubspotDisconnectBtn.addEventListener('click', () => this.disconnectIntegration('hubspot'));
    }
    
    if (hubspotSyncBtn) {
      hubspotSyncBtn.addEventListener('click', () => this.syncAllContacts('hubspot'));
    }
    
    if (hubspotPullBtn) {
      hubspotPullBtn.addEventListener('click', () => this.pullFromHubSpot());
    }
    
    if (hubspotViewDetails) {
      hubspotViewDetails.addEventListener('click', () => this.showSyncDetailsModal('hubspot'));
    }
    
    // Salesforce buttons
    const salesforceConnectBtn = document.getElementById('salesforce-connect-btn');
    const salesforceDisconnectBtn = document.getElementById('salesforce-disconnect-btn');
    const salesforceSyncBtn = document.getElementById('salesforce-sync-all-btn');
    const salesforceViewDetails = document.getElementById('salesforce-view-details');
    
    if (salesforceConnectBtn) {
      salesforceConnectBtn.addEventListener('click', () => this.connectIntegration('salesforce'));
    }
    
    if (salesforceDisconnectBtn) {
      salesforceDisconnectBtn.addEventListener('click', () => this.disconnectIntegration('salesforce'));
    }
    
    if (salesforceSyncBtn) {
      salesforceSyncBtn.addEventListener('click', () => this.syncAllContacts('salesforce'));
    }
    
    if (salesforceViewDetails) {
      salesforceViewDetails.addEventListener('click', () => this.showSyncDetailsModal('salesforce'));
    }
    
    // Listen for OAuth success messages from popup windows
    window.addEventListener('message', (event) => {
      if (event.data.type === 'HUBSPOT_CONNECTED') {
        this.handleConnectionSuccess('hubspot');
      } else if (event.data.type === 'SALESFORCE_CONNECTED') {
        this.handleConnectionSuccess('salesforce');
      }
    });
    
    console.log('✅ Event listeners set up');
  }
  
  // =====================================================
  // CONNECTION MANAGEMENT
  // =====================================================
  
  async connectIntegration(platform) {
    try {
      console.log(`🔌 Connecting ${platform}...`);
      
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        this.showNotification('Please sign in first', 'error');
        return;
      }
      
      // Check user tier - Pro required for CRM integrations
      const { user } = await chrome.storage.local.get(['user']);
      if (user) {
        const tier = user.subscriptionTier || user.tier || 'free';
        if (tier.toLowerCase() === 'free') {
          // Show upgrade modal for free users
          this.showUpgradeModal(platform);
          return;
        }
      }
      
      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = (screen.width / 2) - (width / 2);
      const top = (screen.height / 2) - (height / 2);
      
      const authWindow = window.open(
        `${this.apiUrl}/${platform}/connect?token=${token}`,
        `Connect ${platform}`,
        `width=${width},height=${height},top=${top},left=${left},popup=yes`
      );
      
      // Check if popup was blocked
      if (!authWindow || authWindow.closed || typeof authWindow.closed === 'undefined') {
        this.showNotification('Please allow popups for this site', 'error');
        return;
      }
      
      console.log(`✅ OAuth window opened for ${platform}`);
      
      // Poll for connection status while window is open
      const pollInterval = setInterval(async () => {
        // Check if window is closed
        if (authWindow.closed) {
          clearInterval(pollInterval);
          console.log(`🔍 OAuth window closed, checking ${platform} connection status...`);
          await this.handleConnectionSuccess(platform);
        }
      }, 1000); // Check every second
    } catch (error) {
      console.error(`❌ Failed to connect ${platform}:`, error);
      this.showNotification(`Failed to connect ${platform}`, 'error');
    }
  }
  
  async disconnectIntegration(platform) {
    if (!confirm(`Are you sure you want to disconnect ${platform}? Your contacts won't be synced anymore.`)) {
      return;
    }
    
    try {
      console.log(`🔌 Disconnecting ${platform}...`);
      
      const token = await window.CRMSyncAuth.getAuthToken();
      
      const response = await fetch(`${this.apiUrl}/${platform}/disconnect`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        this.updateIntegrationUI(platform, false);
        this.statusCache[platform] = null;
        this.showNotification(`${platform} disconnected successfully`, 'success');
        console.log(`✅ ${platform} disconnected`);
        
        // Refresh contact list to remove badges
        if (window.loadContacts) {
          window.loadContacts();
        }
      } else {
        throw new Error('Disconnect failed');
      }
    } catch (error) {
      console.error(`❌ Failed to disconnect ${platform}:`, error);
      this.showNotification(`Failed to disconnect ${platform}`, 'error');
    }
  }
  
  // =====================================================
  // SYNC OPERATIONS
  // =====================================================
  
  async syncAllContacts(platform) {
    // Get the sync button and show loading state
    const syncBtn = document.getElementById(`${platform}-sync-all-btn`);
    const originalHTML = syncBtn ? syncBtn.innerHTML : '';
    
    try {
      console.log(`⬆️ Pushing contacts to ${platform}...`);
      
      // Show loading state on button
      if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<span class="button-spinner"></span> Syncing...';
      }
      
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        this.showNotification('Please sign in first', 'error');
        return;
      }
      
      this.showNotification(`Syncing contacts to ${platform}...`, 'info');
      
      // Use the sync.js manager if available
      if (window.syncManager) {
        await window.syncManager.manualSync();
        this.showNotification(`Successfully synced to ${platform}!`, 'success');
      } else {
        this.showNotification('Sync manager not available', 'error');
      }
    } catch (error) {
      console.error(`❌ Failed to sync to ${platform}:`, error);
      this.showNotification(`Failed to sync to ${platform}: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      // Reset button state
      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.innerHTML = originalHTML;
      }
    }
  }
  
  async pullFromHubSpot() {
    try {
      console.log('⬇️ Pulling contacts from HubSpot...');
      
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        this.showNotification('Please sign in first', 'error');
        return;
      }
      
      // Show loading state
      const pullBtn = document.getElementById('hubspot-pull-contacts-btn');
      const originalHTML = pullBtn ? pullBtn.innerHTML : '';
      
      if (pullBtn) {
        pullBtn.disabled = true;
        pullBtn.innerHTML = '<span>⏳ Syncing...</span>';
      }
      
      // Trigger the background script to sync
      chrome.runtime.sendMessage({ 
        action: 'TRIGGER_HUBSPOT_SYNC', 
        token 
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Message error:', chrome.runtime.lastError);
          this.showNotification('Failed to trigger HubSpot sync', 'error');
          
          // Reset button
          if (pullBtn) {
            pullBtn.disabled = false;
            pullBtn.innerHTML = originalHTML;
          }
          return;
        }
        
        console.log('✅ HubSpot sync triggered:', response);
        
        // Reset button after 3 seconds
        setTimeout(() => {
          if (pullBtn) {
            pullBtn.disabled = false;
            pullBtn.innerHTML = originalHTML;
          }
          
          this.showNotification('Contacts pulled from HubSpot!', 'success');
          
          // Reload contacts
          if (window.loadAllContacts) {
            window.loadAllContacts();
          }
        }, 3000);
      });
    } catch (error) {
      console.error('❌ Failed to pull from HubSpot:', error);
      this.showNotification('Failed to pull from HubSpot', 'error');
      
      // Reset button
      const pullBtn = document.getElementById('hubspot-pull-contacts-btn');
      if (pullBtn) {
        pullBtn.disabled = false;
        pullBtn.innerHTML = '<span>⬇️ Pull from HubSpot</span>';
      }
    }
  }
  
  // =====================================================
  // CONNECTION SUCCESS HANDLING
  // =====================================================
  
  async handleConnectionSuccess(platform) {
    console.log(`✅ ${platform} connection callback received`);
    
    // Poll for connection status (since postMessage doesn't work with CSP)
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkStatus = async () => {
      attempts++;
      console.log(`🔍 Checking ${platform} status (attempt ${attempts})...`);
      
      try {
        await this.checkIntegrationStatus();
        
        // Check if connected
        if (this.statusCache[platform]?.connected) {
          this.showNotification(`${platform} connected successfully!`, 'success');
          
          // Refresh contact list to show badges
          if (window.loadContacts) {
            window.loadContacts();
          }
          
          // Trigger initial sync
          setTimeout(() => {
            this.syncAllContacts(platform);
          }, 1000);
          
          return true;
        }
        
        // Try again if not connected yet and haven't exceeded max attempts
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000); // Check every 2 seconds
        } else {
          this.showNotification(`${platform} connection may have succeeded, please reload the extension`, 'info');
        }
      } catch (error) {
        console.error(`❌ Error checking ${platform} status:`, error);
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
        }
      }
    };
    
    // Start checking after a short delay
    setTimeout(checkStatus, 1000);
  }
  
  // =====================================================
  // STATUS CHECKING
  // =====================================================
  
  async checkIntegrationStatus(forceRefresh = false) {
    try {
      // Cache status for 30 seconds to prevent excessive API calls
      const CACHE_DURATION = 30000; // 30 seconds
      const now = Date.now();
      
      if (!forceRefresh && this.statusCache.lastChecked) {
        const timeSinceLastCheck = now - this.statusCache.lastChecked.getTime();
        if (timeSinceLastCheck < CACHE_DURATION) {
          console.log(`⚡ Using cached integration status (${Math.round(timeSinceLastCheck/1000)}s old)`);
          // Still update UI with cached data
          if (this.statusCache.hubspot) {
            this.updateIntegrationUI('hubspot', this.statusCache.hubspot.connected, this.statusCache.hubspot);
          }
          if (this.statusCache.salesforce) {
            this.updateIntegrationUI('salesforce', this.statusCache.salesforce.connected, this.statusCache.salesforce);
          }
          return;
        }
      }
      
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        console.log('⚠️ No auth token available for integration check');
        return;
      }
      
      console.log('🔄 Fetching fresh integration status...');
      
      // Check HubSpot with error handling
      try {
        const hubspotResponse = await fetch(`${this.apiUrl}/hubspot/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (hubspotResponse.status === 401 || hubspotResponse.status === 403) {
          console.warn('⚠️ HubSpot integration expired, clearing connection');
          
          // Detect if this is a JWT token expiry (not just CRM token)
          if (hubspotResponse.status === 403) {
            await this.handleSessionExpiry('HubSpot API returned 403 - JWT token likely expired');
          }
          
          this.statusCache.hubspot = { connected: false };
          this.updateIntegrationUI('hubspot', false, {});
        } else if (hubspotResponse.status === 429) {
          console.warn('⚠️ Rate limited on HubSpot status check, using cached data');
          // Keep using cached data, don't update
          if (this.statusCache.hubspot) {
            this.updateIntegrationUI('hubspot', this.statusCache.hubspot.connected, this.statusCache.hubspot);
          }
        } else if (hubspotResponse.ok) {
          const hubspotData = await hubspotResponse.json();
          this.statusCache.hubspot = hubspotData;
          this.updateIntegrationUI('hubspot', hubspotData.connected, hubspotData);
        } else {
          console.error(`❌ HubSpot status check failed: ${hubspotResponse.status}`);
          this.statusCache.hubspot = { connected: false };
          this.updateIntegrationUI('hubspot', false, {});
        }
      } catch (error) {
        console.error('❌ HubSpot status check error:', error);
        // Use cached data if available
        if (this.statusCache.hubspot) {
          this.updateIntegrationUI('hubspot', this.statusCache.hubspot.connected, this.statusCache.hubspot);
        } else {
          this.statusCache.hubspot = { connected: false };
          this.updateIntegrationUI('hubspot', false, {});
        }
      }
      
      // Check Salesforce with error handling
      try {
        const salesforceResponse = await fetch(`${this.apiUrl}/salesforce/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (salesforceResponse.status === 401 || salesforceResponse.status === 403) {
          console.warn('⚠️ Salesforce integration expired, clearing connection');
          this.statusCache.salesforce = { connected: false };
          this.updateIntegrationUI('salesforce', false, {});
        } else if (salesforceResponse.status === 429) {
          console.warn('⚠️ Rate limited on Salesforce status check, using cached data');
          // Keep using cached data, don't update
          if (this.statusCache.salesforce) {
            this.updateIntegrationUI('salesforce', this.statusCache.salesforce.connected, this.statusCache.salesforce);
          }
        } else if (salesforceResponse.ok) {
          const salesforceData = await salesforceResponse.json();
          this.statusCache.salesforce = salesforceData;
          this.updateIntegrationUI('salesforce', salesforceData.connected, salesforceData);
        } else {
          console.error(`❌ Salesforce status check failed: ${salesforceResponse.status}`);
          this.statusCache.salesforce = { connected: false };
          this.updateIntegrationUI('salesforce', false, {});
        }
      } catch (error) {
        console.error('❌ Salesforce status check error:', error);
        // Use cached data if available
        if (this.statusCache.salesforce) {
          this.updateIntegrationUI('salesforce', this.statusCache.salesforce.connected, this.statusCache.salesforce);
        } else {
          this.statusCache.salesforce = { connected: false };
          this.updateIntegrationUI('salesforce', false, {});
        }
      }
      
      this.statusCache.lastChecked = new Date();
      console.log('✅ Integration status updated');
      
      // Show/hide sync sections based on connection status
      const anyConnected = this.statusCache.hubspot?.connected || this.statusCache.salesforce?.connected;
      const syncRulesSection = document.getElementById('sync-rules-section');
      const syncStatusSection = document.getElementById('sync-status-section');
      
      if (syncRulesSection) {
        syncRulesSection.style.display = anyConnected ? 'block' : 'none';
      }
      if (syncStatusSection) {
        syncStatusSection.style.display = anyConnected ? 'block' : 'none';
      }
    } catch (error) {
      console.error('❌ Failed to check integration status:', error);
      
      // If auth error (403), clear tokens and show error
      if (error.message && error.message.includes('403')) {
        console.warn('🔐 Token expired - user needs to re-login');
        // Show toast notification
        if (typeof showToast === 'function') {
          showToast('Session expired. Please sign in again.', true);
        }
      }
    }
  }
  
  async updateSyncStatusOverview(platform, connected, data = {}) {
    // Update overview cards at top
    const overviewCard = document.getElementById(`${platform}-overview-card`);
    const overviewStatus = document.getElementById(`${platform}-overview-status`);
    const overviewCount = document.getElementById(`${platform}-overview-count`);
    
    if (overviewStatus) {
      if (connected) {
        overviewStatus.innerHTML = '<span style="color: #22c55e; font-weight: 500;">● Connected</span>';
        if (overviewCount) {
          overviewCount.style.display = 'block';
        }
      } else {
        overviewStatus.innerHTML = '<span style="color: #94a3b8;">○ Not connected</span>';
        if (overviewCount) {
          overviewCount.style.display = 'none';
        }
      }
    }
    
    // Calculate sync status from all contacts
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getContacts' });
      if (response && response.contacts) {
        const allContacts = response.contacts;
        
        const syncedCount = allContacts.filter(c => 
          c.crmMappings && c.crmMappings[platform]
        ).length;
        
        const notSyncedCount = allContacts.filter(c => 
          !c.crmMappings || !c.crmMappings[platform]
        ).length;
        
        const pendingCount = 0; // Could track pending pushes here
        
        // Update overview count
        if (overviewCount && connected) {
          const countDiv = overviewCount.querySelector('div');
          if (countDiv) {
            countDiv.textContent = syncedCount;
          }
        }
        
        // Update detailed sync status cards
        const syncStatusCard = document.getElementById(`${platform}-sync-status-card`);
        if (syncStatusCard && connected) {
          syncStatusCard.style.display = 'block';
          
          const syncedEl = document.getElementById(`${platform}-synced-count`);
          const pendingEl = document.getElementById(`${platform}-pending-count`);
          const notSyncedEl = document.getElementById(`${platform}-not-synced-count`);
          
          if (syncedEl) syncedEl.textContent = syncedCount;
          if (pendingEl) pendingEl.textContent = pendingCount;
          if (notSyncedEl) notSyncedEl.textContent = notSyncedCount;
        } else if (syncStatusCard) {
          syncStatusCard.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error calculating sync status:', error);
    }
  }
  
  updateIntegrationUI(platform, connected, data = {}) {
    const statusEl = document.getElementById(`${platform}-status`);
    const accountEl = document.getElementById(`${platform}-account`);
    const connectBtn = document.getElementById(`${platform}-connect-btn`);
    const disconnectBtn = document.getElementById(`${platform}-disconnect-btn`);
    const syncBtn = document.getElementById(`${platform}-sync-all-btn`);
    const pullBtn = document.getElementById(`${platform}-pull-contacts-btn`);
    const statsContainer = document.getElementById(`${platform}-stats`);
    const lastSyncEl = document.getElementById(`${platform}-last-sync`);
    const countEl = document.getElementById(`${platform}-count`);
    const syncStatusEl = document.getElementById(`${platform}-sync-status`);
    
    // Update overview cards
    this.updateSyncStatusOverview(platform, connected, data);
    
    if (connected) {
      // Connected state
      if (statusEl) {
        statusEl.innerHTML = '<span style="color: #10B981;">✓ Connected</span>';
      }
      
      // Show account info
      if (accountEl && data.accountName) {
        accountEl.textContent = data.accountName;
        accountEl.style.display = 'block';
      }
      
      if (connectBtn) connectBtn.classList.add('hidden');
      if (disconnectBtn) disconnectBtn.classList.remove('hidden');
      if (syncBtn) syncBtn.classList.remove('hidden');
      if (pullBtn) pullBtn.classList.remove('hidden');
      if (statsContainer) statsContainer.classList.remove('hidden');
      
      // Update last sync time
      if (lastSyncEl) {
        if (data.lastSync) {
          const lastSyncDate = new Date(data.lastSync);
          const now = new Date();
          const diffMs = now - lastSyncDate;
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);
          
          let timeAgo;
          if (diffMins < 1) timeAgo = 'Just now';
          else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
          else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
          else if (diffDays < 7) timeAgo = `${diffDays}d ago`;
          else timeAgo = lastSyncDate.toLocaleDateString();
          
          lastSyncEl.textContent = timeAgo;
        } else {
          lastSyncEl.textContent = 'Never';
        }
      }
      
      // Update contact count
      if (countEl) {
        const count = data.syncedContactsCount || 0;
        countEl.textContent = count.toLocaleString();
      }
      
      // Update sync status
      if (syncStatusEl) {
        syncStatusEl.innerHTML = '<span class="status-badge status-idle">Idle</span>';
      }
    } else {
      // Disconnected state
      if (statusEl) {
        statusEl.innerHTML = '<span style="color: #6B7280;">Not connected</span>';
      }
      if (accountEl) accountEl.style.display = 'none';
      if (connectBtn) connectBtn.classList.remove('hidden');
      if (disconnectBtn) disconnectBtn.classList.add('hidden');
      if (syncBtn) syncBtn.classList.add('hidden');
      if (pullBtn) pullBtn.classList.add('hidden');
      if (statsContainer) statsContainer.classList.add('hidden');
    }
  }
  
  // =====================================================
  // SYNC OPERATIONS
  // =====================================================
  
  async checkDuplicate(email, platform) {
    try {
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${this.apiUrl}/${platform}/check-duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      // Handle rate limiting
      if (response.status === 429) {
        console.warn('⚠️ Rate limited, skipping duplicate check');
        return { isDuplicate: false }; // Assume not duplicate if rate limited
      }
      
      if (!response.ok) {
        throw new Error('Duplicate check failed');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`❌ Failed to check duplicate in ${platform}:`, error);
      return { isDuplicate: false };
    }
  }
  
  async syncContact(contact, platform) {
    try {
      console.log(`🔄 Syncing contact to ${platform}:`, contact.email);
      
      // Check for duplicates first
      const duplicateCheck = await this.checkDuplicate(contact.email, platform);
      
      if (duplicateCheck.isDuplicate) {
        const platformName = platform === 'hubspot' ? 'HubSpot' : 'Salesforce';
        const existingContact = duplicateCheck.contact;
        const name = `${existingContact.firstName || ''} ${existingContact.lastName || ''}`.trim() || existingContact.email;
        
        const confirmUpdate = confirm(
          `⚠️ Duplicate Found!\n\n` +
          `"${name}" already exists in ${platformName}.\n` +
          `Email: ${existingContact.email}\n` +
          `Company: ${existingContact.company || 'N/A'}\n\n` +
          `Do you want to update the existing contact?`
        );
        
        if (!confirmUpdate) {
          console.log('❌ User cancelled sync due to duplicate');
          this.showNotification('Sync cancelled - duplicate detected', 'info');
          return { skipped: true };
        }
      }
      
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Prepare contact data - support both camelCase and snake_case
      const firstName = contact.firstName || contact.first_name || '';
      const lastName = contact.lastName || contact.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim() || contact.email;
      
      const contactData = {
        id: contact.id,
        email: contact.email,
        name: fullName,
        firstName: firstName,
        lastName: lastName,
        company: contact.company,
        title: contact.title,
        phone: contact.phone,
        linkedin: contact.linkedin,
        status: contact.status
      };
      
      const response = await fetch(`${this.apiUrl}/${platform}/sync-contact`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contact: contactData })
      });
      
      if (!response.ok) {
        // Handle specific error cases
        const platformName = platform === 'hubspot' ? 'HubSpot' : 'Salesforce';
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        } else if (response.status === 401) {
          throw new Error(`${platformName} connection expired. Please reconnect in the CRM tab.`);
        } else if (response.status === 403) {
          throw new Error(`${platformName} access forbidden. Please reconnect in the CRM tab.`);
        }
        
        const error = await response.json();
        throw new Error(error.error || `Failed to push to ${platform}`);
      }
      
      const result = await response.json();
      
      // Update local contact with CRM mapping
      await this.updateContactCRMMapping(contact.email, platform, result);
      
      // Log to history
      await this.addSyncHistory(platform, contact, 'push', 'success');
      
      // Show success notification
      const actionText = result.action === 'create' ? 'added to' : 'updated in';
      const platformName = platform === 'hubspot' ? 'HubSpot' : 'Salesforce';
      this.showNotification(`✓ Contact ${actionText} ${platformName}`, 'success');
      
      console.log(`✅ Contact synced to ${platform}:`, result);
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to sync to ${platform}:`, error);
      
      // Log to history
      await this.addSyncHistory(platform, contact, 'push', 'error', error);
      
      const platformName = platform === 'hubspot' ? 'HubSpot' : 'Salesforce';
      this.showNotification(`Failed to push to ${platformName}: ${error.message}`, 'error');
      throw error;
    }
  }
  
  async updateContactCRMMapping(email, platform, syncResult) {
    try {
      // Update contact in storage with CRM mapping
      const { contacts } = await chrome.storage.local.get(['contacts']);
      if (!contacts) return;
      
      const contactIndex = contacts.findIndex(c => c.email === email);
      if (contactIndex === -1) return;
      
      // Initialize crmMappings if not exists
      if (!contacts[contactIndex].crmMappings) {
        contacts[contactIndex].crmMappings = {};
      }
      
      // Store CRM ID and sync timestamp
      contacts[contactIndex].crmMappings[platform] = {
        id: syncResult.contactId || syncResult.id,
        syncedAt: new Date().toISOString(),
        action: syncResult.action || 'create'
      };
      
      // Save back to storage
      await chrome.storage.local.set({ contacts });
      
      console.log(`✅ Updated CRM mapping for ${email} in ${platform}`);
    } catch (error) {
      console.error('Error updating CRM mapping:', error);
    }
  }
  
  async syncAllContacts(platform) {
    try {
      console.log(`🔄 Syncing all contacts from ${platform}...`);
      
      // Get UI elements
      const syncBtn = document.getElementById(`${platform}-sync-all-btn`);
      const progressContainer = document.getElementById(`${platform}-progress`);
      const progressFill = document.getElementById(`${platform}-progress-fill`);
      const progressText = document.getElementById(`${platform}-progress-text`);
      const syncStatusEl = document.getElementById(`${platform}-sync-status`);
      
      // Show loading state
      const originalText = syncBtn ? syncBtn.textContent : '';
      if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.textContent = '🔄 Syncing...';
      }
      
      // Show progress bar
      if (progressContainer) {
        progressContainer.classList.remove('hidden');
      }
      if (progressFill) {
        progressFill.style.width = '20%';
      }
      if (progressText) {
        progressText.textContent = 'Connecting to CRM...';
      }
      
      // Update status badge
      if (syncStatusEl) {
        syncStatusEl.innerHTML = '<span class="status-badge status-syncing">Syncing</span>';
      }
      
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Update progress
      if (progressFill) {
        progressFill.style.width = '40%';
      }
      if (progressText) {
        progressText.textContent = 'Fetching contacts...';
      }
      
      const response = await fetch(`${this.apiUrl}/${platform}/sync-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }
      
      // Update progress
      if (progressFill) {
        progressFill.style.width = '70%';
      }
      if (progressText) {
        progressText.textContent = 'Mapping contacts...';
      }
      
      const result = await response.json();
      
      // Complete progress
      if (progressFill) {
        progressFill.style.width = '100%';
      }
      if (progressText) {
        progressText.textContent = `✓ Synced ${result.mappedContacts} contacts!`;
      }
      
      // Show success notification
      this.showNotification(
        `✓ Synced ${result.mappedContacts} contacts from ${platform}`,
        'success'
      );
      
      console.log(`✅ All contacts synced from ${platform}:`, result);
      
      // Update status badge
      if (syncStatusEl) {
        syncStatusEl.innerHTML = '<span class="status-badge status-success">Success</span>';
      }
      
      // Wait a moment before hiding progress
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Hide progress bar
      if (progressContainer) {
        progressContainer.classList.add('hidden');
      }
      
      // Reset status badge
      if (syncStatusEl) {
        syncStatusEl.innerHTML = '<span class="status-badge status-idle">Idle</span>';
      }
      
      // Refresh status to update last sync time
      await this.checkIntegrationStatus();
      
      // Refresh contact list to show badges
      if (window.loadContacts) {
        window.loadContacts();
      }
      
      // Restore button state
      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.textContent = originalText;
      }
    } catch (error) {
      console.error(`❌ Failed to sync all from ${platform}:`, error);
      this.showNotification(`Sync failed: ${error.message}`, 'error');
      
      // Show error state
      const progressContainer = document.getElementById(`${platform}-progress`);
      const progressText = document.getElementById(`${platform}-progress-text`);
      const syncStatusEl = document.getElementById(`${platform}-sync-status`);
      
      if (progressText) {
        progressText.textContent = `❌ ${error.message}`;
      }
      
      if (syncStatusEl) {
        syncStatusEl.innerHTML = '<span class="status-badge status-error">Error</span>';
      }
      
      // Wait before hiding
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (progressContainer) {
        progressContainer.classList.add('hidden');
      }
      
      if (syncStatusEl) {
        syncStatusEl.innerHTML = '<span class="status-badge status-idle">Idle</span>';
      }
      
      // Restore button state
      const syncBtn = document.getElementById(`${platform}-sync-all-btn`);
      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.textContent = '🔄 Sync All Contacts';
      }
    }
  }
  
  /**
   * Pull contacts FROM HubSpot (auto-sync)
   * Triggers the background service worker to fetch and merge contacts
   */
  async pullFromHubSpot() {
    try {
      console.log('⬇️ Pulling contacts from HubSpot...');
      
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        this.showNotification('Please sign in first', 'error');
        return;
      }
      
      // Show loading notification
      this.showNotification('🔄 Fetching contacts from HubSpot...', 'info');
      
      // Get pull button
      const pullBtn = document.getElementById('hubspot-pull-contacts-btn');
      const originalText = pullBtn ? pullBtn.innerHTML : '';
      
      if (pullBtn) {
        pullBtn.disabled = true;
        pullBtn.innerHTML = '<span>⏳ Syncing...</span>';
      }
      
      // Get current contact count for stats
      const beforeSync = await chrome.storage.local.get(['contacts']);
      const beforeCount = (beforeSync.contacts || []).length;
      
      // Set up a timeout in case the message never gets a response
      const messageTimeout = setTimeout(() => {
        console.warn('⚠️ Sync message timed out after 30 seconds');
        this.showNotification('Sync is taking longer than expected...', 'warning');
        
        // Check if sync actually completed by monitoring storage
        const checkInterval = setInterval(async () => {
          const afterSync = await chrome.storage.local.get(['contacts', 'hubSpotSyncStats']);
          const afterCount = (afterSync.contacts || []).length;
          
          if (afterCount !== beforeCount) {
            clearInterval(checkInterval);
            console.log('✅ Sync detected via storage change!');
            
            const stats = afterSync.hubSpotSyncStats || {};
            const newContacts = stats.newContacts || (afterCount - beforeCount);
            const updatedContacts = stats.updatedContacts || 0;
            
            this.showNotification(
              `✅ Synced: ${newContacts} new, ${updatedContacts} updated`, 
              'success'
            );
            
            if (pullBtn) {
              pullBtn.disabled = false;
              pullBtn.innerHTML = originalText;
            }
            
            if (window.loadAllContacts) {
              await window.loadAllContacts();
            }
            
            await this.checkIntegrationStatus();
          }
        }, 2000); // Check every 2 seconds
        
        // Stop checking after 60 seconds total
        setTimeout(() => {
          clearInterval(checkInterval);
          if (pullBtn && pullBtn.disabled) {
            pullBtn.disabled = false;
            pullBtn.innerHTML = originalText;
            this.showNotification('Sync may have failed - check console', 'error');
          }
        }, 30000);
      }, 30000); // 30 second timeout
      
      // Send message to background script to trigger sync
      chrome.runtime.sendMessage({
        action: 'TRIGGER_HUBSPOT_SYNC',
        token
      }, async (response) => {
        clearTimeout(messageTimeout); // Cancel timeout if we get a response
        
        if (chrome.runtime.lastError) {
          console.error('Error triggering sync:', chrome.runtime.lastError);
          this.showNotification('Failed to start sync: ' + chrome.runtime.lastError.message, 'error');
          
          if (pullBtn) {
            pullBtn.disabled = false;
            pullBtn.innerHTML = originalText;
          }
          return;
        }
        
        console.log('✅ HubSpot sync response:', response);
        
        // Get updated contact count
        const afterSync = await chrome.storage.local.get(['contacts', 'hubSpotSyncStats']);
        const afterCount = (afterSync.contacts || []).length;
        const stats = afterSync.hubSpotSyncStats || {};
        
        // Calculate actual new contacts
        const newContacts = stats.newContacts || (afterCount - beforeCount);
        const updatedContacts = stats.updatedContacts || 0;
        
        // Show completion message with stats
        if (newContacts > 0 || updatedContacts > 0) {
          this.showNotification(
            `✅ Synced: ${newContacts} new, ${updatedContacts} updated`, 
            'success'
          );
        } else {
          this.showNotification('✅ Sync complete - all contacts up to date', 'success');
        }
        
        // Re-enable button
        if (pullBtn) {
          pullBtn.disabled = false;
          pullBtn.innerHTML = originalText;
        }
        
        // Refresh contacts display
        if (window.loadAllContacts) {
          await window.loadAllContacts();
        }
        
        // Update integration status to show sync stats
        await this.checkIntegrationStatus();
      });
      
    } catch (error) {
      console.error('❌ Pull from HubSpot error:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
      
      // Restore button
      const pullBtn = document.getElementById('hubspot-pull-contacts-btn');
      if (pullBtn) {
        pullBtn.disabled = false;
        pullBtn.innerHTML = '<span>⬇️ Pull from HubSpot</span>';
      }
    }
  }
  
  // =====================================================
  // SYNC HISTORY
  // =====================================================
  
  async addSyncHistory(platform, contact, action, result, error = null) {
    try {
      const history = await chrome.storage.local.get(['syncHistory']);
      const syncHistory = history.syncHistory || [];
      
      const entry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        platform,
        contactEmail: contact.email,
        contactName: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email,
        action, // 'push', 'sync-all', 'update'
        result, // 'success' or 'error'
        error: error ? error.message : null
      };
      
      // Keep only last 100 entries
      syncHistory.unshift(entry);
      if (syncHistory.length > 100) {
        syncHistory.pop();
      }
      
      await chrome.storage.local.set({ syncHistory });
      
      // Update UI if history section is visible
      if (document.getElementById('syncHistoryTableBody')) {
        this.renderSyncHistory();
      }
    } catch (error) {
      console.error('Failed to save sync history:', error);
    }
  }
  
  async renderSyncHistory() {
    try {
      const history = await chrome.storage.local.get(['syncHistory']);
      const syncHistory = history.syncHistory || [];
      
      // Apply filters
      const platformFilter = document.getElementById('historyPlatformFilter')?.value || '';
      const resultFilter = document.getElementById('historyResultFilter')?.value || '';
      
      let filteredHistory = syncHistory;
      
      if (platformFilter) {
        filteredHistory = filteredHistory.filter(entry => entry.platform === platformFilter);
      }
      
      if (resultFilter) {
        filteredHistory = filteredHistory.filter(entry => entry.result === resultFilter);
      }
      
      const tbody = document.getElementById('syncHistoryTableBody');
      if (!tbody) return;
      
      if (filteredHistory.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="padding: 40px; text-align: center; color: var(--text-secondary);">
              <div style="font-size: 32px; margin-bottom: 8px;">📭</div>
              <div style="font-size: 14px;">No sync history</div>
              <div style="font-size: 12px; margin-top: 4px;">Sync operations will appear here</div>
            </td>
          </tr>
        `;
        return;
      }
      
      tbody.innerHTML = filteredHistory.slice(0, 50).map(entry => {
        const timeAgo = this.getTimeAgo(new Date(entry.timestamp));
        const platformColor = entry.platform === 'hubspot' ? '#ff7a59' : '#00a1e0';
        const resultIcon = entry.result === 'success' ? '✓' : '✗';
        const resultColor = entry.result === 'success' ? 'var(--success)' : 'var(--error)';
        
        return `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 10px; font-size: 12px; color: var(--text-secondary); white-space: nowrap;">${timeAgo}</td>
            <td style="padding: 10px;">
              <span style="display: inline-block; padding: 4px 8px; background: ${platformColor}; color: white; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase;">
                ${entry.platform === 'hubspot' ? 'H' : 'S'}
              </span>
            </td>
            <td style="padding: 10px; font-size: 12px; color: var(--text);">${entry.contactName}</td>
            <td style="padding: 10px; font-size: 12px; color: var(--text-secondary);">${entry.action}</td>
            <td style="padding: 10px;">
              <span style="color: ${resultColor}; font-weight: 600; font-size: 14px;" title="${entry.error || ''}">
                ${resultIcon}
              </span>
            </td>
          </tr>
        `;
      }).join('');
      
      // Update stats
      const successCount = syncHistory.filter(e => e.result === 'success').length;
      const errorCount = syncHistory.filter(e => e.result === 'error').length;
      
      const totalEl = document.getElementById('historyTotal');
      const successEl = document.getElementById('historySuccess');
      const failedEl = document.getElementById('historyFailed');
      
      if (totalEl) totalEl.textContent = syncHistory.length;
      if (successEl) successEl.textContent = successCount;
      if (failedEl) failedEl.textContent = errorCount;
      
    } catch (error) {
      console.error('Failed to render sync history:', error);
    }
  }
  
  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
  
  setupHistoryListeners() {
    // Filter listeners
    const platformFilter = document.getElementById('historyPlatformFilter');
    const resultFilter = document.getElementById('historyResultFilter');
    const clearBtn = document.getElementById('clearHistoryBtn');
    
    if (platformFilter) {
      platformFilter.addEventListener('change', () => this.renderSyncHistory());
    }
    
    if (resultFilter) {
      resultFilter.addEventListener('change', () => this.renderSyncHistory());
    }
    
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        if (confirm('Clear all sync history?')) {
          await chrome.storage.local.set({ syncHistory: [] });
          this.renderSyncHistory();
          this.showNotification('History cleared', 'success');
        }
      });
    }
  }
  
  async showSyncDetailsModal(platform) {
    // Get all contacts
    const response = await chrome.runtime.sendMessage({ action: 'getContacts' });
    if (!response || !response.contacts) return;
    
    const allContacts = response.contacts;
    const syncedContacts = allContacts.filter(c => c.crmMappings && c.crmMappings[platform]);
    const notSyncedContacts = allContacts.filter(c => !c.crmMappings || !c.crmMappings[platform]);
    
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    const platformColor = platform === 'hubspot' ? '#ff7a59' : '#00a1e0';
    const platformLetter = platform === 'hubspot' ? 'H' : 'S';
    
    // Remove existing modal
    const existing = document.getElementById('syncDetailsModal');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'syncDetailsModal';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      padding: 20px;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: var(--bg);
      color: var(--text);
      border-radius: 12px;
      width: 600px;
      max-width: 90vw;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
    `;
    
    modal.innerHTML = `
      <div style="padding: 20px; border-bottom: 1px solid var(--border);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="background: ${platformColor}; color: white; font-size: 12px; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 700;">${platformLetter}</span>
            <div>
              <h2 style="margin: 0; font-size: 18px; font-weight: 600;">${platformName} Sync Status</h2>
              <p style="margin: 2px 0 0; font-size: 12px; color: var(--text-secondary);">${syncedContacts.length} of ${allContacts.length} contacts synced</p>
            </div>
          </div>
          <button id="closeSyncModal" style="border: none; background: transparent; color: var(--text); font-size: 24px; cursor: pointer; opacity: 0.5; transition: opacity 0.2s; padding: 4px; line-height: 1;">×</button>
        </div>
      </div>
      
      <div style="flex: 1; overflow-y: auto; padding: 16px;">
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 13px; font-weight: 600; color: #22c55e; margin-bottom: 8px;">✓ Synced Contacts (${syncedContacts.length})</h3>
          ${syncedContacts.length > 0 ? `
            <div style="font-size: 11px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 4px;">
              ${syncedContacts.slice(0, 10).map(c => `
                <div style="padding: 6px 8px; background: var(--surface); border-radius: 4px;">
                  <div style="font-weight: 500;">${c.firstName || ''} ${c.lastName || ''}</div>
                  <div style="font-size: 10px; opacity: 0.7;">${c.email}</div>
                </div>
              `).join('')}
              ${syncedContacts.length > 10 ? `<div style="padding: 6px 8px; text-align: center; font-size: 10px; opacity: 0.6;">... and ${syncedContacts.length - 10} more</div>` : ''}
            </div>
          ` : '<div style="font-size: 11px; color: var(--text-secondary); font-style: italic;">No contacts synced yet</div>'}
        </div>
        
        <div>
          <h3 style="font-size: 13px; font-weight: 600; color: #ef4444; margin-bottom: 8px;">✗ Not Synced (${notSyncedContacts.length})</h3>
          ${notSyncedContacts.length > 0 ? `
            <div style="font-size: 11px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 4px;">
              ${notSyncedContacts.slice(0, 10).map(c => `
                <div style="padding: 6px 8px; background: var(--surface); border-radius: 4px;">
                  <div style="font-weight: 500;">${c.firstName || ''} ${c.lastName || ''}</div>
                  <div style="font-size: 10px; opacity: 0.7;">${c.email}</div>
                </div>
              `).join('')}
              ${notSyncedContacts.length > 10 ? `<div style="padding: 6px 8px; text-align: center; font-size: 10px; opacity: 0.6;">... and ${notSyncedContacts.length - 10} more</div>` : ''}
            </div>
          ` : '<div style="font-size: 11px; color: var(--text-secondary); font-style: italic;">All contacts are synced!</div>'}
        </div>
      </div>
      
      <div style="padding: 16px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 8px;">
        ${notSyncedContacts.length > 0 ? `
          <button id="pushUnsynced" style="padding: 8px 16px; background: ${platformColor}; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">
            Push ${notSyncedContacts.length} to ${platformName}
          </button>
        ` : ''}
        <button id="closeModalBtn" style="padding: 8px 16px; background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">
          Close
        </button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Event listeners
    modal.querySelector('#closeSyncModal').addEventListener('click', () => overlay.remove());
    modal.querySelector('#closeModalBtn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    
    const pushBtn = modal.querySelector('#pushUnsynced');
    if (pushBtn) {
      pushBtn.addEventListener('click', async () => {
        overlay.remove();
        
        // Push all unsynced contacts
        await this.pushUnsyncedContacts(notSyncedContacts, platform);
      });
    }
  }
  
  async pushUnsyncedContacts(contacts, platform) {
    if (!contacts || contacts.length === 0) {
      this.showNotification('No contacts to push', 'info');
      return;
    }
    
    const platformName = platform === 'hubspot' ? 'HubSpot' : 'Salesforce';
    this.showNotification(`Pushing ${contacts.length} contacts to ${platformName}...`, 'info');
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      try {
        const result = await this.syncContact(contact, platform);
        
        if (result && result.skipped) {
          skippedCount++;
        } else {
          successCount++;
        }
        
        // Show progress every 5 contacts
        if ((i + 1) % 5 === 0 || i === contacts.length - 1) {
          this.showNotification(`Pushing... ${i + 1}/${contacts.length}`, 'info');
        }
      } catch (error) {
        console.error(`Failed to push ${contact.email}:`, error);
        errorCount++;
      }
    }
    
    // Refresh sync status
    await this.checkIntegrationStatus();
    
    // Refresh contacts list
    if (window.loadContacts) {
      window.loadContacts();
    }
    
    // Show final result
    let resultMsg = '';
    if (successCount > 0) {
      resultMsg += `✓ Pushed ${successCount} to ${platformName}`;
    }
    if (skippedCount > 0) {
      resultMsg += `, ${skippedCount} skipped`;
    }
    if (errorCount > 0) {
      resultMsg += `, ${errorCount} failed`;
    }
    
    this.showNotification(resultMsg, errorCount > 0 ? 'error' : 'success');
  }
  
  // =====================================================
  // UI HELPERS
  // =====================================================
  
  showUpgradeModal(platform) {
    const platformName = platform === 'hubspot' ? 'HubSpot' : 'Salesforce';
    const platformColor = platform === 'hubspot' ? '#ff7a59' : '#00a1e0';
    
    // Remove existing modal
    const existing = document.getElementById('upgradeModal');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'upgradeModal';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: var(--bg);
      color: var(--text);
      border-radius: 20px;
      width: 500px;
      max-width: 95vw;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      border: 1px solid var(--border);
      overflow: hidden;
    `;
    
    modal.innerHTML = `
      <div style="padding: 48px; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 16px;">🚀</div>
        <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 12px; color: var(--text);">
          ${platformName} Integration Requires Pro
        </h2>
        <p style="font-size: 15px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px;">
          Unlock automatic ${platformName} syncing with your Pro subscription
        </p>
        
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #86efac; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: left;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 24px; margin-right: 12px;">✨</span>
            <span style="font-size: 18px; font-weight: 600; color: #166534;">
              Start 14-Day Free Trial
            </span>
          </div>
          <p style="font-size: 13px; color: #166534; line-height: 1.6; margin: 0;">
            Full access to Pro features. No credit card required. Cancel anytime.
          </p>
        </div>
        
        <div style="margin-bottom: 24px; text-align: left;">
          <p style="font-size: 13px; color: var(--text-secondary); font-weight: 600; margin-bottom: 10px;">
            Pro Plan Includes:
          </p>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: var(--text-secondary);">
            <div style="display: flex; align-items: center;">
              <span style="color: #10b981; margin-right: 8px; font-weight: 700;">✓</span>
              Unlimited contacts
            </div>
            <div style="display: flex; align-items: center;">
              <span style="color: #10b981; margin-right: 8px; font-weight: 700;">✓</span>
              HubSpot & Salesforce sync
            </div>
            <div style="display: flex; align-items: center;">
              <span style="color: #10b981; margin-right: 8px; font-weight: 700;">✓</span>
              Auto-sync every 15 minutes
            </div>
            <div style="display: flex; align-items: center;">
              <span style="color: #10b981; margin-right: 8px; font-weight: 700;">✓</span>
              Smart duplicate detection
            </div>
            <div style="display: flex; align-items: center;">
              <span style="color: #10b981; margin-right: 8px; font-weight: 700;">✓</span>
              Priority support
            </div>
          </div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button id="startTrialBtn" style="padding: 16px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
            Start Free Trial → $9.99/mo after trial
          </button>
          
          <button id="closeUpgradeModal" style="padding: 16px 24px; background: var(--surface); color: var(--text-secondary); border: 1px solid var(--border); border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
            Maybe Later
          </button>
        </div>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Event listeners
    const startTrialBtn = modal.querySelector('#startTrialBtn');
    const closeBtn = modal.querySelector('#closeUpgradeModal');
    
    startTrialBtn.addEventListener('click', () => {
      // Open pricing page on website
      window.open('https://crm-sync.net/#/pricing', '_blank');
      overlay.remove();
    });
    
    startTrialBtn.addEventListener('mouseenter', (e) => {
      e.target.style.transform = 'translateY(-2px)';
      e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.5)';
    });
    
    startTrialBtn.addEventListener('mouseleave', (e) => {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });
    
    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }
  
  showNotification(message, type = 'info') {
    console.log(`📢 Notification [${type}]:`, message);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add animation styles
    if (!document.querySelector('#notificationStyles')) {
      const style = document.createElement('style');
      style.id = 'notificationStyles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
  
  // Check if a specific platform is connected
  isConnected(platform) {
    return this.statusCache[platform]?.connected || false;
  }
  
  // Get last sync time for a platform
  getLastSync(platform) {
    return this.statusCache[platform]?.lastSync || null;
  }
  
  // Get all connected platforms (for UI filtering)
  getConnectedPlatforms() {
    return {
      hubspot: this.isConnected('hubspot'),
      salesforce: this.isConnected('salesforce'),
      any: this.isConnected('hubspot') || this.isConnected('salesforce')
    };
  }
  
  // Handle session expiry (403 errors)
  async handleSessionExpiry(reason) {
    console.warn('🔐 Session expired:', reason);
    
    // Check if we already showed the expiry modal recently (prevent spam)
    const lastShown = this.lastExpiryModalShown || 0;
    const now = Date.now();
    
    if (now - lastShown < 60000) { // Don't show more than once per minute
      console.log('⏸️ Expiry modal already shown recently, skipping');
      return;
    }
    
    this.lastExpiryModalShown = now;
    
    // Show a modal instead of toast
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease;
    `;
    
    modal.innerHTML = `
      <div style="background: white; border-radius: 16px; padding: 32px; max-width: 400px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 12px; color: #1e293b;">Session Expired</h2>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 24px; line-height: 1.5;">
          Your login session has expired. Please sign in again to continue using CRM-Sync.
        </p>
        <button id="reloginBtn" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
        ">
          Sign In Again
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle re-login button
    document.getElementById('reloginBtn').addEventListener('click', async () => {
      modal.remove();
      
      // Clear all auth data
      await chrome.storage.local.remove(['authToken', 'refreshToken', 'user', 'isAuthenticated']);
      
      // Open login page
      window.open('https://www.crm-sync.net/#/login?from=extension&reason=expired', '_blank');
      
      // Show toast
      if (typeof showToast === 'function') {
        showToast('Please sign in to continue', false);
      }
    });
  }
  
  // =====================================================
  // SMART CONTACT UPDATES
  // =====================================================
  
  /**
   * Detect which fields have new data compared to existing CRM contact
   */
  detectNewFields(existingContact, newContact) {
    const updates = {};
    
    // Check each field - only update if new contact HAS the field and existing DOESN'T
    if (newContact.phone && !existingContact.phone) {
      updates.phone = newContact.phone;
    }
    if (newContact.company && !existingContact.company) {
      updates.company = newContact.company;
    }
    if (newContact.title && !existingContact.title) {
      updates.title = newContact.title;
    }
    if (newContact.jobTitle && !existingContact.jobTitle) {
      updates.jobTitle = newContact.jobTitle;
    }
    if (newContact.linkedin && !existingContact.linkedin) {
      updates.linkedin = newContact.linkedin;
    }
    
    return updates;
  }
  
  /**
   * Show minimal notification for contact updates
   */
  showUpdateNotification(updateCandidates, platform) {
    // Remove any existing notification
    const existing = document.getElementById('update-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10000;
      animation: slideUp 0.3s ease;
    `;
    
    const count = updateCandidates.length;
    const platformName = platform === 'hubspot' ? 'HubSpot' : 'Salesforce';
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
        <span style="font-size: 20px;">🔄</span>
        <div>
          <div style="font-weight: 600; font-size: 13px;">
            ${count} contact${count > 1 ? 's have' : ' has'} new information
          </div>
          <div style="font-size: 11px; opacity: 0.9;">
            Update existing ${platformName} contacts with new data
          </div>
        </div>
      </div>
      <button id="review-updates-btn" style="
        background: white;
        color: #667eea;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 12px;
        cursor: pointer;
        margin-right: 8px;
      ">Review</button>
      <button id="skip-updates-btn" style="
        background: transparent;
        color: white;
        border: 1px solid rgba(255,255,255,0.3);
        padding: 6px 12px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 12px;
        cursor: pointer;
      ">Skip</button>
    `;
    
    document.body.appendChild(notification);
    
    // Add animation style if not exists
    if (!document.getElementById('update-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'update-notification-styles';
      style.textContent = `
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Event listeners
    document.getElementById('review-updates-btn').onclick = () => {
      notification.remove();
      this.showUpdateReviewModal(updateCandidates, platform);
    };
    
    document.getElementById('skip-updates-btn').onclick = () => {
      notification.remove();
      this.showNotification(`✓ Sync complete! ${count} update${count > 1 ? 's' : ''} skipped`, 'success');
    };
  }
  
  /**
   * Show review modal for contact updates
   */
  showUpdateReviewModal(updateCandidates, platform) {
    console.log('🎯 INTEGRATIONS: showUpdateReviewModal called');
    console.log('📋 INTEGRATIONS: updateCandidates:', updateCandidates);
    console.log('🏢 INTEGRATIONS: platform:', platform);
    
    // Remove any existing modal
    const existing = document.getElementById('update-review-modal');
    if (existing) {
      console.log('🗑️ INTEGRATIONS: Removing existing modal');
      existing.remove();
    }

    console.log('✨ INTEGRATIONS: Creating new modal...');
    const modal = document.createElement('div');
    modal.id = 'update-review-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 400px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;

    const platformName = platform === 'hubspot' ? 'HubSpot' : 'Salesforce';
    let selectedContacts = new Set(updateCandidates.map(c => c.email));

    console.log('📝 INTEGRATIONS: Building modal HTML...');
    modalContent.innerHTML = `
      <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600;">
          🔄 Update Existing Contacts
        </h3>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">
          Review new information for contacts that already exist in ${platformName}
        </p>
      </div>
      
      <div id="update-candidates-list" style="padding: 16px;">
        ${updateCandidates.map(candidate => `
          <div class="update-candidate" data-email="${candidate.email}" style="
            padding: 12px;
            background: #f9fafb;
            border-radius: 8px;
            margin-bottom: 12px;
            border: 2px solid #e5e7eb;
          ">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <input type="checkbox" checked data-email="${candidate.email}" style="width: 16px; height: 16px; cursor: pointer;">
              <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 13px;">
                  ${candidate.firstName || ''} ${candidate.lastName || ''}
                </div>
                <div style="font-size: 11px; color: #6b7280;">
                  ${candidate.email}
                </div>
              </div>
            </div>
            <div style="padding-left: 24px; font-size: 11px;">
              ${Object.entries(candidate.newFields).map(([field, value]) => `
                <div style="color: #059669; margin-bottom: 4px;">
                  ➕ <strong style="text-transform: capitalize;">${field}:</strong> ${value}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      
      <div style="padding: 16px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px;">
        <button id="update-all-btn" style="
          flex: 1;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        ">
          Update Selected (<span id="selected-count">${updateCandidates.length}</span>)
        </button>
        <button id="cancel-updates-btn" style="
          padding: 12px 20px;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        ">
          Cancel
        </button>
      </div>
    `;

    console.log('🔗 INTEGRATIONS: Appending modal to document...');
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    console.log('✅ INTEGRATIONS: Modal appended to body');
    console.log('🔍 INTEGRATIONS: Modal element:', modal);
    console.log('🔍 INTEGRATIONS: Modal display:', modal.style.display);
    console.log('🔍 INTEGRATIONS: Modal z-index:', modal.style.zIndex);

    // Checkbox handlers
    modalContent.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          selectedContacts.add(e.target.dataset.email);
        } else {
          selectedContacts.delete(e.target.dataset.email);
        }
        document.getElementById('selected-count').textContent = selectedContacts.size;
      });
    });
    
    // Update button
    document.getElementById('update-all-btn').onclick = async () => {
      const contactsToUpdate = updateCandidates.filter(c => selectedContacts.has(c.email));
      modal.remove();
      await this.executeContactUpdates(contactsToUpdate, platform);
    };
    
    // Cancel button
    document.getElementById('cancel-updates-btn').onclick = () => {
      modal.remove();
    };
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  /**
   * Execute batch contact updates
   */
  async executeContactUpdates(contactsToUpdate, platform) {
    if (contactsToUpdate.length === 0) {
      this.showNotification('No contacts selected', 'info');
      return;
    }
    
    try {
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Show progress
      this.showNotification(`Updating ${contactsToUpdate.length} contact${contactsToUpdate.length > 1 ? 's' : ''}...`, 'info');
      
      const platformName = platform === 'hubspot' ? 'HubSpot' : 'Salesforce';
      const results = { updated: 0, failed: 0 };
      
      // Update each contact
      for (const contact of contactsToUpdate) {
        try {
          const response = await fetch(`${this.apiUrl}/${platform}/update-contact`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: contact.email,
              crmId: contact.crmId,
              updates: contact.newFields
            })
          });
          
          if (response.ok) {
            results.updated++;
            // Log to history
            await this.addSyncHistory(platform, contact, 'update', 'success');
          } else {
            results.failed++;
            console.error(`Failed to update ${contact.email}`);
          }
        } catch (error) {
          results.failed++;
          console.error(`Error updating ${contact.email}:`, error);
        }
      }
      
      // Show final result
      if (results.updated > 0) {
        this.showNotification(
          `✓ Updated ${results.updated} contact${results.updated > 1 ? 's' : ''} in ${platformName}!`,
          'success'
        );
      }
      
      if (results.failed > 0) {
        this.showNotification(
          `⚠ ${results.failed} update${results.failed > 1 ? 's' : ''} failed`,
          'error'
        );
      }
      
      // Refresh status
      await this.checkIntegrationStatus();
      
    } catch (error) {
      console.error('❌ Batch update error:', error);
      this.showNotification(`Failed to update contacts: ${error.message}`, 'error');
    }
  }
}

// Initialize and expose globally
window.integrationManager = new IntegrationManager();
window.IntegrationManager = window.integrationManager; // Backward compatibility

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.integrationManager.init();
  });
} else {
  window.integrationManager.init();
}

console.log('✅ integrations.js loaded');
