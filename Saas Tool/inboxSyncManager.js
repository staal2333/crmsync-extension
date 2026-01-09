/**
 * Inbox Sync Manager - Handles full inbox scanning and syncing
 */

class InboxSyncManager {
  constructor() {
    this.apiUrl = 'https://crmsync-api.onrender.com/api/inbox-sync';
    this.activeSyncId = null;
    this.pollInterval = null;
  }

  /**
   * Start inbox sync
   */
  async startSync(options = {}) {
    try {
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        throw new Error('Please sign in first');
      }

      // Check if user has Pro tier
      const { user } = await chrome.storage.local.get(['user']);
      if (user) {
        const tier = user.subscriptionTier || user.tier || 'free';
        if (tier.toLowerCase() === 'free') {
          this.showUpgradeModal();
          return null;
        }
      }

      console.log('🚀 Starting inbox sync...', options);

      const response = await fetch(`${this.apiUrl}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start sync');
      }

      const data = await response.json();
      this.activeSyncId = data.syncId;

      console.log('✅ Inbox sync started:', data);

      // Start polling for progress
      this.startProgressPolling();

      return data;

    } catch (error) {
      console.error('❌ Failed to start inbox sync:', error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(syncId) {
    try {
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        throw new Error('Please sign in first');
      }

      const response = await fetch(`${this.apiUrl}/status/${syncId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get sync status');
      }

      const data = await response.json();
      return data.session;

    } catch (error) {
      console.error('❌ Failed to get sync status:', error);
      throw error;
    }
  }

  /**
   * Cancel active sync
   */
  async cancelSync(syncId) {
    try {
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        throw new Error('Please sign in first');
      }

      const response = await fetch(`${this.apiUrl}/cancel/${syncId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel sync');
      }

      this.stopProgressPolling();
      this.activeSyncId = null;

      console.log('✅ Sync cancelled');

    } catch (error) {
      console.error('❌ Failed to cancel sync:', error);
      throw error;
    }
  }

  /**
   * Get sync history
   */
  async getSyncHistory() {
    try {
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        throw new Error('Please sign in first');
      }

      const response = await fetch(`${this.apiUrl}/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get sync history');
      }

      const data = await response.json();
      return data.history;

    } catch (error) {
      console.error('❌ Failed to get sync history:', error);
      throw error;
    }
  }

  /**
   * Start polling for progress updates
   */
  startProgressPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    this.pollInterval = setInterval(async () => {
      if (!this.activeSyncId) {
        this.stopProgressPolling();
        return;
      }

      try {
        const session = await this.getSyncStatus(this.activeSyncId);
        
        // Update UI
        this.updateProgressUI(session);

        // Stop polling if sync is complete
        if (session.status === 'completed' || session.status === 'failed' || session.status === 'cancelled') {
          this.stopProgressPolling();
          this.onSyncComplete(session);
        }

      } catch (error) {
        console.error('⚠️ Failed to poll sync status:', error);
      }
    }, 2000); // Poll every 2 seconds
  }

  /**
   * Stop progress polling
   */
  stopProgressPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Update progress UI
   */
  updateProgressUI(session) {
    const progressModal = document.getElementById('inboxSyncProgressModal');
    if (!progressModal) return;

    const progress = session.progress;
    const percentage = progress.totalEmails > 0 
      ? Math.round((progress.emailsScanned / progress.totalEmails) * 100)
      : 0;

    // Update progress bar
    const progressBar = progressModal.querySelector('.progress-bar-fill');
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }

    // Update stats
    const statsContainer = progressModal.querySelector('.sync-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-item">
          <span class="stat-label">Scanned:</span>
          <span class="stat-value">${progress.emailsScanned.toLocaleString()} / ${progress.totalEmails.toLocaleString()} emails</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Found:</span>
          <span class="stat-value">${progress.contactsFound.toLocaleString()} contacts</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Updated:</span>
          <span class="stat-value">${progress.contactsUpdated.toLocaleString()} contacts</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Created:</span>
          <span class="stat-value">${progress.contactsCreated.toLocaleString()} new contacts</span>
        </div>
      `;
    }

    // Update phase text
    const phaseText = progressModal.querySelector('.sync-phase');
    if (phaseText) {
      const phaseLabels = {
        'initializing': 'Initializing...',
        'fetching_gmail_token': 'Connecting to Gmail...',
        'fetching_message_ids': 'Finding emails...',
        'fetching_emails': 'Scanning inbox...',
        'extracting_contacts': 'Extracting contacts...',
        'syncing_to_crm': 'Syncing to CRM...',
        'completed': 'Completed!',
        'failed': 'Failed'
      };
      
      phaseText.textContent = phaseLabels[progress.phase] || 'Processing...';
    }
  }

  /**
   * Handle sync completion
   */
  onSyncComplete(session) {
    console.log('🎉 Inbox sync completed:', session);

    // Close progress modal
    this.closeProgressModal();

    // Show completion notification
    this.showCompletionNotification(session);

    // Refresh contacts list
    if (typeof loadAllContacts === 'function') {
      loadAllContacts();
    }
  }

  /**
   * Show sync progress modal
   */
  showProgressModal(session) {
    // Remove existing modal
    const existing = document.getElementById('inboxSyncProgressModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'inboxSyncProgressModal';
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
      <div class="modal-content inbox-sync-modal">
        <div class="modal-header">
          <h2>📬 Syncing Your Inbox</h2>
          <p class="sync-phase">Initializing...</p>
        </div>
        
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: 0%;"></div>
        </div>
        
        <div class="sync-stats">
          <div class="stat-item">
            <span class="stat-label">Scanned:</span>
            <span class="stat-value">0 emails</span>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" id="cancelSyncBtn">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listener for cancel button
    const cancelBtn = modal.querySelector('#cancelSyncBtn');
    cancelBtn.addEventListener('click', async () => {
      if (this.activeSyncId) {
        await this.cancelSync(this.activeSyncId);
        this.closeProgressModal();
      }
    });
  }

  /**
   * Close progress modal
   */
  closeProgressModal() {
    const modal = document.getElementById('inboxSyncProgressModal');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Show completion notification
   */
  showCompletionNotification(session) {
    const { progress, results } = session;
    
    let message = '';
    if (session.status === 'completed') {
      message = `✅ Inbox sync complete!\n\n`;
      message += `📨 Scanned ${progress.emailsScanned.toLocaleString()} emails\n`;
      message += `👥 Found ${progress.contactsFound.toLocaleString()} contacts\n`;
      message += `✨ Updated ${progress.contactsUpdated.toLocaleString()} contacts\n`;
      message += `➕ Created ${progress.contactsCreated.toLocaleString()} new contacts`;
    } else if (session.status === 'failed') {
      message = `❌ Inbox sync failed\n\n${session.error || 'Unknown error'}`;
    } else if (session.status === 'cancelled') {
      message = `⚠️ Inbox sync cancelled`;
    }

    alert(message);
  }

  /**
   * Show upgrade modal for free users
   */
  showUpgradeModal() {
    // Remove existing modal
    const existing = document.getElementById('inboxSyncUpgradeModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'inboxSyncUpgradeModal';
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
      <div class="modal-content upgrade-modal">
        <div class="modal-icon">📬</div>
        <h2>Inbox Sync Requires Pro</h2>
        <p>Scan your entire Gmail inbox and sync thousands of contacts automatically.</p>
        
        <div class="trial-badge">
          <span class="badge-icon">✨</span>
          <div class="badge-text">
            <strong>Start 14-Day Free Trial</strong>
            <small>Full access to Pro features. No credit card required.</small>
          </div>
        </div>
        
        <ul class="feature-list">
          <li>✓ Scan entire inbox (up to 5,000 emails)</li>
          <li>✓ Bulk sync to HubSpot & Salesforce</li>
          <li>✓ Auto-update existing contacts</li>
          <li>✓ Smart duplicate detection</li>
          <li>✓ Sync history & reports</li>
        </ul>
        
        <div class="modal-actions">
          <button class="btn-primary" id="startInboxTrialBtn">
            Start Free Trial → $9.99/mo after trial
          </button>
          <button class="btn-secondary" id="closeInboxUpgradeModal">Maybe Later</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const startTrialBtn = modal.querySelector('#startInboxTrialBtn');
    const closeBtn = modal.querySelector('#closeInboxUpgradeModal');
    
    startTrialBtn.addEventListener('click', () => {
      window.open('https://crm-sync.net/#/pricing', '_blank');
      modal.remove();
    });
    
    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }
}

// Initialize global instance
window.inboxSyncManager = new InboxSyncManager();
