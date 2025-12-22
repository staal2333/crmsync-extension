// This page receives auth data from your website via URL parameters
// and sends it to the extension background script

(async function() {
  try {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userEmail = urlParams.get('email');
    const userName = urlParams.get('name');
    const userTier = urlParams.get('tier') || 'free';
    const firstName = urlParams.get('firstName') || '';
    const lastName = urlParams.get('lastName') || '';
    const avatar = urlParams.get('avatar') || '';
    
    console.log('🔐 Auth callback received:', { token, userEmail, userName, userTier });
    
    if (!token || !userEmail) {
      // No auth parameters - user might have navigated here by mistake
      // Redirect to login page instead
      console.warn('⚠️ No auth parameters found. Redirecting to login...');
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('error').style.display = 'none';
      document.getElementById('title').textContent = 'Redirecting...';
      document.getElementById('message').textContent = 'Taking you to the login page...';
      
      setTimeout(() => {
        window.location.href = chrome.runtime.getURL('login.html');
      }, 1000);
      return;
    }
    
    // Send auth data to background script
    const response = await chrome.runtime.sendMessage({
      action: 'authFromWebsite',
      data: {
        token: token,
        user: {
          email: userEmail,
          name: userName,
          firstName: firstName,
          lastName: lastName,
          tier: userTier,
          avatar: avatar
        }
      }
    });
    
    console.log('✅ Auth response:', response);
    
    if (response && response.success) {
      // Show success message
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('success').style.display = 'block';
      document.getElementById('title').textContent = 'Welcome to CRMSYNC!';
      document.getElementById('message').textContent = `You're now signed in as ${userName || userEmail} (${userTier.toUpperCase()} tier)`;
      
      // Close this tab after 2 seconds
      setTimeout(() => {
        window.close();
      }, 2000);
    } else {
      throw new Error(response?.message || 'Authentication failed');
    }
  } catch (error) {
    console.error('❌ Auth callback error:', error);
    
    // Show error message
    document.getElementById('spinner').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').textContent = `Error: ${error.message}`;
    document.getElementById('title').textContent = 'Sign In Failed';
    document.getElementById('message').textContent = 'Please try signing in again from the extension.';
    
    // Offer redirect to login
    setTimeout(() => {
      const retryLink = document.createElement('button');
      retryLink.textContent = 'Try Again';
      retryLink.style.cssText = `
        margin-top: 16px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      `;
      retryLink.onclick = () => {
        window.location.href = chrome.runtime.getURL('login.html');
      };
      document.querySelector('.container').appendChild(retryLink);
    }, 1000);
  }
})();
