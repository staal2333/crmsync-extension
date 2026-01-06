// ===================================================
// CRMSYNC Dark Mode Manager
// Handles theme switching and persistence
// ===================================================

class DarkModeManager {
  constructor() {
    this.storageKey = 'crmsync-theme';
    this.init();
  }

  init() {
    // Load saved theme or detect system preference
    const savedTheme = localStorage.getItem(this.storageKey);
    
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(this.storageKey)) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }

    // Don't create toggle button - it's in settings now
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(this.storageKey, theme);
    
    // Update toggle button if it exists
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) {
      toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
      toggle.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  }

  getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  toggle() {
    const currentTheme = this.getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    
    // Show toast notification
    if (window.toast) {
      window.toast.info(`${newTheme === 'dark' ? '🌙' : '☀️'} ${newTheme === 'dark' ? 'Dark' : 'Light'} mode activated`, 1500);
    }
    
    return newTheme;
  }

  // createToggleButton() removed - toggle is now in Settings tab only
}

// Create global instance
if (typeof window !== 'undefined') {
  window.darkMode = new DarkModeManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DarkModeManager;
}
