// Login page logic for CRMSYNC Extension

document.addEventListener('DOMContentLoaded', () => {
  // Check if already authenticated
  checkAuthStatus();
  
  // View switching
  setupViewSwitching();
  
  // Form handlers
  setupLoginForm();
  setupRegisterForm();
  
  // Google OAuth handlers
  setupGoogleAuth();
  
  // Guest mode handler
  setupGuestMode();
});

async function checkAuthStatus() {
  const isAuth = await window.CRMSyncAuth.isAuthenticated();
  if (isAuth) {
    // Already logged in, close login page and open popup
    window.close();
    chrome.action.openPopup();
  }
}

function setupViewSwitching() {
  const showRegisterBtn = document.getElementById('showRegister');
  const showLoginBtn = document.getElementById('showLogin');
  const loginView = document.getElementById('loginView');
  const registerView = document.getElementById('registerView');
  
  showRegisterBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    loginView.classList.remove('active');
    registerView.classList.add('active');
    clearMessages();
  });
  
  showLoginBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    registerView.classList.remove('active');
    loginView.classList.add('active');
    clearMessages();
  });
}

function setupLoginForm() {
  const form = document.getElementById('loginForm');
  const submitBtn = document.getElementById('loginBtn');
  
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      showError('loginError', 'Please enter both email and password');
      return;
    }
    
    // Show loading
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    clearMessages();
    
    try {
      await window.CRMSyncAuth.signInWithEmail(email, password);
      
      // Initialize sync after login
      if (window.CRMSyncManager) {
        await window.CRMSyncManager.init();
      }
      
      // Show success and redirect
      showSuccess('loginError', 'Login successful! Redirecting...');
      
      setTimeout(() => {
        window.close();
        chrome.action.openPopup();
      }, 1000);
    } catch (error) {
      showError('loginError', error.message || 'Login failed. Please check your credentials.');
    } finally {
      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;
    }
  });
}

function setupRegisterForm() {
  const form = document.getElementById('registerForm');
  const submitBtn = document.getElementById('registerBtn');
  
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    if (!email || !password) {
      showError('registerError', 'Please enter both email and password');
      return;
    }
    
    if (password.length < 8) {
      showError('registerError', 'Password must be at least 8 characters');
      return;
    }
    
    // Show loading
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    clearMessages();
    
    try {
      await window.CRMSyncAuth.registerWithEmail(email, password, name || undefined);
      
      // Initialize sync after registration
      if (window.CRMSyncManager) {
        await window.CRMSyncManager.init();
      }
      
      // Show success message
      showSuccess('registerSuccess', 'Account created successfully! Redirecting...');
      
      setTimeout(() => {
        window.close();
        chrome.action.openPopup();
      }, 1500);
    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message.includes('already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError('registerError', errorMessage);
    } finally {
      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;
    }
  });
}

function setupGoogleAuth() {
  const googleSignInBtn = document.getElementById('googleSignInBtn');
  const googleSignUpBtn = document.getElementById('googleSignUpBtn');
  
  const handleGoogleAuth = async (button) => {
    button.classList.add('btn-loading');
    button.disabled = true;
    clearMessages();
    
    try {
      await window.CRMSyncAuth.signInWithGoogle();
      
      // Initialize sync after login
      if (window.CRMSyncManager) {
        await window.CRMSyncManager.init();
      }
      
      // Show success and redirect
      const messageId = button.id === 'googleSignInBtn' ? 'loginError' : 'registerSuccess';
      showSuccess(messageId, 'Google sign in successful! Redirecting...');
      
      setTimeout(() => {
        window.close();
        chrome.action.openPopup();
      }, 1000);
    } catch (error) {
      const messageId = button.id === 'googleSignInBtn' ? 'loginError' : 'registerError';
      showError(messageId, error.message || 'Google sign in failed. Please try again.');
    } finally {
      button.classList.remove('btn-loading');
      button.disabled = false;
    }
  };
  
  googleSignInBtn?.addEventListener('click', () => handleGoogleAuth(googleSignInBtn));
  googleSignUpBtn?.addEventListener('click', () => handleGoogleAuth(googleSignUpBtn));
}

function setupGuestMode() {
  const continueOfflineBtn = document.getElementById('continueOffline');
  
  continueOfflineBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const confirmed = confirm(
      'Continue in offline mode?\n\n' +
      'Your contacts will only be saved on this device and won\'t sync across browsers or computers.\n\n' +
      'You can sign up later to enable cloud sync.'
    );
    
    if (confirmed) {
      await window.CRMSyncAuth.continueAsGuest();
      
      // Close login page and open main extension
      window.close();
      chrome.action.openPopup();
    }
  });
}

function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.classList.add('show');
    element.classList.remove('success-message');
    element.classList.add('error-message');
  }
}

function showSuccess(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.classList.add('show');
    element.classList.remove('error-message');
    element.classList.add('success-message');
  }
}

function clearMessages() {
  const messages = document.querySelectorAll('.error-message, .success-message');
  messages.forEach(msg => {
    msg.classList.remove('show');
    msg.textContent = '';
  });
}

