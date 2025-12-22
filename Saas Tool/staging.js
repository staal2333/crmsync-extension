// =====================================================
// UNIFIED CONTACT MANAGEMENT & CRM SYNC HUB
// =====================================================
// This module handles the staging area between App Layer and CRM Layer

/**
 * Update staging dashboard with current counts
 */
async function updateStagingDashboard() {
  try {
    const contacts = await getContacts();
    
    // Count by source
    const localCount = contacts.filter(c => c.source === 'local').length;
    const hybridCount = contacts.filter(c => c.source === 'hybrid' || c.hasPendingUpdates).length;
    const crmCount = contacts.filter(c => c.source === 'crm').length;
    
    // Update UI
    const localEl = document.getElementById('localContactsCount');
    const hybridEl = document.getElementById('hybridContactsCount');
    const crmEl = document.getElementById('crmContactsCount');
    const pushBtn = document.getElementById('pushAllLocalBtn');
    const reviewBtn = document.getElementById('reviewUpdatesBtn');
    
    if (localEl) localEl.textContent = localCount;
    if (hybridEl) hybridEl.textContent = hybridCount;
    if (crmEl) crmEl.textContent = crmCount;
    
    // Show/hide action buttons
    if (pushBtn) {
      pushBtn.style.display = localCount > 0 ? 'block' : 'none';
    }
    if (reviewBtn) {
      reviewBtn.style.display = hybridCount > 0 ? 'block' : 'none';
    }
    
    console.log(`📊 Staging Dashboard: ${localCount} local, ${hybridCount} hybrid, ${crmCount} CRM`);
  } catch (error) {
    console.error('Error updating staging dashboard:', error);
  }
}

/**
 * Get contacts helper function
 */
async function getContacts() {
  const result = await chrome.storage.local.get(['contacts']);
  return result.contacts || [];
}

/**
 * Save contacts helper function
 */
async function saveContacts(contacts) {
  await chrome.storage.local.set({ contacts });
}

/**
 * Push a local contact to CRM
 * @param {Object} contact - Contact to push
 * @param {string} platform - 'hubspot' or 'salesforce'
 */
async function pushLocalToCRM(contact, platform) {
  try {
    // Validate it's a local contact
    if (contact.source !== 'local') {
      throw new Error('Only local contacts can be pushed as new. Use merge for hybrid contacts.');
    }
    
    // Use existing sync logic from integrations.js
    if (window.integrationManager) {
      const result = await window.integrationManager.syncContact(contact, platform);
      
      // Update contact to CRM source
      const contacts = await getContacts();
      const index = contacts.findIndex(c => c.email === contact.email);
      
      if (index >= 0) {
        contacts[index] = {
          ...contacts[index],
          source: 'crm',
          crmSnapshot: { ...contacts[index] },
          lastSyncedAt: new Date().toISOString(),
          crmMappings: {
            ...contacts[index].crmMappings,
            [platform]: result.crmContactId || true
          }
        };
        
        await saveContacts(contacts);
        console.log(`✅ Contact pushed to ${platform} and marked as CRM source`);
      }
      
      return result;
    } else {
      throw new Error('Integration manager not initialized');
    }
  } catch (error) {
    console.error('Error pushing local contact to CRM:', error);
    throw error;
  }
}

/**
 * Push all local contacts to CRM
 */
async function pushAllLocalToCRM() {
  try {
    const contacts = await getContacts();
    const localContacts = contacts.filter(c => c.source === 'local');
    
    if (localContacts.length === 0) {
      alert('No local contacts to push!');
      return;
    }
    
    // Determine which platform to push to
    const hubspotConnected = window.integrationManager?.statusCache?.hubspot?.connected;
    const salesforceConnected = window.integrationManager?.statusCache?.salesforce?.connected;
    
    if (!hubspotConnected && !salesforceConnected) {
      alert('Please connect to HubSpot or Salesforce first!');
      return;
    }
    
    const platform = hubspotConnected ? 'hubspot' : 'salesforce';
    const platformName = hubspotConnected ? 'HubSpot' : 'Salesforce';
    
    const confirmed = confirm(
      `Push ${localContacts.length} new contact${localContacts.length !== 1 ? 's' : ''} to ${platformName}?\n\n` +
      `This will create ${localContacts.length} new record${localContacts.length !== 1 ? 's' : ''} in your CRM.`
    );
    
    if (!confirmed) return;
    
    const pushBtn = document.getElementById('pushAllLocalBtn');
    if (pushBtn) {
      pushBtn.disabled = true;
      pushBtn.textContent = '⏳ Pushing...';
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < localContacts.length; i++) {
      const contact = localContacts[i];
      
      if (pushBtn) {
        pushBtn.textContent = `⏳ ${i + 1}/${localContacts.length}`;
      }
      
      try {
        await pushLocalToCRM(contact, platform);
        successCount++;
      } catch (error) {
        console.error(`Failed to push ${contact.email}:`, error);
        failCount++;
      }
    }
    
    if (pushBtn) {
      pushBtn.disabled = false;
      pushBtn.textContent = 'Push All to CRM';
    }
    
    alert(
      `✅ Push complete!\n\n` +
      `${successCount} contact${successCount !== 1 ? 's' : ''} successfully pushed to ${platformName}` +
      `${failCount > 0 ? `\n❌ ${failCount} failed` : ''}`
    );
    
    // Refresh UI
    await updateStagingDashboard();
    if (window.loadContacts) {
      await window.loadContacts();
    }
    
  } catch (error) {
    console.error('Error pushing all local contacts:', error);
    alert('❌ Error: ' + error.message);
  }
}

/**
 * Show diff viewer for a hybrid contact
 * @param {Object} contact - Hybrid contact to review
 */
function showDiffViewer(contact) {
  if (contact.source !== 'hybrid') {
    console.warn('Only hybrid contacts can be reviewed');
    return;
  }
  
  const overlay = document.getElementById('diffModalOverlay');
  const emailEl = document.getElementById('diffContactEmail');
  const crmSnapshot = document.getElementById('crmDataSnapshot');
  const localSnapshot = document.getElementById('localDataSnapshot');
  
  if (!overlay) return;
  
  // Set email
  if (emailEl) {
    emailEl.textContent = contact.email;
  }
  
  // Render CRM data
  if (crmSnapshot && contact.crmSnapshot) {
    crmSnapshot.innerHTML = renderDataFields(contact.crmSnapshot);
  }
  
  // Render local data with changes highlighted
  if (localSnapshot) {
    const localData = { ...contact };
    delete localData.crmSnapshot;
    delete localData.pendingChanges;
    localSnapshot.innerHTML = renderDataFields(localData, contact.pendingChanges);
  }
  
  // Store current contact for actions
  window.currentDiffContact = contact;
  
  // Show modal
  overlay.style.display = 'flex';
}

/**
 * Render data fields for diff viewer
 */
function renderDataFields(data, changedFields = {}) {
  const fields = ['firstName', 'lastName', 'company', 'title', 'phone', 'email'];
  
  return fields.map(field => {
    const value = data[field] || 'N/A';
    const isChanged = changedFields && changedFields[field] !== undefined;
    const badge = isChanged ? '<span style="background: #fbbf24; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; margin-left: 8px;">UPDATED</span>' : '';
    
    return `
      <div style="margin-bottom: 12px; ${isChanged ? 'background: #fef3c7; padding: 8px; border-radius: 4px; border-left: 3px solid #f59e0b;' : ''}">
        <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px;">
          ${field}${badge}
        </label>
        <span style="font-size: 14px; color: #1e293b; font-weight: ${isChanged ? '600' : '400'};">
          ${value}
        </span>
      </div>
    `;
  }).join('');
}

/**
 * Merge hybrid contact updates to CRM
 */
async function mergeHybridToCRM() {
  try {
    const contact = window.currentDiffContact;
    if (!contact) return;
    
    const hubspotConnected = window.integrationManager?.statusCache?.hubspot?.connected;
    const salesforceConnected = window.integrationManager?.statusCache?.salesforce?.connected;
    
    if (!hubspotConnected && !salesforceConnected) {
      alert('No CRM connected!');
      return;
    }
    
    const platform = hubspotConnected ? 'hubspot' : 'salesforce';
    
    // Push update to CRM
    await window.integrationManager.syncContact(contact, platform);
    
    // Update contact source to 'crm' (no longer hybrid)
    const contacts = await getContacts();
    const index = contacts.findIndex(c => c.email === contact.email);
    
    if (index >= 0) {
      contacts[index] = {
        ...contacts[index],
        source: 'crm',
        crmSnapshot: { ...contacts[index] },
        pendingChanges: null,
        hasPendingUpdates: false,
        lastSyncedAt: new Date().toISOString()
      };
      
      await saveContacts(contacts);
    }
    
    // Close modal
    document.getElementById('diffModalOverlay').style.display = 'none';
    
    alert('✅ Changes merged to CRM successfully!');
    
    // Refresh UI
    await updateStagingDashboard();
    if (window.loadContacts) {
      await window.loadContacts();
    }
    
  } catch (error) {
    console.error('Error merging to CRM:', error);
    alert('❌ Error: ' + error.message);
  }
}

/**
 * Discard local changes and revert to CRM snapshot
 */
async function discardLocalChanges() {
  try {
    const contact = window.currentDiffContact;
    if (!contact) return;
    
    const confirmed = confirm(
      'Discard all local changes and revert to CRM data?\n\n' +
      'This action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    const contacts = await getContacts();
    const index = contacts.findIndex(c => c.email === contact.email);
    
    if (index >= 0 && contact.crmSnapshot) {
      // Revert to CRM snapshot
      contacts[index] = {
        ...contacts[index],
        ...contact.crmSnapshot,
        source: 'crm',
        pendingChanges: null,
        hasPendingUpdates: false
      };
      
      await saveContacts(contacts);
    }
    
    // Close modal
    document.getElementById('diffModalOverlay').style.display = 'none';
    
    alert('✅ Local changes discarded. Contact reverted to CRM data.');
    
    // Refresh UI
    await updateStagingDashboard();
    if (window.loadContacts) {
      await window.loadContacts();
    }
    
  } catch (error) {
    console.error('Error discarding changes:', error);
    alert('❌ Error: ' + error.message);
  }
}

/**
 * Review all hybrid contacts (show list)
 */
async function reviewAllUpdates() {
  try {
    const contacts = await getContacts();
    const hybridContacts = contacts.filter(c => c.source === 'hybrid' || c.hasPendingUpdates);
    
    if (hybridContacts.length === 0) {
      alert('No pending updates to review!');
      return;
    }
    
    // Show first hybrid contact
    showDiffViewer(hybridContacts[0]);
    
    // Store list for next/prev navigation
    window.hybridContactsList = hybridContacts;
    window.currentHybridIndex = 0;
    
  } catch (error) {
    console.error('Error reviewing updates:', error);
    alert('❌ Error: ' + error.message);
  }
}

// Initialize staging functionality
document.addEventListener('DOMContentLoaded', () => {
  // Update dashboard on load
  setTimeout(() => {
    updateStagingDashboard();
  }, 1000);
  
  // Push all local button
  const pushAllBtn = document.getElementById('pushAllLocalBtn');
  if (pushAllBtn) {
    pushAllBtn.addEventListener('click', pushAllLocalToCRM);
  }
  
  // Review updates button
  const reviewBtn = document.getElementById('reviewUpdatesBtn');
  if (reviewBtn) {
    reviewBtn.addEventListener('click', reviewAllUpdates);
  }
  
  // Diff modal close button
  const closeBtn = document.getElementById('closeDiffModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('diffModalOverlay').style.display = 'none';
    });
  }
  
  // Diff modal actions
  const mergeBtn = document.getElementById('mergeToCRMBtn');
  if (mergeBtn) {
    mergeBtn.addEventListener('click', mergeHybridToCRM);
  }
  
  const discardBtn = document.getElementById('discardLocalBtn');
  if (discardBtn) {
    discardBtn.addEventListener('click', discardLocalChanges);
  }
  
  const keepCRMBtn = document.getElementById('keepCRMBtn');
  if (keepCRMBtn) {
    keepCRMBtn.addEventListener('click', () => {
      document.getElementById('diffModalOverlay').style.display = 'none';
    });
  }
  
  // Click outside modal to close
  const overlay = document.getElementById('diffModalOverlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
      }
    });
  }
});

// Export functions for use in other scripts
window.UnifiedContactManagement = {
  updateStagingDashboard,
  pushLocalToCRM,
  pushAllLocalToCRM,
  showDiffViewer,
  mergeHybridToCRM,
  discardLocalChanges,
  reviewAllUpdates
};
