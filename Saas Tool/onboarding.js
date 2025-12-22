// =====================================================
// CRMSYNC Onboarding Flow
// =====================================================

let currentStep = 1;
const totalSteps = 5;
const userPreferences = {
  autoSync: false,
  autoApprove: true,
  sidebar: true,
  notifications: false
};

document.addEventListener('DOMContentLoaded', () => {
  initializeOnboarding();
});

function initializeOnboarding() {
  // Setup toggle switches
  setupToggles();
  
  // Step 1: Welcome
  document.getElementById('getStartedBtn')?.addEventListener('click', () => {
    goToStep(2);
  });
  
  document.getElementById('skipAllBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    finishOnboarding(true);
  });
  
  // Step 2: Features
  document.getElementById('featuresBackBtn')?.addEventListener('click', () => {
    goToStep(1);
  });
  
  document.getElementById('featuresContinueBtn')?.addEventListener('click', () => {
    goToStep(3);
  });
  
  // Step 3: Auth Method
  document.getElementById('signInCard')?.addEventListener('click', () => {
    // Mark that user wants to sign in
    chrome.storage.local.set({ wantsToSignIn: true });
    goToStep(4);
  });
  
  document.getElementById('guestCard')?.addEventListener('click', () => {
    // Mark as guest mode
    chrome.storage.local.set({ isGuest: true, guestModeChosenAt: new Date().toISOString() });
    goToStep(4);
  });
  
  document.getElementById('authBackBtn')?.addEventListener('click', () => {
    goToStep(2);
  });
  
  // Step 4: Settings
  document.getElementById('settingsBackBtn')?.addEventListener('click', () => {
    goToStep(3);
  });
  
  document.getElementById('settingsContinueBtn')?.addEventListener('click', () => {
    saveSettings();
    goToStep(5);
  });
  
  // Step 5: Finish
  document.getElementById('finishBtn')?.addEventListener('click', () => {
    finishOnboarding(false);
  });
}

function setupToggles() {
  const toggles = document.querySelectorAll('.toggle-switch');
  
  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      const setting = toggle.getAttribute('data-setting');
      if (setting) {
        userPreferences[setting] = toggle.classList.contains('active');
      }
    });
  });
}

function goToStep(step) {
  // Hide current step
  const currentStepEl = document.querySelector('.step.active');
  if (currentStepEl) {
    currentStepEl.classList.remove('active');
  }
  
  // Show new step
  const newStepEl = document.querySelector(`.step[data-step="${step}"]`);
  if (newStepEl) {
    newStepEl.classList.add('active');
  }
  
  // Update progress bar
  currentStep = step;
  const progress = (step / totalSteps) * 100;
  const progressFill = document.getElementById('progressFill');
  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }
  
  // Scroll to top
  window.scrollTo(0, 0);
}

async function saveSettings() {
  try {
    // Save to sync storage (syncs across devices)
    await chrome.storage.sync.set({
      autoSyncEnabled: userPreferences.autoSync,
      settings: {
        autoApprove: userPreferences.autoApprove,
        sidebarEnabled: userPreferences.sidebar,
        soundEffects: userPreferences.notifications,
        darkMode: false,
        reminderDays: 3,
        trackedLabels: [],
        noReplyAfterDays: [3, 7, 14],
        hotkeysEnabled: false
      }
    });
    
    // Save to local storage
    await chrome.storage.local.set({
      settings: {
        autoApprove: userPreferences.autoApprove,
        sidebarEnabled: userPreferences.sidebar,
        soundEffects: userPreferences.notifications,
        darkMode: false,
        reminderDays: 3,
        trackedLabels: [],
        noReplyAfterDays: [3, 7, 14],
        hotkeysEnabled: false
      }
    });
    
    console.log('✅ Settings saved:', userPreferences);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

async function finishOnboarding(skipped) {
  try {
    // Mark onboarding as complete
    await chrome.storage.local.set({
      hasSeenWelcome: true,
      onboardingComplete: true,
      onboardingCompletedAt: new Date().toISOString(),
      onboardingSkipped: skipped
    });
    
    // Check if user wants to sign in
    const { wantsToSignIn, isGuest } = await chrome.storage.local.get(['wantsToSignIn', 'isGuest']);
    
    if (wantsToSignIn && !isGuest) {
      // Open login page
      chrome.tabs.create({ url: chrome.runtime.getURL('login.html') });
    }
    
    // Close onboarding tab
    setTimeout(() => {
      window.close();
      
      // If can't close (blocked by browser), show message
      setTimeout(() => {
        document.body.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; color: white; padding: 40px;">
            <div>
              <div style="font-size: 64px; margin-bottom: 16px;">✅</div>
              <h1 style="font-size: 32px; margin-bottom: 12px;">Setup Complete!</h1>
              <p style="font-size: 18px; opacity: 0.9;">You can close this tab now.</p>
              <button onclick="window.close()" style="margin-top: 24px; padding: 12px 32px; background: white; color: #667eea; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                Close Tab
              </button>
            </div>
          </div>
        `;
      }, 500);
    }, 100);
    
  } catch (error) {
    console.error('Error finishing onboarding:', error);
  }
}
