// Test backend script - CORS and connectivity testing
(function() {
  'use strict';

  async function testConnectivity() {
    var statusEl = document.getElementById('test1-status');
    var resultEl = document.getElementById('test1-result');
    var backendUrl = document.getElementById('backendUrl').value;

    statusEl.textContent = '⏳';
    resultEl.style.display = 'block';
    resultEl.innerHTML = 'Testing connectivity...';

    try {
      var response = await fetch(backendUrl + '/api/auth/login', {
        method: 'OPTIONS'
      });

      if (response.ok || response.status === 200 || response.status === 204) {
        statusEl.textContent = '✅';
        resultEl.innerHTML = '<span class="success">✓ Backend is online and responding!</span>\n\nStatus: ' + response.status + '\nBackend URL: ' + backendUrl;
      } else {
        statusEl.textContent = '❌';
        resultEl.innerHTML = '<span class="error">✗ Backend responded with status ' + response.status + '</span>\n\nThis might be okay if CORS is configured. Check Test 2.';
      }
    } catch (error) {
      statusEl.textContent = '❌';
      resultEl.innerHTML = '<span class="error">✗ Cannot connect to backend!</span>\n\nError: ' + error.message + '\n\nPossible causes:\n1. Backend is offline\n2. Wrong URL\n3. Network issue\n\nCheck your backend logs on Render.';
    }
  }

  async function testCORS() {
    var statusEl = document.getElementById('test2-status');
    var resultEl = document.getElementById('test2-result');
    var backendUrl = document.getElementById('backendUrl').value;
    var websiteDomain = document.getElementById('websiteDomain').value;

    statusEl.textContent = '⏳';
    resultEl.style.display = 'block';
    resultEl.innerHTML = 'Testing CORS configuration...';

    try {
      var response = await fetch(backendUrl + '/api/auth/login', {
        method: 'OPTIONS',
        headers: {
          'Origin': websiteDomain,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });

      var corsOrigin = response.headers.get('Access-Control-Allow-Origin');
      var corsMethods = response.headers.get('Access-Control-Allow-Methods');
      var corsHeaders = response.headers.get('Access-Control-Allow-Headers');

      if (corsOrigin && (corsOrigin === websiteDomain || corsOrigin === '*')) {
        statusEl.textContent = '✅';
        resultEl.innerHTML = '<span class="success">✓ CORS is configured correctly!</span>\n\nAllowed Origin: ' + corsOrigin + '\nAllowed Methods: ' + (corsMethods || 'Not specified') + '\nAllowed Headers: ' + (corsHeaders || 'Not specified') + '\n\nYour website can make requests to this backend.';
      } else {
        statusEl.textContent = '❌';
        resultEl.innerHTML = '<span class="error">✗ CORS is NOT configured!</span>\n\nExpected: ' + websiteDomain + '\nGot: ' + (corsOrigin || 'No CORS headers') + '\n\nYour backend needs to allow requests from your website domain.';
        showFixInstructions();
      }
    } catch (error) {
      statusEl.textContent = '❌';
      resultEl.innerHTML = '<span class="error">✗ CORS test failed!</span>\n\nError: ' + error.message + '\n\nThis usually means CORS is blocking the request.';
      showFixInstructions();
    }
  }

  async function testLogin() {
    var statusEl = document.getElementById('test3-status');
    var resultEl = document.getElementById('test3-result');
    var backendUrl = document.getElementById('backendUrl').value;
    var email = document.getElementById('testEmail').value;
    var password = document.getElementById('testPassword').value;

    statusEl.textContent = '⏳';
    resultEl.style.display = 'block';
    resultEl.innerHTML = 'Testing login endpoint...';

    try {
      var response = await fetch(backendUrl + '/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email, password: password })
      });

      var data = await response.json();

      if (response.ok) {
        statusEl.textContent = '✅';
        resultEl.innerHTML = '<span class="success">✓ Login endpoint works!</span>\n\nStatus: ' + response.status + '\nResponse: ' + JSON.stringify(data, null, 2) + '\n\nNote: You\'ll need valid credentials for actual login.';
      } else {
        statusEl.textContent = '⚠️';
        resultEl.innerHTML = '<span class="warning">⚠ Login endpoint responded</span>\n\nStatus: ' + response.status + '\nResponse: ' + JSON.stringify(data, null, 2) + '\n\nThis is expected with test credentials.\nTry with real credentials from your website.';
      }
    } catch (error) {
      statusEl.textContent = '❌';
      resultEl.innerHTML = '<span class="error">✗ Login test failed!</span>\n\nError: ' + error.message + '\n\nThis might be a CORS issue. Check Test 2.';
    }
  }

  function showFixInstructions() {
    var fixSection = document.getElementById('fixInstructions');
    var fixCode = document.getElementById('fixCode');
    var websiteDomain = document.getElementById('websiteDomain').value;

    fixSection.style.display = 'block';

    fixCode.innerHTML = 'const cors = require(\'cors\');\n\napp.use(cors({\n  origin: [\n    \'' + websiteDomain + '\',\n    \'http://localhost:3000\'\n  ],\n  credentials: true,\n  methods: [\'GET\', \'POST\', \'PUT\', \'DELETE\', \'OPTIONS\'],\n  allowedHeaders: [\'Content-Type\', \'Authorization\']\n}));\n\n// IMPORTANT: Add this BEFORE your routes!';
  }

  // Expose functions globally for button onclick
  window.testConnectivity = testConnectivity;
  window.testCORS = testCORS;
  window.testLogin = testLogin;
  window.showFixInstructions = showFixInstructions;

  // Auto-run tests on load
  window.addEventListener('load', function() {
    setTimeout(function() {
      testConnectivity();
      setTimeout(function() { testCORS(); }, 1000);
    }, 500);
  });
})();
