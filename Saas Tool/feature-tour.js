/**
 * Interactive Feature Tour
 * Shows users around the interface with guided tooltips
 */

class FeatureTour {
  constructor() {
    this.currentStep = 0;
    this.steps = [
      {
        element: '#contactLimitProgress',
        title: 'Contact Capacity',
        description: 'Track your usage and see when you\'re approaching your limit',
        position: 'bottom'
      },
      {
        element: '#sourceFilter',
        title: 'Source Filters',
        description: 'Filter contacts by source: Gmail, HubSpot, or Salesforce',
        position: 'bottom'
      },
      {
        element: '#bulkActionsToolbar',
        title: 'Bulk Actions',
        description: 'Select multiple contacts and perform actions at once',
        position: 'bottom'
      },
      {
        element: '#todayContactsSection',
        title: 'Today\'s Contacts',
        description: 'See new Gmail contacts detected today - collapsed by default',
        position: 'bottom'
      },
      {
        element: '[data-tab="integrations"]',
        title: 'CRM Integrations',
        description: 'Connect HubSpot or Salesforce to sync your contacts automatically',
        position: 'bottom'
      },
      {
        element: '#leftHeaderBtn',
        title: 'Quick Settings',
        description: 'Click the gear icon anytime to access all your settings',
        position: 'bottom'
      }
    ];
    
    this.overlay = null;
    this.tooltip = null;
  }
  
  start() {
    if (this.isRunning()) return;
    
    logger.log('🎯 Starting feature tour...');
    this.currentStep = 0;
    this.createOverlay();
    this.showStep(0);
    
    // Mark tour as seen
    chrome.storage.local.set({ hasSeenTour: true });
  }
  
  isRunning() {
    return this.overlay !== null;
  }
  
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'featureTourOverlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      backdrop-filter: blur(2px);
    `;
    
    this.overlay.addEventListener('click', () => this.end());
    document.body.appendChild(this.overlay);
  }
  
  showStep(stepIndex) {
    if (stepIndex >= this.steps.length) {
      this.end();
      return;
    }
    
    const step = this.steps[stepIndex];
    const element = document.querySelector(step.element);
    
    if (!element) {
      // Skip if element not found
      this.showStep(stepIndex + 1);
      return;
    }
    
    // Highlight element
    element.style.position = 'relative';
    element.style.zIndex = '9999';
    element.style.boxShadow = '0 0 0 4px #667eea, 0 0 20px rgba(102, 126, 234, 0.5)';
    element.style.borderRadius = '8px';
    
    // Create tooltip
    this.createTooltip(step, element);
  }
  
  createTooltip(step, targetElement) {
    // Remove existing tooltip
    if (this.tooltip) {
      this.tooltip.remove();
    }
    
    this.tooltip = document.createElement('div');
    this.tooltip.style.cssText = `
      position: fixed;
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      max-width: 300px;
      animation: fadeIn 0.3s ease;
    `;
    
    const rect = targetElement.getBoundingClientRect();
    
    // Position tooltip
    if (step.position === 'bottom') {
      this.tooltip.style.top = `${rect.bottom + 12}px`;
      this.tooltip.style.left = `${rect.left}px`;
    } else if (step.position === 'top') {
      this.tooltip.style.bottom = `${window.innerHeight - rect.top + 12}px`;
      this.tooltip.style.left = `${rect.left}px`;
    }
    
    this.tooltip.innerHTML = `
      <div style="margin-bottom: 12px;">
        <h3 style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 4px;">${step.title}</h3>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">${step.description}</p>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; color: #94a3b8;">${this.currentStep + 1} / ${this.steps.length}</span>
        <div style="display: flex; gap: 8px;">
          <button id="tourSkip" style="padding: 6px 12px; border: 1px solid #e2e8f0; background: white; border-radius: 6px; font-size: 13px; cursor: pointer;">
            Skip
          </button>
          <button id="tourNext" style="padding: 6px 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">
            ${this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.tooltip);
    
    // Add event listeners
    document.getElementById('tourSkip')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.end();
    });
    
    document.getElementById('tourNext')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.next();
    });
  }
  
  next() {
    // Remove highlight from current element
    const currentStep = this.steps[this.currentStep];
    const currentElement = document.querySelector(currentStep.element);
    if (currentElement) {
      currentElement.style.boxShadow = '';
      currentElement.style.zIndex = '';
    }
    
    this.currentStep++;
    this.showStep(this.currentStep);
  }
  
  end() {
    logger.log('✅ Feature tour ended');
    
    // Remove highlights
    this.steps.forEach(step => {
      const element = document.querySelector(step.element);
      if (element) {
        element.style.boxShadow = '';
        element.style.zIndex = '';
      }
    });
    
    // Remove overlay and tooltip
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
    
    this.currentStep = 0;
  }
}

// Create global instance
const featureTour = new FeatureTour();

// Make available globally
if (typeof window !== 'undefined') {
  window.featureTour = featureTour;
  window.FeatureTour = FeatureTour;
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);
