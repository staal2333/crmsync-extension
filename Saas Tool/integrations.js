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
      this.setupEventListeners();
      console.log('✅ Integrations initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize integrations:', error);
    }
  }
  
  setupEventListeners() {
    // HubSpot buttons
    const hubspotConnectBtn = document.getElementById('hubspot-connect-btn');
    const hubspotDisconnectBtn = document.getElementById('hubspot-disconnect-btn');
    const hubspotSyncBtn = document.getElementById('hubspot-sync-all-btn');
    
    if (hubspotConnectBtn) {
      hubspotConnectBtn.addEventListener('click', () => this.connectIntegration('hubspot'));
    }
    
    if (hubspotDisconnectBtn) {
      hubspotDisconnectBtn.addEventListener('click', () => this.disconnectIntegration('hubspot'));
    }
    
    if (hubspotSyncBtn) {
      hubspotSyncBtn.addEventListener('click', () => this.syncAllContacts('hubspot'));
    }
    
    // Salesforce buttons
    const salesforceConnectBtn = document.getElementById('salesforce-connect-btn');
    const salesforceDisconnectBtn = document.getElementById('salesforce-disconnect-btn');
    const salesforceSyncBtn = document.getElementById('salesforce-sync-all-btn');
    
    if (salesforceConnectBtn) {
      salesforceConnectBtn.addEventListener('click', () => this.connectIntegration('salesforce'));
    }
    
    if (salesforceDisconnectBtn) {
      salesforceDisconnectBtn.addEventListener('click', () => this.disconnectIntegration('salesforce'));
    }
    
    if (salesforceSyncBtn) {
      salesforceSyncBtn.addEventListener('click', () => this.syncAllContacts('salesforce'));
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
  
  async handleConnectionSuccess(platform) {
    console.log(`✅ ${platform} connected successfully!`);
    this.showNotification(`${platform} connected successfully!`, 'success');
    
    // Update UI
    await this.checkIntegrationStatus();
    
    // Trigger initial sync
    setTimeout(() => {
      this.syncAllContacts(platform);
    }, 1000);
  }
  
  // =====================================================
  // STATUS CHECKING
  // =====================================================
  
  async checkIntegrationStatus() {
    try {
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        return;
      }
      
      // Check HubSpot
      const hubspotResponse = await fetch(`${this.apiUrl}/hubspot/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const hubspotData = await hubspotResponse.json();
      this.statusCache.hubspot = hubspotData;
      this.updateIntegrationUI('hubspot', hubspotData.connected, hubspotData);
      
      // Check Salesforce
      const salesforceResponse = await fetch(`${this.apiUrl}/salesforce/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const salesforceData = await salesforceResponse.json();
      this.statusCache.salesforce = salesforceData;
      this.updateIntegrationUI('salesforce', salesforceData.connected, salesforceData);
      
      this.statusCache.lastChecked = new Date();
      console.log('✅ Integration status updated');
    } catch (error) {
      console.error('❌ Failed to check integration status:', error);
    }
  }
  
  updateIntegrationUI(platform, connected, data = {}) {
    const statusEl = document.getElementById(`${platform}-status`);
    const connectBtn = document.getElementById(`${platform}-connect-btn`);
    const disconnectBtn = document.getElementById(`${platform}-disconnect-btn`);
    const syncBtn = document.getElementById(`${platform}-sync-all-btn`);
    const lastSyncEl = document.getElementById(`${platform}-last-sync`);
    const countEl = document.getElementById(`${platform}-count`);
    
    if (connected) {
      // Connected state
      if (statusEl) {
        statusEl.innerHTML = '<span style="color: #10B981;">✓ Connected</span>';
      }
      if (connectBtn) connectBtn.classList.add('hidden');
      if (disconnectBtn) disconnectBtn.classList.remove('hidden');
      if (syncBtn) syncBtn.classList.remove('hidden');
      
      // Show last sync time
      if (lastSyncEl && data.lastSync) {
        const lastSyncDate = new Date(data.lastSync);
        const now = new Date();
        const diffMs = now - lastSyncDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        let timeAgo;
        if (diffMins < 1) timeAgo = 'just now';
        else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
        else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
        else timeAgo = lastSyncDate.toLocaleDateString();
        
        lastSyncEl.textContent = `Last synced: ${timeAgo}`;
        lastSyncEl.classList.remove('hidden');
      }
      
      // Show contact count
      if (countEl && typeof data.syncedContactsCount !== 'undefined') {
        countEl.textContent = `${data.syncedContactsCount} contacts synced`;
        countEl.classList.remove('hidden');
      }
    } else {
      // Disconnected state
      if (statusEl) {
        statusEl.innerHTML = '<span style="color: #6B7280;">Not connected</span>';
      }
      if (connectBtn) connectBtn.classList.remove('hidden');
      if (disconnectBtn) disconnectBtn.classList.add('hidden');
      if (syncBtn) syncBtn.classList.add('hidden');
      if (lastSyncEl) lastSyncEl.classList.add('hidden');
      if (countEl) countEl.classList.add('hidden');
    }
  }
  
  // =====================================================
  // SYNC OPERATIONS
  // =====================================================
  
  async syncContact(contact, platform) {
    try {
      console.log(`🔄 Syncing contact to ${platform}:`, contact.email);
      
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Prepare contact data
      const contactData = {
        id: contact.id,
        email: contact.email,
        name: contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        firstName: contact.first_name,
        lastName: contact.last_name,
        company: contact.company,
        title: contact.title,
        phone: contact.phone
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
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }
      
      const result = await response.json();
      
      // Show success notification
      const actionText = result.action === 'create' ? 'added to' : 'updated in';
      this.showNotification(`✓ Contact ${actionText} ${platform}`, 'success');
      
      console.log(`✅ Contact synced to ${platform}:`, result);
      
      // Refresh contact list to show updated status
      if (window.loadContacts) {
        window.loadContacts();
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to sync to ${platform}:`, error);
      this.showNotification(`Failed to sync: ${error.message}`, 'error');
      throw error;
    }
  }
  
  async syncAllContacts(platform) {
    try {
      console.log(`🔄 Syncing all contacts from ${platform}...`);
      
      // Show loading state
      const syncBtn = document.getElementById(`${platform}-sync-all-btn`);
      const originalText = syncBtn ? syncBtn.textContent : '';
      if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.textContent = '🔄 Syncing...';
      }
      
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
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
      
      const result = await response.json();
      
      // Show success notification
      this.showNotification(
        `✓ Synced ${result.mappedContacts} contacts from ${platform}`,
        'success'
      );
      
      console.log(`✅ All contacts synced from ${platform}:`, result);
      
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
      
      // Restore button state
      const syncBtn = document.getElementById(`${platform}-sync-all-btn`);
      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.textContent = '🔄 Sync All Contacts';
      }
    }
  }
  
  // =====================================================
  // UI HELPERS
  // =====================================================
  
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
}

// Initialize and expose globally
window.IntegrationManager = new IntegrationManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.IntegrationManager.init();
  });
} else {
  window.IntegrationManager.init();
}

console.log('✅ integrations.js loaded');
