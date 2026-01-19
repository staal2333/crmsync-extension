// Payment cancel script - handles cancelled payment flow
(function() {
  'use strict';

  document.getElementById('tryAgainBtn').addEventListener('click', () => {
    // Redirect to pricing page
    const websiteUrl = 'https://www.crm-sync.net';
    window.location.href = websiteUrl + '/#/pricing?source=extension';
  });

  document.getElementById('closeBtn').addEventListener('click', () => {
    window.close();
  });

  // Auto-close after 10 seconds
  setTimeout(() => {
    window.close();
  }, 10000);
})();
