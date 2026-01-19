// Payment success script - handles notifying extension of successful payment
(function() {
  'use strict';

  // Notify the extension that payment was successful
  document.getElementById('closeBtn').addEventListener('click', () => {
    // Send message to extension
    chrome.runtime.sendMessage({ 
      type: 'PAYMENT_SUCCESS' 
    }, () => {
      // Close this tab
      window.close();
    });
  });

  // Auto-notify after 2 seconds
  setTimeout(() => {
    chrome.runtime.sendMessage({ 
      type: 'PAYMENT_SUCCESS' 
    });
  }, 2000);

  // Also close automatically after 5 seconds
  setTimeout(() => {
    window.close();
  }, 5000);
})();
