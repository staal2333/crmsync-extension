/**
 * Inbox Sync UI Handlers
 * Add to popup.js
 */

// Inbox Sync Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const startInboxSyncBtn = document.getElementById('startInboxSyncBtn');
  const inboxSyncSettingsBtn = document.getElementById('inboxSyncSettingsBtn');
  const inboxSyncOptions = document.getElementById('inboxSyncOptions');
  const saveInboxSyncOptions = document.getElementById('saveInboxSyncOptions');
  const viewSyncHistoryBtn = document.getElementById('viewSyncHistoryBtn');

  // Toggle sync options
  if (inboxSyncSettingsBtn) {
    inboxSyncSettingsBtn.addEventListener('click', () => {
      if (inboxSyncOptions) {
        const isVisible = inboxSyncOptions.style.display !== 'none';
        inboxSyncOptions.style.display = isVisible ? 'none' : 'block';
      }
    });
  }

  // Save sync options
  if (saveInboxSyncOptions) {
    saveInboxSyncOptions.addEventListener('click', async () => {
      const options = {
        dateRange: document.getElementById('inboxSyncDateRange')?.value || '90d',
        updateExisting: document.getElementById('inboxSyncUpdateExisting')?.checked !== false,
        createNew: document.getElementById('inboxSyncCreateNew')?.checked !== false
      };

      await chrome.storage.local.set({ inboxSyncOptions: options });
      
      if (inboxSyncOptions) {
        inboxSyncOptions.style.display = 'none';
      }
      
      // Show toast notification
      if (typeof showToast === 'function') {
        showToast('✅ Sync options saved', 'success');
      }
    });
  }

  // Start inbox sync
  if (startInboxSyncBtn) {
    startInboxSyncBtn.addEventListener('click', async () => {
      try {
        // Get saved options or use defaults
        const { inboxSyncOptions } = await chrome.storage.local.get(['inboxSyncOptions']);
        const options = inboxSyncOptions || {
          dateRange: '90d',
          updateExisting: true,
          createNew: true
        };

        // Start sync
        const session = await window.inboxSyncManager.startSync(options);
        
        if (session) {
          // Show progress modal
          window.inboxSyncManager.showProgressModal(session);
          
          // Update status indicator
          updateInboxSyncStatus('syncing');
        }

      } catch (error) {
        console.error('Failed to start inbox sync:', error);
        alert(`Failed to start inbox sync:\n\n${error.message}`);
      }
    });
  }

  // View sync history
  if (viewSyncHistoryBtn) {
    viewSyncHistoryBtn.addEventListener('click', async () => {
      try {
        const history = await window.inboxSyncManager.getSyncHistory();
        showSyncHistoryModal(history);
      } catch (error) {
        console.error('Failed to get sync history:', error);
        alert(`Failed to get sync history:\n\n${error.message}`);
      }
    });
  }

  // Load last sync info on settings tab open
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (btn.dataset.tab === 'settings') {
        await loadLastSyncInfo();
      }
    });
  });

  // Load sync options on page load
  loadInboxSyncOptions();
});

/**
 * Load saved inbox sync options
 */
async function loadInboxSyncOptions() {
  try {
    const { inboxSyncOptions } = await chrome.storage.local.get(['inboxSyncOptions']);
    
    if (inboxSyncOptions) {
      const dateRangeSelect = document.getElementById('inboxSyncDateRange');
      const updateExistingCheckbox = document.getElementById('inboxSyncUpdateExisting');
      const createNewCheckbox = document.getElementById('inboxSyncCreateNew');

      if (dateRangeSelect) dateRangeSelect.value = inboxSyncOptions.dateRange || '90d';
      if (updateExistingCheckbox) updateExistingCheckbox.checked = inboxSyncOptions.updateExisting !== false;
      if (createNewCheckbox) createNewCheckbox.checked = inboxSyncOptions.createNew !== false;
    }
  } catch (error) {
    console.error('Failed to load inbox sync options:', error);
  }
}

/**
 * Load last sync info
 */
async function loadLastSyncInfo() {
  try {
    const history = await window.inboxSyncManager.getSyncHistory();
    
    if (history && history.length > 0) {
      const lastSync = history[0];
      
      const lastSyncInfo = document.getElementById('lastSyncInfo');
      const lastSyncTime = document.getElementById('lastSyncTime');
      const lastSyncResults = document.getElementById('lastSyncResults');
      
      if (lastSyncInfo && lastSyncTime && lastSyncResults) {
        lastSyncInfo.style.display = 'block';
        
        // Format time
        const timeAgo = formatTimeAgo(new Date(lastSync.started_at));
        lastSyncTime.textContent = timeAgo;
        
        // Format results
        const resultsText = `${lastSync.contacts_updated} updated, ${lastSync.contacts_created} created from ${lastSync.emails_scanned} emails`;
        lastSyncResults.textContent = resultsText;
      }
      
      updateInboxSyncStatus('ready');
    }
  } catch (error) {
    console.error('Failed to load last sync info:', error);
  }
}

/**
 * Update inbox sync status indicator
 */
function updateInboxSyncStatus(status) {
  const indicator = document.getElementById('inboxSyncStatusIndicator');
  const statusText = document.getElementById('inboxSyncStatusText');
  
  if (indicator && statusText) {
    switch (status) {
      case 'ready':
        indicator.style.background = '#10b981';
        statusText.textContent = 'Ready to sync';
        break;
      case 'syncing':
        indicator.style.background = '#f59e0b';
        statusText.textContent = 'Syncing...';
        break;
      case 'completed':
        indicator.style.background = '#10b981';
        statusText.textContent = 'Last sync successful';
        break;
      case 'failed':
        indicator.style.background = '#ef4444';
        statusText.textContent = 'Last sync failed';
        break;
    }
  }
}

/**
 * Show sync history modal
 */
function showSyncHistoryModal(history) {
  // Remove existing modal
  const existing = document.getElementById('syncHistoryModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'syncHistoryModal';
  modal.className = 'modal-overlay';
  
  let historyHTML = '';
  if (history && history.length > 0) {
    historyHTML = history.map(sync => {
      const date = new Date(sync.started_at);
      const statusEmoji = sync.status === 'completed' ? '✅' : sync.status === 'failed' ? '❌' : '⏸️';
      const duration = sync.completed_at ? 
        Math.round((new Date(sync.completed_at) - date) / 1000) + 's' : 
        '-';
      
      return `
        <div class="history-item" style="padding: 12px; background: var(--surface); border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 13px;">${statusEmoji} ${date.toLocaleString()}</strong>
            <span style="font-size: 11px; color: var(--text-secondary);">${duration}</span>
          </div>
          <div style="font-size: 12px; color: var(--text-secondary);">
            📨 ${sync.emails_scanned.toLocaleString()} emails scanned<br>
            👥 ${sync.contacts_found.toLocaleString()} contacts found<br>
            ✨ ${sync.contacts_updated.toLocaleString()} updated, ${sync.contacts_created.toLocaleString()} created
          </div>
        </div>
      `;
    }).join('');
  } else {
    historyHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 32px;">No sync history yet</p>';
  }
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px; max-height: 80vh; overflow-y: auto;">
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 style="margin: 0;">📊 Sync History</h2>
        <button id="closeSyncHistoryModal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary);">×</button>
      </div>
      <div class="history-list">
        ${historyHTML}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Event listeners
  const closeBtn = modal.querySelector('#closeSyncHistoryModal');
  closeBtn.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

/**
 * Format time ago (e.g., "2 hours ago")
 */
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}
