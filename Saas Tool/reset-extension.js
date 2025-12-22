// =====================================================
// RESET EXTENSION - Clean Install Tester
// =====================================================
// Run this in the browser console (F12) on the extension popup
// Or from chrome://extensions > CRMSYNC > Service Worker > Console

(async function resetExtension() {
  console.log('🧹 Starting extension reset...');
  
  try {
    // Clear all local storage
    await chrome.storage.local.clear();
    console.log('✅ Cleared local storage');
    
    // Clear all sync storage
    await chrome.storage.sync.clear();
    console.log('✅ Cleared sync storage');
    
    // Set default settings
    const defaultSettings = {
      darkMode: false,
      autoApprove: true,
      reminderDays: 3,
      sidebarEnabled: true,
      trackedLabels: [],
      noReplyAfterDays: [3, 7, 14],
      soundEffects: false,
      hotkeysEnabled: false
    };
    
    await chrome.storage.local.set({
      contacts: [],
      settings: defaultSettings,
      isGuest: false,
      isAuthenticated: false,
      hasSeenWelcome: false
    });
    
    await chrome.storage.sync.set({
      settings: defaultSettings,
      userTier: 'free',
      autoSyncEnabled: false
    });
    
    console.log('✅ Reset to default settings');
    
    // Clear any notifications
    chrome.notifications.getAll((notifications) => {
      Object.keys(notifications).forEach(id => {
        chrome.notifications.clear(id);
      });
    });
    
    console.log('✅ Cleared notifications');
    
    console.log('');
    console.log('🎉 EXTENSION RESET COMPLETE!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Close this popup/console');
    console.log('2. Reload the extension (chrome://extensions → Reload)');
    console.log('3. Open the extension popup again');
    console.log('4. You should see the welcome screen!');
    console.log('');
    console.log('⚠️ Note: If popup is still open, it will reload automatically in 2 seconds...');
    
    // Reload popup if this is running in popup context
    setTimeout(() => {
      if (window.location.href.includes('popup.html')) {
        window.location.reload();
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
  }
})();
