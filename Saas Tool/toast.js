// ===================================================
// CRMSYNC Toast Notification System
// Beautiful, non-blocking notifications
// ===================================================

class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // Create container on first use
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = `
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
        max-width: 400px;
      `;
      document.body.appendChild(this.container);
      this.injectStyles();
    }
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }

      @keyframes progressBar {
        from { width: 100%; }
        to { width: 0%; }
      }

      .toast-notification {
        background: white;
        color: #0f172a;
        padding: 14px 18px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1);
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 12px;
        pointer-events: all;
        animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        max-width: 380px;
        min-width: 280px;
        backdrop-filter: blur(10px);
      }

      .toast-notification::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: 4px;
        height: 100%;
        background: currentColor;
      }

      .toast-notification.toast-success {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        color: #166534;
        border: 1px solid #86efac;
      }

      .toast-notification.toast-error {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        color: #991b1b;
        border: 1px solid #fca5a5;
      }

      .toast-notification.toast-warning {
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        color: #92400e;
        border: 1px solid #fcd34d;
      }

      .toast-notification.toast-info {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        color: #1e40af;
        border: 1px solid #93c5fd;
      }

      .toast-icon {
        font-size: 20px;
        flex-shrink: 0;
        line-height: 1;
      }

      .toast-content {
        flex: 1;
        line-height: 1.4;
      }

      .toast-close {
        background: transparent;
        border: none;
        color: currentColor;
        opacity: 0.5;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .toast-close:hover {
        opacity: 1;
        background: rgba(0, 0, 0, 0.1);
      }

      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: currentColor;
        opacity: 0.3;
        border-radius: 0 0 12px 12px;
      }

      .toast-notification.hiding {
        animation: slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Dark mode support */
      [data-theme="dark"] .toast-notification {
        background: #1e293b;
        color: #f1f5f9;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      [data-theme="dark"] .toast-notification.toast-success {
        background: linear-gradient(135deg, #14532d 0%, #15803d 100%);
        color: #86efac;
      }

      [data-theme="dark"] .toast-notification.toast-error {
        background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
        color: #fca5a5;
      }

      [data-theme="dark"] .toast-notification.toast-warning {
        background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
        color: #fcd34d;
      }

      [data-theme="dark"] .toast-notification.toast-info {
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        color: #93c5fd;
      }
    `;
    document.head.appendChild(style);
  }

  show(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const icon = icons[type] || icons.info;

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <div class="toast-content">${message}</div>
      <button class="toast-close" aria-label="Close">×</button>
      ${duration > 0 ? `<div class="toast-progress" style="animation: progressBar ${duration}ms linear"></div>` : ''}
    `;

    // Close button handler
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.onclick = () => this.hide(toast);

    this.container.appendChild(toast);

    // Auto remove
    if (duration > 0) {
      setTimeout(() => {
        this.hide(toast);
      }, duration);
    }

    return toast;
  }

  hide(toast) {
    toast.classList.add('hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 4000) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 3500) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }

  loading(message) {
    return this.show(`${message}...`, 'info', 0); // No auto-hide
  }

  // Utility method to update a loading toast to success/error
  updateToast(toast, message, type = 'success', duration = 3000) {
    if (!toast || !toast.parentNode) return;
    
    const icon = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }[type];
    const iconEl = toast.querySelector('.toast-icon');
    const contentEl = toast.querySelector('.toast-content');
    
    if (iconEl) iconEl.textContent = icon;
    if (contentEl) contentEl.textContent = message;
    
    toast.className = `toast-notification toast-${type}`;
    
    if (duration > 0) {
      setTimeout(() => this.hide(toast), duration);
    }
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.toast = new ToastManager();
  
  // Also expose as global for compatibility
  window.showToast = (message, type) => window.toast.show(message, type);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToastManager;
}
