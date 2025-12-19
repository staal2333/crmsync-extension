// ===================================================
// CRMSYNC Popup Enhancements Integration
// Add this code to popup.js for new features
// ===================================================

// ========================================
// INITIALIZE ENHANCEMENTS ON DOM LOAD
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎨 Initializing UX enhancements...');
  
  // Initialize components
  if (window.toast) {
    console.log('✅ Toast notifications ready');
  }
  
  if (window.darkMode) {
    console.log('✅ Dark mode ready');
    // Sync dark mode toggle in settings
    const darkModeToggle = document.getElementById('darkMode');
    if (darkModeToggle) {
      darkModeToggle.checked = window.darkMode.getTheme() === 'dark';
      darkModeToggle.addEventListener('change', (e) => {
        window.darkMode.toggle();
      });
    }
  }
  
  if (window.quickActions) {
    console.log('✅ Quick actions ready');
  }
  
  if (window.analytics) {
    console.log('✅ Analytics ready');
    // Load insights when tab is clicked
    const insightsTab = document.querySelector('[data-tab="insights"]');
    if (insightsTab) {
      insightsTab.addEventListener('click', loadInsightsTab);
    }
  }
  
  // Add contact right-click handlers
  setupContactContextMenus();
  
  // Add bulk actions setup
  setupBulkActions();
  
  console.log('✨ All enhancements initialized!');
});

// ========================================
// ANALYTICS/INSIGHTS TAB
// ========================================

async function loadInsightsTab() {
  const contentDiv = document.getElementById('analyticsContent');
  const loadingDiv = document.getElementById('insightsLoading');
  
  if (!contentDiv) return;
  
  // Show loading
  if (loadingDiv) loadingDiv.style.display = 'block';
  contentDiv.innerHTML = '<div class="empty-state">Loading insights...</div>';
  
  try {
    const insights = await window.analytics.getInsights();
    const html = window.analytics.renderInsightsHTML(insights);
    contentDiv.innerHTML = html;
    
    if (loadingDiv) loadingDiv.style.display = 'none';
    
    // Show success toast
    if (window.toast) {
      window.toast.success('📊 Insights loaded!', 1500);
    }
  } catch (error) {
    console.error('Failed to load insights:', error);
    contentDiv.innerHTML = `
      <div class="empty-state-deluxe">
        <div class="empty-icon">😕</div>
        <h3>Couldn't load insights</h3>
        <p>${error.message}</p>
        <button class="btn-primary" onclick="loadInsightsTab()">
          🔄 Try Again
        </button>
      </div>
    `;
    
    if (window.toast) {
      window.toast.error('Failed to load insights');
    }
  }
}

// Make loadInsightsTab global for onclick handlers
window.loadInsightsTab = loadInsightsTab;

// ========================================
// QUICK ACTIONS (RIGHT-CLICK MENUS)
// ========================================

function setupContactContextMenus() {
  // Add context menu to all contact items
  document.addEventListener('contextmenu', (e) => {
    // Find if click was on a contact item
    const contactItem = e.target.closest('.contact-item, .contacts-table tbody tr');
    
    if (contactItem && contactItem.dataset.contactId) {
      e.preventDefault();
      
      // Get contact data
      const contactId = contactItem.dataset.contactId;
      getContactById(contactId).then(contact => {
        if (contact) {
          window.quickActions.show(contact, e.clientX, e.clientY);
        }
      });
    }
  });
  
  console.log('✅ Contact context menus enabled (right-click contacts)');
}

// Helper to get contact by ID
async function getContactById(id) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['contacts'], (result) => {
      const contacts = result.contacts || [];
      const contact = contacts.find(c => c.id === id);
      resolve(contact);
    });
  });
}

// Expose functions for quick actions
window.toggleFavoriteContact = async (contactId) => {
  const contacts = await new Promise(resolve => {
    chrome.storage.local.get(['contacts'], result => resolve(result.contacts || []));
  });
  
  const contact = contacts.find(c => c.id === contactId);
  if (contact) {
    contact.favorite = !contact.favorite;
    await chrome.storage.local.set({ contacts });
    
    // Refresh display
    if (typeof renderContacts === 'function') {
      renderContacts();
    }
    
    // Clear analytics cache
    window.analytics.clearCache();
  }
};

window.toggleContactStatus = async (contactId) => {
  const contacts = await new Promise(resolve => {
    chrome.storage.local.get(['contacts'], result => resolve(result.contacts || []));
  });
  
  const contact = contacts.find(c => c.id === contactId);
  if (contact) {
    contact.status = contact.status === 'approved' ? 'pending' : 'approved';
    await chrome.storage.local.set({ contacts });
    
    // Refresh display
    if (typeof renderContacts === 'function') {
      renderContacts();
    }
    
    // Clear analytics cache
    window.analytics.clearCache();
  }
};

window.deleteContactById = async (contactId) => {
  const contacts = await new Promise(resolve => {
    chrome.storage.local.get(['contacts'], result => resolve(result.contacts || []));
  });
  
  const updatedContacts = contacts.filter(c => c.id !== contactId);
  await chrome.storage.local.set({ contacts: updatedContacts });
  
  // Refresh display
  if (typeof renderContacts === 'function') {
    renderContacts();
  }
  
  // Clear analytics cache
  window.analytics.clearCache();
};

window.openNoteDialog = (contact) => {
  const note = prompt(`Add note for ${contact.name}:`, '');
  if (note) {
    // Add note to contact
    chrome.storage.local.get(['contacts'], async (result) => {
      const contacts = result.contacts || [];
      const contactToUpdate = contacts.find(c => c.id === contact.id);
      if (contactToUpdate) {
        if (!contactToUpdate.notes) contactToUpdate.notes = [];
        contactToUpdate.notes.push({
          text: note,
          date: new Date().toISOString(),
          author: 'You'
        });
        await chrome.storage.local.set({ contacts });
        
        if (window.toast) {
          window.toast.success('Note added!');
        }
      }
    });
  }
};

// ========================================
// BULK ACTIONS
// ========================================

let bulkMode = false;
const selectedContacts = new Set();

function setupBulkActions() {
  // Add bulk actions bar to DOM if not exists
  const container = document.querySelector('.popup-container');
  if (!container) return;
  
  let bulkBar = document.getElementById('bulkActionsBar');
  if (!bulkBar) {
    bulkBar = document.createElement('div');
    bulkBar.id = 'bulkActionsBar';
    bulkBar.className = 'bulk-actions-bar';
    bulkBar.style.display = 'none';
    bulkBar.innerHTML = `
      <span id="selectedCount" style="font-weight: 600;">0 selected</span>
      <button onclick="bulkApprove()">✅ Approve</button>
      <button onclick="bulkExport()">📥 Export</button>
      <button onclick="bulkDelete()">🗑️ Delete</button>
      <button onclick="cancelBulkMode()">Cancel</button>
    `;
    container.insertBefore(bulkBar, container.firstChild);
  }
  
  // Add "Select Multiple" button to all contacts tab
  const allContactsTab = document.getElementById('all-contacts-tab');
  if (allContactsTab && !document.getElementById('bulkModeBtn')) {
    const searchSection = allContactsTab.querySelector('.search-section');
    if (searchSection) {
      const bulkBtn = document.createElement('button');
      bulkBtn.id = 'bulkModeBtn';
      bulkBtn.className = 'btn-secondary';
      bulkBtn.style.cssText = 'margin-top: 12px;';
      bulkBtn.innerHTML = '☑️ Select Multiple';
      bulkBtn.onclick = toggleBulkMode;
      searchSection.appendChild(bulkBtn);
    }
  }
  
  console.log('✅ Bulk actions ready');
}

function toggleBulkMode() {
  bulkMode = !bulkMode;
  document.body.classList.toggle('bulk-mode', bulkMode);
  
  const bulkBar = document.getElementById('bulkActionsBar');
  const bulkBtn = document.getElementById('bulkModeBtn');
  
  if (bulkMode) {
    if (bulkBar) bulkBar.style.display = 'flex';
    if (bulkBtn) bulkBtn.innerHTML = '❌ Cancel Selection';
    if (window.toast) window.toast.info('Bulk mode active. Click contacts to select.');
  } else {
    if (bulkBar) bulkBar.style.display = 'none';
    if (bulkBtn) bulkBtn.innerHTML = '☑️ Select Multiple';
    selectedContacts.clear();
    updateSelectedCount();
  }
}

window.toggleBulkMode = toggleBulkMode;

function updateSelectedCount() {
  const countSpan = document.getElementById('selectedCount');
  if (countSpan) {
    countSpan.textContent = `${selectedContacts.size} selected`;
  }
}

window.cancelBulkMode = () => {
  bulkMode = false;
  toggleBulkMode();
};

window.bulkApprove = async () => {
  if (selectedContacts.size === 0) {
    if (window.toast) window.toast.warning('No contacts selected');
    return;
  }
  
  const contacts = await new Promise(resolve => {
    chrome.storage.local.get(['contacts'], result => resolve(result.contacts || []));
  });
  
  selectedContacts.forEach(id => {
    const contact = contacts.find(c => c.id === id);
    if (contact) contact.status = 'approved';
  });
  
  await chrome.storage.local.set({ contacts });
  
  if (window.toast) {
    window.toast.success(`✅ Approved ${selectedContacts.size} contacts!`);
  }
  
  selectedContacts.clear();
  toggleBulkMode();
  if (typeof renderContacts === 'function') renderContacts();
};

window.bulkExport = async () => {
  if (selectedContacts.size === 0) {
    if (window.toast) window.toast.warning('No contacts selected');
    return;
  }
  
  const contacts = await new Promise(resolve => {
    chrome.storage.local.get(['contacts'], result => resolve(result.contacts || []));
  });
  
  const selectedContactsData = contacts.filter(c => selectedContacts.has(c.id));
  
  // Export as CSV
  const csv = [
    'Name,Email,Company,Phone,Status',
    ...selectedContactsData.map(c => 
      `"${c.name}","${c.email}","${c.company || ''}","${c.phone || ''}","${c.status}"`
    )
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crmsync-selected-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  
  if (window.toast) {
    window.toast.success(`📥 Exported ${selectedContacts.size} contacts!`);
  }
};

window.bulkDelete = async () => {
  if (selectedContacts.size === 0) {
    if (window.toast) window.toast.warning('No contacts selected');
    return;
  }
  
  if (!confirm(`Delete ${selectedContacts.size} contacts? This cannot be undone.`)) {
    return;
  }
  
  const contacts = await new Promise(resolve => {
    chrome.storage.local.get(['contacts'], result => resolve(result.contacts || []));
  });
  
  const updatedContacts = contacts.filter(c => !selectedContacts.has(c.id));
  await chrome.storage.local.set({ contacts: updatedContacts });
  
  if (window.toast) {
    window.toast.success(`🗑️ Deleted ${selectedContacts.size} contacts`);
  }
  
  selectedContacts.clear();
  toggleBulkMode();
  if (typeof renderContacts === 'function') renderContacts();
};

// ========================================
// ENHANCE EXISTING FUNCTIONS WITH TOASTS
// ========================================

// Override alert() with toasts for better UX
const originalAlert = window.alert;
window.alert = function(message) {
  if (window.toast) {
    // Determine type based on message content
    if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
      window.toast.error(message);
    } else if (message.toLowerCase().includes('success')) {
      window.toast.success(message);
    } else if (message.toLowerCase().includes('warning')) {
      window.toast.warning(message);
    } else {
      window.toast.info(message);
    }
  } else {
    originalAlert(message);
  }
};

console.log('✨ Popup enhancements loaded!');
