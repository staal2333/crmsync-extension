// Onboarding logic
let currentStep = 1;
const totalSteps = 5; // Updated to include exclude patterns step

// Settings state
const settings = {
  autoApprove: false,
  reminders: true,
  notifications: false
};

// User information
const userInfo = {
  firstName: '',
  lastName: '',
  company: '',
  email: '',
  phone: ''
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateProgress();
  setupEventListeners();
});

function setupEventListeners() {
  // Step 1 - Welcome
  document.getElementById('getStartedBtn')?.addEventListener('click', nextStep);
  document.getElementById('skipBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    skipOnboarding();
  });
  
  // Step 2 - Settings
  document.getElementById('autoApproveToggle')?.addEventListener('click', () => toggleSetting('autoApprove'));
  document.getElementById('remindersToggle')?.addEventListener('click', () => toggleSetting('reminders'));
  document.getElementById('notificationsToggle')?.addEventListener('click', () => toggleSetting('notifications'));
  document.getElementById('settingsBackBtn')?.addEventListener('click', prevStep);
  document.getElementById('settingsContinueBtn')?.addEventListener('click', saveSettingsAndContinue);
  
  // Step 3 - Auth
  document.getElementById('signInCard')?.addEventListener('click', chooseSignIn);
  document.getElementById('guestCard')?.addEventListener('click', chooseGuest);
  document.getElementById('authBackBtn')?.addEventListener('click', prevStep);
  
  // Step 4 - User Information
  document.getElementById('excludeBackBtn')?.addEventListener('click', prevStep);
  document.getElementById('excludeContinueBtn')?.addEventListener('click', saveUserInfoAndContinue);
  document.getElementById('skipExcludeBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    // Check which auth method was chosen
    const { onboardingAuthChoice } = await chrome.storage.local.get(['onboardingAuthChoice']);
    
    if (onboardingAuthChoice === 'signin') {
      // User chose to sign in - open login page (skip info collection)
      openLoginPage();
    } else {
      // User chose guest mode - go to Step 5 (All Set)
      nextStep();
    }
  });
  
  // Step 5 - Finish
  document.getElementById('finishBtn')?.addEventListener('click', finishOnboarding);
}

function updateProgress() {
  const progressFill = document.getElementById('progressFill');
  const progress = (currentStep / totalSteps) * 100;
  progressFill.style.width = `${progress}%`;
}

function showStep(stepNumber) {
  // Hide all steps
  document.querySelectorAll('.step').forEach(step => {
    step.classList.remove('active');
  });
  
  // Show current step
  const currentStepEl = document.querySelector(`[data-step="${stepNumber}"]`);
  if (currentStepEl) {
    currentStepEl.classList.add('active');
  }
  
  currentStep = stepNumber;
  updateProgress();
}

function nextStep() {
  if (currentStep < totalSteps) {
    showStep(currentStep + 1);
  }
}

function prevStep() {
  if (currentStep > 1) {
    showStep(currentStep - 1);
  }
}

function toggleSetting(settingName) {
  settings[settingName] = !settings[settingName];
  const toggle = document.getElementById(`${settingName}Toggle`);
  
  if (settings[settingName]) {
    toggle.classList.add('active');
  } else {
    toggle.classList.remove('active');
  }
}

async function saveSettingsAndContinue() {
  try {
    // Save basic settings to chrome storage
    await chrome.storage.sync.set({
      autoApproveContacts: settings.autoApprove,
      reminderDays: settings.reminders ? 30 : 0,
      emailNotifications: settings.notifications
    });
    
    console.log('✅ Basic settings saved:', settings);
    nextStep();
  } catch (error) {
    console.error('Error saving settings:', error);
    nextStep(); // Continue anyway
  }
}

// Track which auth method user chose
let selectedAuthMethod = null;

// New functions for auth choice
async function chooseSignIn() {
  // User chose to sign in - save choice and go to Step 4 to collect their info first
  selectedAuthMethod = 'signin';
  await chrome.storage.local.set({ onboardingAuthChoice: 'signin' });
  console.log('✅ User chose Sign In, moving to info collection');
  nextStep(); // Go to Step 4
}

async function chooseGuest() {
  // User chose guest mode - save choice and go to Step 4 to collect their info
  selectedAuthMethod = 'guest';
  await chrome.storage.local.set({ 
    isGuest: true,
    onboardingAuthChoice: 'guest'
  });
  console.log('✅ User chose Guest mode, moving to info collection');
  nextStep(); // Go to Step 4
}

async function saveUserInfoAndContinue() {
  try {
    // Get user inputs
    const firstName = document.getElementById('userFirstName')?.value.trim();
    const lastName = document.getElementById('userLastName')?.value.trim();
    const company = document.getElementById('userCompany')?.value.trim();
    const email = document.getElementById('userEmail')?.value.trim();
    const phone = document.getElementById('userPhone')?.value.trim();
    
    // Prepare exclusion arrays (matching Settings structure)
    const excludeNames = [];
    const excludeDomains = [];
    const excludePhones = [];
    
    // Add full name to exclude names
    if (firstName && lastName) {
      const fullName = `${firstName} ${lastName}`;
      excludeNames.push(fullName);
    } else if (firstName) {
      excludeNames.push(firstName);
    } else if (lastName) {
      excludeNames.push(lastName);
    }
    
    // Add company name to exclude names if provided
    if (company) {
      excludeNames.push(company);
    }
    
    // Extract domain from email and add to exclude domains
    if (email) {
      const emailParts = email.split('@');
      if (emailParts.length === 2) {
        const domain = emailParts[1].toLowerCase();
        excludeDomains.push(domain);
      }
      // Also add the full email as an exclude pattern
      excludeNames.push(email);
    }
    
    // Always exclude common system domains
    if (excludeDomains.length === 0) {
      excludeDomains.push('noreply.com', 'no-reply.com', 'notifications.com');
    }
    
    // Add phone number to exclude phones
    if (phone) {
      // Normalize phone number (remove spaces, dashes, etc.)
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      excludePhones.push(cleanPhone);
    }
    
    // Save to storage (matching Settings storage keys)
    await chrome.storage.sync.set({
      userFirstName: firstName || '',
      userLastName: lastName || '',
      userCompany: company || '',
      userEmail: email || '',
      userPhone: phone || '',
      excludeNames: excludeNames,
      excludeDomains: excludeDomains,
      excludePhones: excludePhones
    });
    
    console.log('✅ User info saved:', { firstName, lastName, company, email, phone });
    console.log('✅ Exclusions set:', { excludeNames, excludeDomains, excludePhones });
    
    // Check which auth method was chosen
    const { onboardingAuthChoice } = await chrome.storage.local.get(['onboardingAuthChoice']);
    
    if (onboardingAuthChoice === 'signin') {
      // User chose to sign in - open login page now (after collecting their info)
      console.log('✅ Info collected, opening login page...');
      openLoginPage();
    } else {
      // User chose guest mode - go to Step 5 (All Set)
      nextStep();
    }
  } catch (error) {
    console.error('Error saving user info:', error);
    // Still continue based on auth choice
    const { onboardingAuthChoice } = await chrome.storage.local.get(['onboardingAuthChoice']);
    if (onboardingAuthChoice === 'signin') {
      openLoginPage();
    } else {
      nextStep();
    }
  }
}

async function openLoginPage() {
  try {
    // Mark that user wants to sign in
    await chrome.storage.local.set({
      onboardingAuthChoice: 'signin',
      onboardingCompleted: true,
      hasSeenWelcome: true
    });
    
    // Generate extension ID for callback
    const extensionId = chrome.runtime.id;
    
    // Open your website login page with extension ID as parameter
    const websiteUrl = window.CONFIG?.WEBSITE_URL || 'https://www.crm-sync.net';
    const loginPath = window.CONFIG?.AUTH?.LOGIN || '/#/login';
    
    // For hash routing, put params BEFORE the hash
    const loginUrl = `${websiteUrl}?source=extension&extensionId=${extensionId}${loginPath}`;
    
    console.log('✅ Opening website login page:', loginUrl);
    
    // Open login page in new tab
    await chrome.tabs.create({ 
      url: loginUrl
    });
    
    // Close onboarding after a short delay
    setTimeout(() => {
      window.close();
    }, 500);
  } catch (error) {
    console.error('Error opening login page:', error);
    // Fallback: try to open anyway
    const websiteUrl = 'https://www.crm-sync.net';
    chrome.tabs.create({ 
      url: `${websiteUrl}/#/login?source=extension`
    });
    window.close();
  }
}

async function continueAsGuest() {
  try {
    // Set guest mode
    await chrome.storage.local.set({
      isGuest: true,
      hasSeenWelcome: true,
      onboardingAuthChoice: 'guest'
    });
    
    console.log('✅ Set to guest mode, will complete at end');
    nextStep(); // Go to exclude patterns
  } catch (error) {
    console.error('Error setting guest mode:', error);
    nextStep();
  }
}

async function finishOnboarding() {
  try {
    // Get the auth choice
    const { onboardingAuthChoice } = await chrome.storage.local.get(['onboardingAuthChoice']);
    
    // Mark onboarding as completed
    await chrome.storage.local.set({
      onboardingCompleted: true,
      hasSeenWelcome: true
    });
    
    console.log('✅ Onboarding completed!');
    
    // If user chose to sign in, open login page
    if (onboardingAuthChoice === 'signin') {
      await openLoginPage();
      return;
    }
    
    // Otherwise, close and optionally open Gmail
    window.close();
    
    // Try to open Gmail for guest users
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0] || tabs[0].url.includes('onboarding.html')) {
        // If no active tab or we're on onboarding, open Gmail
        chrome.tabs.create({ 
          url: 'https://mail.google.com'
        });
      }
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    window.close();
  }
}

async function skipOnboarding() {
  const confirmed = confirm(
    'Skip onboarding?\n\n' +
    'You can always configure settings later from the extension popup.'
  );
  
  if (confirmed) {
    await chrome.storage.local.set({
      onboardingCompleted: true,
      hasSeenWelcome: true,
      isGuest: true
    });
    
    window.close();
  }
}

async function completeOnboarding() {
  await chrome.storage.local.set({
    onboardingCompleted: true,
    hasSeenWelcome: true
  });
  
  window.close();
}

