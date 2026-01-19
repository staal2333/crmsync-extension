// Debug sign-in script - helps test different URL formats
(function() {
  'use strict';

  const extensionId = chrome.runtime.id;
  const websiteUrl = window.CONFIG?.WEBSITE_URL || 'https://www.crm-sync.net';

  // Display info
  document.getElementById('extensionInfo').textContent = 'Extension ID: ' + extensionId;
  document.getElementById('configInfo').textContent = JSON.stringify(window.CONFIG, null, 2);

  // Option 1: Parameters AFTER hash (current implementation)
  const url1 = websiteUrl + '/#/login?source=extension&extensionId=' + extensionId;
  document.getElementById('url1').textContent = url1;
  document.getElementById('test1').addEventListener('click', function() {
    chrome.tabs.create({ url: url1 });
  });

  // Option 2: Parameters BEFORE hash (might work better with SPAs)
  const url2 = websiteUrl + '/?source=extension&extensionId=' + extensionId + '#/login';
  document.getElementById('url2').textContent = url2;
  document.getElementById('test2').addEventListener('click', function() {
    chrome.tabs.create({ url: url2 });
  });

  // Option 3: Direct URL without params
  const url3 = websiteUrl + '/#/login';
  document.getElementById('url3').textContent = url3;
  document.getElementById('test3').addEventListener('click', function() {
    chrome.tabs.create({ url: url3 });
  });

  // Option 4: Using search/query params
  const url4 = websiteUrl + '/#/login?mode=extension&ext=' + encodeURIComponent(extensionId);
  document.getElementById('url4').textContent = url4;
  document.getElementById('test4').addEventListener('click', function() {
    chrome.tabs.create({ url: url4 });
  });
})();
