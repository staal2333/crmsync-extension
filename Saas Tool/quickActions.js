// ===================================================
// CRMSYNC Quick Actions Menu
// Right-click context menu for contacts
// ===================================================

class QuickActionsManager {
  constructor() {
    this.currentMenu = null;
    this.init();
  }

  init() {
    // Close menu on click outside
    document.addEventListener('click', (e) => {
      if (this.currentMenu && !this.currentMenu.contains(e.target)) {
        this.hide();
      }
    });

    // Close menu on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentMenu) {
        this.hide();
      }
    });
  }

  show(contact, x, y, actions) {
    // Hide existing menu
    this.hide();

    const menu = document.createElement('div');
    menu.className = 'quick-actions-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    // Default actions if not provided
    const defaultActions = [
      {
        icon: '✉️',
        label: 'Send Email',
        action: () => this.sendEmail(contact),
        enabled: !!contact.email
      },
      {
        icon: '📋',
        label: 'Copy Email',
        action: () => this.copyEmail(contact),
        enabled: !!contact.email
      },
      {
        icon: '🏢',
        label: 'Copy Company',
        action: () => this.copyCompany(contact),
        enabled: !!contact.company
      },
      {
        icon: '⭐',
        label: contact.favorite ? 'Unfavorite' : 'Mark Favorite',
        action: () => this.toggleFavorite(contact)
      },
      {
        icon: '✅',
        label: contact.status === 'approved' ? 'Mark Pending' : 'Approve',
        action: () => this.toggleApproval(contact)
      },
      {
        icon: '📝',
        label: 'Add Note',
        action: () => this.addNote(contact)
      },
      {
        icon: '🗂️',
        label: 'Export Contact',
        action: () => this.exportSingle(contact)
      },
      {
        icon: '🗑️',
        label: 'Delete',
        action: () => this.deleteContact(contact),
        danger: true
      }
    ];

    const menuActions = actions || defaultActions;

    menu.innerHTML = menuActions
      .filter(action => action.enabled !== false)
      .map((action, index) => `
        <button 
          class="quick-action-btn ${action.danger ? 'danger' : ''}" 
          data-action-index="${index}"
        >
          <span class="icon">${action.icon}</span>
          <span>${action.label}</span>
        </button>
      `).join('');

    // Add click handlers
    menu.querySelectorAll('.quick-action-btn').forEach((btn, index) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const actionIndex = parseInt(btn.dataset.actionIndex);
        const action = menuActions.filter(a => a.enabled !== false)[actionIndex];
        if (action && action.action) {
          action.action();
        }
        this.hide();
      };
    });

    document.body.appendChild(menu);
    this.currentMenu = menu;

    // Adjust position if menu goes off screen
    requestAnimationFrame(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menu.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > window.innerHeight) {
        menu.style.top = `${y - rect.height}px`;
      }
    });
  }

  hide() {
    if (this.currentMenu) {
      this.currentMenu.remove();
      this.currentMenu = null;
    }
  }

  // Action methods
  sendEmail(contact) {
    if (contact.email) {
      window.open(`mailto:${contact.email}`);
      if (window.toast) {
        window.toast.info('Opening email client...');
      }
    }
  }

  copyEmail(contact) {
    if (contact.email) {
      navigator.clipboard.writeText(contact.email).then(() => {
        if (window.toast) {
          window.toast.success('Email copied to clipboard!');
        }
      });
    }
  }

  copyCompany(contact) {
    if (contact.company) {
      navigator.clipboard.writeText(contact.company).then(() => {
        if (window.toast) {
          window.toast.success('Company name copied!');
        }
      });
    }
  }

  async toggleFavorite(contact) {
    // This will be implemented in popup.js
    if (window.toggleFavoriteContact) {
      await window.toggleFavoriteContact(contact.id);
      if (window.toast) {
        window.toast.success(contact.favorite ? 'Removed from favorites' : 'Added to favorites');
      }
    }
  }

  async toggleApproval(contact) {
    // This will be implemented in popup.js
    if (window.toggleContactStatus) {
      await window.toggleContactStatus(contact.id);
      if (window.toast) {
        window.toast.success(contact.status === 'approved' ? 'Marked as pending' : 'Contact approved!');
      }
    }
  }

  addNote(contact) {
    // This will be implemented in popup.js
    if (window.openNoteDialog) {
      window.openNoteDialog(contact);
    }
  }

  exportSingle(contact) {
    // Export single contact as vCard
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
EMAIL:${contact.email}
${contact.company ? `ORG:${contact.company}` : ''}
${contact.phone ? `TEL:${contact.phone}` : ''}
END:VCARD`;

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contact.name.replace(/\s+/g, '_')}.vcf`;
    a.click();
    URL.revokeObjectURL(url);

    if (window.toast) {
      window.toast.success('Contact exported!');
    }
  }

  async deleteContact(contact) {
    if (confirm(`Delete ${contact.name}? This cannot be undone.`)) {
      // This will be implemented in popup.js
      if (window.deleteContactById) {
        await window.deleteContactById(contact.id);
        if (window.toast) {
          window.toast.success('Contact deleted');
        }
      }
    }
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.quickActions = new QuickActionsManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuickActionsManager;
}
