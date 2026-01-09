/**
 * Loading State Manager
 * Shows/hides loading indicators with optional messages
 */

class LoadingManager {
  constructor() {
    this.loadingOverlay = null;
    this.init();
    
    // CRITICAL FIX: Hide overlay immediately on init
    setTimeout(() => {
      this.hide();
    }, 0);
  }
  
  init() {
    // Create loading overlay if it doesn't exist
    if (!document.getElementById('globalLoadingOverlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'globalLoadingOverlay';
      overlay.className = 'loading-overlay hidden'; // Start hidden!
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        z-index: 9999;
        display: none;
        align-items: center;
        justify-content: center;
      `;
      overlay.innerHTML = `
        <div class="loading-spinner-container">
          <div class="loading-spinner"></div>
          <p class="loading-message">Loading...</p>
        </div>
      `;
      document.body.appendChild(overlay);
      this.loadingOverlay = overlay;
    } else {
      this.loadingOverlay = document.getElementById('globalLoadingOverlay');
    }
    
    // Force hide it
    this.hide();
  }
  
  /**
   * Show loading overlay with optional message
   */
  show(message = 'Loading...') {
    if (!this.loadingOverlay) this.init();
    
    const messageEl = this.loadingOverlay.querySelector('.loading-message');
    if (messageEl) {
      messageEl.textContent = message;
    }
    
    this.loadingOverlay.classList.remove('hidden');
    logger.log('🔄 Loading:', message);
  }
  
  /**
   * Hide loading overlay
   */
  hide() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add('hidden');
      this.loadingOverlay.style.display = 'none'; // Force hide with inline style
    }
  }
  
  /**
   * Show inline loading in a specific element
   */
  showInline(elementId, message = 'Loading...') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.innerHTML = `
      <div class="inline-loading">
        <div class="loading-spinner-small"></div>
        <span>${message}</span>
      </div>
    `;
  }
  
  /**
   * Show button loading state
   */
  setButtonLoading(button, isLoading, loadingText = 'Loading...') {
    if (!button) return;
    
    if (isLoading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.innerHTML = `<span class="button-spinner"></span> ${loadingText}`;
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || 'Submit';
    }
  }
}

// Create global instance
const loadingManager = new LoadingManager();

// Make available globally
if (typeof window !== 'undefined') {
  window.loadingManager = loadingManager;
  window.LoadingManager = LoadingManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoadingManager;
}
