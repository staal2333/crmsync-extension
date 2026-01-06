// Content script for Gmail - Complete Fix
(function() {
  'use strict';

  let contacts = [];
  let settings = {};
  let pendingContacts = [];
  let sidebarContainer = null;
  let widgetContainer = null;
  let processedEmails = new Set();
  let isScanning = false;
  let lastScanStatus = 'Idle';
  let lastScanAt = null;
  let sidebarVisible = false;
  let sidebarWidth = 320; // Default smaller width
  let composeObserver = null;
  let composeInputs = new Set();
  let lastSentEmailData = null;
  let inlineEmailApprovalElement = null;
  let lastInboundEmailSignature = null;
  let lastSentEmailKey = null; // For debouncing duplicate email sent events
  let userEmails = []; // User's own email addresses (aliases) to exclude from collection
  let userEmail = null; // Primary user email (legacy uses)
  let rejectedEmails = new Set(); // Persisted list of rejected contacts to avoid re-adding
  let hotkeysEnabled = false;
  let widgetHoverTimeout = null;
  let hotkeysAttached = false;
  let hotkeyHandler = null;
  let lastSeenCountAtSidebarOpen = 0;
  let sessionFoundCount = 0;

  /**
   * Split a full name into firstName and lastName.
   * Middle names are included with firstName.
   * Single-word names go to firstName.
   * @param {string} fullName
   * @returns {{ firstName: string | null, lastName: string | null }}
   */
  function splitName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
      return { firstName: null, lastName: null };
    }

    const trimmed = fullName.trim();
    if (!trimmed) {
      return { firstName: null, lastName: null };
    }

    // Split by whitespace
    const parts = trimmed.split(/\s+/).filter(p => p.length > 0);

    if (parts.length === 0) {
      return { firstName: null, lastName: null };
    } else if (parts.length === 1) {
      // Single word goes to firstName
      return { firstName: parts[0], lastName: null };
    } else {
      // Last word is lastName, everything else is firstName
      const lastName = parts[parts.length - 1];
      const firstName = parts.slice(0, -1).join(' ');
      return { firstName, lastName };
    }
  }

  /**
   * Get full name from firstName and lastName.
   * @param {string | null | undefined} firstName
   * @param {string | null | undefined} lastName
   * @returns {string}
   */
  function getFullName(firstName, lastName) {
    const parts = [firstName, lastName].filter(p => p && p.trim().length > 0);
    return parts.join(' ');
  }

  // Initialize
  init();

  async function init() {
    try {
      // Apply default theme immediately to prevent flash
      document.documentElement.setAttribute('data-theme', 'light');
      
      await loadContacts();
      await loadSettings();
      
      // Apply actual theme from settings
      applyTheme();
      
      hotkeysEnabled = settings.hotkeysEnabled === true;
      // Initialize counters from storage
      const stored = await chrome.storage.local.get(['lastSeenCountAtSidebarOpen', 'sessionFoundCount']);
      if (typeof stored.lastSeenCountAtSidebarOpen === 'number') {
        lastSeenCountAtSidebarOpen = stored.lastSeenCountAtSidebarOpen;
      } else {
        lastSeenCountAtSidebarOpen = contacts.length || 0;
        chrome.storage.local.set({ lastSeenCountAtSidebarOpen });
      }
      if (typeof stored.sessionFoundCount === 'number') {
        sessionFoundCount = stored.sessionFoundCount;
      } else {
        sessionFoundCount = 0;
        chrome.storage.local.set({ sessionFoundCount });
      }

      // Load rejected contacts (so they don't reappear)
      const storedRejected = await chrome.storage.local.get(['rejectedEmails']);
      if (Array.isArray(storedRejected.rejectedEmails)) {
        rejectedEmails = new Set(
          storedRejected.rejectedEmails
            .map(e => (e || '').toLowerCase())
            .filter(Boolean)
        );
      }

      // Load stored user emails
      const storedEmails = await chrome.storage.local.get(['userEmails', 'userEmail']);
      if (Array.isArray(storedEmails.userEmails) && storedEmails.userEmails.length > 0) {
        userEmails = storedEmails.userEmails.map(e => (e || '').toLowerCase()).filter(Boolean);
        userEmail = userEmails[0] || null;
      } else if (storedEmails.userEmail) {
        userEmail = (storedEmails.userEmail || '').toLowerCase();
        userEmails = userEmail ? [userEmail] : [];
      }
      
      // Load saved sidebar width
      const savedWidth = await chrome.storage.local.get(['sidebarWidth']);
      if (savedWidth.sidebarWidth) {
        sidebarWidth = savedWidth.sidebarWidth;
      }
      applySidebarWidthCSS();
      
      // Wait for Gmail to load
      waitForGmail(() => {
        try {
          setupComposeObserver();
          setupEmailSentDetector();
          detectUserEmail(); // Detect user's email first
          setupThreadObserver(); // Auto-scan threads when opened (but not whole inbox)
          setupReminderSystem(); // Setup reminder system after Gmail loads

          // Inbound enrichment observer (guarded so a missing function doesn't break setup)
          if (typeof setupInboundEmailObserver === 'function') {
            setupInboundEmailObserver();
          }

          // Keep Gmail DOM light: inject only the floating widget by default.
          createFloatingWidget();
          setupHotkeys();
          updateWidget();
          // Failsafes to ensure widget is present
          setTimeout(ensureWidgetPresent, 2000);
          setTimeout(ensureWidgetPresent, 5000);
          setInterval(ensureWidgetPresent, 15000);
          
          // Retry widget creation after a delay to ensure it's visible
          setTimeout(() => {
            if (!document.getElementById('contact-extractor-widget')) {
              createFloatingWidget();
            }
          }, 2000);
        } catch (error) {
          console.error('CRMSYNC: Error during setup:', error);
          // Still try to create widget even if other setup fails
          try {
            createFloatingWidget();
          } catch (widgetError) {
            console.error('CRMSYNC: Error creating widget:', widgetError);
          }
        }
      });
    } catch (error) {
      console.error('CRMSYNC: Initialization error:', error);
    }
  }

  // Listen for settings changes (e.g., hotkeys toggle)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.settings && changes.settings.newValue) {
      const newSettings = changes.settings.newValue;
      if (typeof newSettings.hotkeysEnabled !== 'undefined') {
        hotkeysEnabled = newSettings.hotkeysEnabled === true;
        setupHotkeys();
      }
    }

    // Sync counters when contacts are cleared or change
    if (changes.contacts) {
      const newContacts = changes.contacts.newValue || [];
      contacts = Array.isArray(newContacts) ? newContacts : [];
      // If contacts cleared, reset counters
      if (contacts.length === 0) {
        lastSeenCountAtSidebarOpen = 0;
        sessionFoundCount = 0;
        chrome.storage.local.set({
          lastSeenCountAtSidebarOpen,
          sessionFoundCount
        });
      }
      updateWidget();
      updateSidebar();
    }

    // If pending contacts stored separately
    if (changes.pendingContacts) {
      const newPending = changes.pendingContacts.newValue || [];
      pendingContacts = Array.isArray(newPending) ? newPending : [];
      updateWidget();
      updateSidebar();
    }
  });

  function applySidebarWidthCSS() {
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
  }

  async function updateFloatingWidgetPosition() {
    if (!widgetContainer) return;
    
    // Don't override user's custom position - they can drag it wherever they want
    // This function is now deprecated but kept for compatibility
    return;
  }

  function ensureWidgetPresent() {
    try {
      const existing = document.getElementById('contact-extractor-widget');
      if (!existing) {
        createFloatingWidget();
      }
    } catch (err) {
      console.error('CRMSYNC: Error ensuring widget presence', err);
    }
  }

  function setupHotkeys() {
    if (!hotkeysEnabled || hotkeysAttached) return;
    hotkeysAttached = true;
    hotkeyHandler = (e) => {
      // Only when enabled in settings
      if (!hotkeysEnabled) return;

      // Avoid interfering with inputs/contenteditable
      const active = document.activeElement;
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (isInput) return;

      const mod = (e.ctrlKey || e.metaKey) && e.shiftKey;
      if (!mod) return;

      if (e.code === 'KeyY') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      if (['Digit1','Digit2','Digit3','Digit4'].includes(e.code)) {
        e.preventDefault();
        const map = { Digit1: 'crm', Digit2: 'overview', Digit3: 'today', Digit4: 'settings' };
        const tab = map[e.code];
        toggleSidebar(true);
        selectSidebarTab(tab);
      }
    };
    window.addEventListener('keydown', hotkeyHandler, true);
  }

  function selectSidebarTab(tabName) {
    if (!sidebarContainer) return;
    const btn = sidebarContainer.querySelector(`.sidebar-tab-btn[data-sidebar-tab="${tabName}"]`);
    if (btn) {
      btn.click();
      return;
    }
    // Fallback if click handlers change
    const buttons = sidebarContainer.querySelectorAll('.sidebar-tab-btn');
    buttons.forEach(button => {
      const matches = button.getAttribute('data-sidebar-tab') === tabName;
      button.classList.toggle('active', matches);
    });
    const tabs = sidebarContainer.querySelectorAll('.sidebar-tab-content');
    tabs.forEach(tab => {
      const matches = tab.id === `sidebar-${tabName}-tab`;
      tab.classList.toggle('active', matches);
    });
  }

  function waitForGmail(callback) {
    if (document.querySelector('[role="main"]') || document.querySelector('[data-ogsc]')) {
      setTimeout(callback, 1000);
    } else {
      setTimeout(() => waitForGmail(callback), 500);
    }
  }

  async function loadContacts() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getContacts' });
      contacts = response.contacts || [];
    } catch (error) {
      console.error('CRMSYNC: Error loading contacts', error);
      contacts = [];
    }
  }

  async function loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      settings = response.settings || {
        darkMode: false,
        autoApprove: false,
        reminderDays: 3,
        sidebarEnabled: true,
        trackedLabels: [],
        soundEffects: false,
        hotkeysEnabled: false
      };
      applyTheme();
    } catch (error) {
      console.error('CRMSYNC: Error loading settings', error);
      settings = { darkMode: false, autoApprove: false, reminderDays: 3, sidebarEnabled: true, trackedLabels: [], soundEffects: false, hotkeysEnabled: false };
    }
  }

  /**
   * Play different sound effects based on button type
   * Uses Web Audio API to generate pleasant, short sounds
   */
  function playClickSound(type = 'default') {
    if (!settings.soundEffects) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;
      
      // Define sound parameters for different button types
      const soundTypes = {
        'navigation': { // Tab buttons, sidebar toggle
          frequency: 600,
          type: 'sine',
          duration: 0.08,
          volume: 0.08,
          fadeIn: 0.005,
          fadeOut: 0.075
        },
        'action': { // Export, Scan All
          frequency: 700,
          type: 'sine',
          duration: 0.12,
          volume: 0.12,
          fadeIn: 0.01,
          fadeOut: 0.11
        },
        'approve': { // Approve buttons - positive ascending tone
          frequency: 600,
          type: 'sine',
          duration: 0.15,
          volume: 0.1,
          fadeIn: 0.01,
          fadeOut: 0.14,
          frequencyEnd: 800 // Ascending
        },
        'reject': { // Reject, Clear buttons - descending tone
          frequency: 500,
          type: 'sine',
          duration: 0.12,
          volume: 0.1,
          fadeIn: 0.01,
          fadeOut: 0.11,
          frequencyEnd: 400 // Descending
        },
        'settings': { // Save settings, configuration
          frequency: 550,
          type: 'sine',
          duration: 0.1,
          volume: 0.09,
          fadeIn: 0.01,
          fadeOut: 0.09
        },
        'close': { // Close buttons
          frequency: 650,
          type: 'sine',
          duration: 0.07,
          volume: 0.07,
          fadeIn: 0.005,
          fadeOut: 0.065
        },
        'newContact': { // New contact detected - light pling notification
          frequency: 750,
          type: 'sine',
          duration: 0.1,
          volume: 0.08,
          fadeIn: 0.01,
          fadeOut: 0.09
        },
        'default': { // Default sound
          frequency: 600,
          type: 'sine',
          duration: 0.1,
          volume: 0.1,
          fadeIn: 0.01,
          fadeOut: 0.09
        }
      };
      
      const sound = soundTypes[type] || soundTypes['default'];
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure oscillator
      oscillator.type = sound.type;
      oscillator.frequency.setValueAtTime(sound.frequency, now);
      
      // If frequency changes (approve/reject), add frequency modulation
      if (sound.frequencyEnd) {
        oscillator.frequency.exponentialRampToValueAtTime(sound.frequencyEnd, now + sound.duration);
      }
      
      // Configure gain envelope
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(sound.volume, now + sound.fadeIn);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + sound.duration);
      
      // Play the sound
      oscillator.start(now);
      oscillator.stop(now + sound.duration);
    } catch (error) {
      // Silently fail if audio context is not available
    }
  }

  /**
   * Check if current Gmail view/thread has any of the tracked labels.
   * @returns {boolean} True if should track, false if should skip
   */
  function shouldTrackBasedOnLabels() {
    const trackedLabels = settings.trackedLabels || [];
    
    // If no labels specified, track everything
    if (!Array.isArray(trackedLabels) || trackedLabels.length === 0) {
      return true;
    }

    // Normalize tracked labels to lowercase for comparison
    const normalizedTracked = trackedLabels.map(l => l.toLowerCase().trim()).filter(l => l.length > 0);
    if (normalizedTracked.length === 0) {
      return true;
    }

    // Check for labels in the current Gmail view
    // Gmail labels can appear in various places:
    // 1. In thread list items: [data-label-name], .at, or label chips
    // 2. In thread view: label chips in header
    // 3. In compose: labels might not be visible until sent, so we'll allow compose tracking

    // Check thread view (when viewing a specific email thread)
    const threadView = document.querySelector('[role="main"]');
    if (threadView) {
      const labelElements = threadView.querySelectorAll('[data-label-name], .at, [aria-label*="Label"]');
      for (const el of labelElements) {
        const labelText = el.getAttribute('data-label-name') || 
                         el.getAttribute('aria-label') || 
                         el.textContent || '';
        const normalized = labelText.toLowerCase().trim();
        if (normalizedTracked.some(tracked => normalized.includes(tracked))) {
          return true;
        }
      }
    }

    // Check thread list items (inbox view)
    const activeThread = document.querySelector('[role="listitem"][aria-selected="true"], tr[aria-selected="true"]');
    if (activeThread) {
      const labelElements = activeThread.querySelectorAll('[data-label-name], .at, [aria-label*="Label"]');
      for (const el of labelElements) {
        const labelText = el.getAttribute('data-label-name') || 
                         el.getAttribute('aria-label') || 
                         el.textContent || '';
        const normalized = labelText.toLowerCase().trim();
        if (normalizedTracked.some(tracked => normalized.includes(tracked))) {
          return true;
        }
      }
    }

    // Check current Gmail label filter (if user is viewing a specific label)
    const urlParams = new URLSearchParams(window.location.search);
    const labelParam = urlParams.get('label');
    if (labelParam) {
      const normalized = decodeURIComponent(labelParam).toLowerCase();
      if (normalizedTracked.some(tracked => normalized.includes(tracked))) {
        return true;
      }
    }

    // For compose windows, we'll allow tracking (labels are applied after sending)
    const composeWindow = document.querySelector('[role="dialog"]');
    if (composeWindow) {
      return true; // Allow compose tracking, labels will be checked when email is sent
    }

    // If we can't find any matching labels and we're not in compose, skip tracking
    return false;
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
  }

  // Improved compose detection
  function setupComposeObserver() {
    // Watch for compose window
    const observer = new MutationObserver(() => {
      checkComposeWindow();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also listen for input events on potential compose fields
    document.addEventListener('input', handleComposeInput, true);
    document.addEventListener('keyup', handleComposeInput, true);
    
    // Listen for paste events to detect copied emails
    document.addEventListener('paste', handlePasteEvent, true);
    
    // Listen for copy events to detect when user copies an email
    document.addEventListener('copy', handleCopyEvent, true);
    
    composeObserver = observer;
  }

  function handleComposeInput(e) {
    const target = e.target;
    // Check if it's a compose field
    if (target.matches('[role="textbox"], [name="to"], [aria-label*="To"], [placeholder*="To"]') ||
        target.closest('[role="dialog"]')) {
      const composeWindow = target.closest('[role="dialog"]');
      if (composeWindow) {
        const value = target.value || target.textContent || '';
        if (value && value.includes('@')) {
          extractFromCompose(value);
        }
      }
    }
  }

  function checkComposeWindow() {
    const composeWindows = document.querySelectorAll('[role="dialog"]');
    composeWindows.forEach(composeWindow => {
      // Find all potential "To" fields
      const toFields = composeWindow.querySelectorAll(
        '[name="to"], [aria-label*="To"], [placeholder*="To"], [role="textbox"][aria-label*="To"], [role="textbox"]'
      );
      
      toFields.forEach(field => {
        if (!composeInputs.has(field)) {
          composeInputs.add(field);
          
          // Listen for input
          field.addEventListener('input', () => {
            const value = field.value || field.textContent || '';
            if (value && value.includes('@')) {
              extractFromCompose(value);
            }
          }, { once: false });

          // Also check current value
          const currentValue = field.value || field.textContent || '';
          if (currentValue && currentValue.includes('@')) {
            extractFromCompose(currentValue);
          }
        }
      });
    });
  }

  // Track last copied text to detect email copies
  let lastCopiedText = '';
  let lastProcessedCopiedEmail = null;

  /**
   * Handle paste events to detect when user pastes an email address
   */
  async function handlePasteEvent(e) {
    try {
      // Check if we're in a compose window or any text input
      const target = e.target;
      const isComposeField = target.matches('[role="textbox"], [name="to"], [aria-label*="To"], [placeholder*="To"], input, textarea') ||
                            target.closest('[role="dialog"]');
      
      if (!isComposeField) {
        return;
      }

      // Get clipboard content - try multiple methods
      let clipboardText = '';
      
      // Method 1: Try Clipboard API (requires user interaction, which paste event provides)
      try {
        clipboardText = await navigator.clipboard.readText();
      } catch (clipboardError) {
        // Method 2: Fallback to paste event data
        clipboardText = e.clipboardData?.getData('text/plain') || '';
      }

      // If we got clipboard text with an email, process it
      if (clipboardText && clipboardText.includes('@')) {
        // Small delay to let paste complete, then check the field value
        setTimeout(() => {
          // Get the current value after paste
          const value = target.value || target.textContent || clipboardText;
          if (value && value.includes('@')) {
            extractFromCompose(value);
          }
        }, 150);
      }
    } catch (error) {
      // Final fallback: try to get from paste event data
      try {
        const clipboardText = e.clipboardData?.getData('text/plain') || '';
        if (clipboardText && clipboardText.includes('@')) {
          setTimeout(() => {
            const value = e.target.value || e.target.textContent || clipboardText;
            if (value && value.includes('@')) {
              extractFromCompose(value);
            }
          }, 150);
        }
      } catch (fallbackError) {
        console.error('CRMSYNC: Error handling paste event', fallbackError);
      }
    }
  }

  /**
   * Handle copy events to detect when user copies an email address
   */
  function handleCopyEvent(e) {
    try {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText && selectedText.includes('@')) {
        // Check if the selected text contains an email
          const emailMatch = selectedText.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
        if (emailMatch) {
          const email = emailMatch[1].toLowerCase();
          
          // Skip user's own email or excluded domain
          if (isUserEmail(email) || isExcludedDomain(email)) {
            return;
          }
          
          // Avoid processing the same email multiple times
          if (lastProcessedCopiedEmail === email) {
            return;
          }
          lastProcessedCopiedEmail = email;
          
          // Reset after 3 seconds
          setTimeout(() => {
            if (lastProcessedCopiedEmail === email) {
              lastProcessedCopiedEmail = null;
            }
          }, 3000);

          lastCopiedText = selectedText;
          
          // Check if we should track based on labels
          if (!shouldTrackBasedOnLabels()) {
            return;
          }

          // Check if email is already in contacts or pending
          const emailLower = email.toLowerCase();
          if (!contacts.find(c => c.email === emailLower) &&
              !pendingContacts.find(p => p.email === emailLower) &&
              !rejectedEmails.has(emailLower) &&
              !emailLower.includes('noreply') &&
              !emailLower.includes('no-reply') &&
              !emailLower.includes('mailer') &&
              !emailLower.includes('notification')) {
            
            // Try to extract name from the copied text
            let name = null;
            const nameMatch = selectedText.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
            if (nameMatch && !nameMatch[1].includes('@')) {
              name = nameMatch[1].trim();
            }

            const { firstName, lastName } = splitName(name);
            
            // Skip if name is excluded
            if (isExcludedName(firstName, lastName)) {
              return;
            }
            const contact = {
              email: emailLower,
              firstName: firstName,
              lastName: lastName,
              status: 'New',
              lastContact: new Date().toISOString()
            };
            
            sessionFoundCount += 1;
            chrome.storage.local.set({ sessionFoundCount });
            pendingContacts.push(contact);
            
            if (!settings.autoApprove) {
              playClickSound('newContact');
              showApprovalPanel(contact, null);
            } else {
              approveContact(contact, null);
            }
          }
        }
      }
    } catch (error) {
      console.error('CRMSYNC: Error handling copy event', error);
    }
  }

  function extractFromCompose(toField) {
    // Check if we should track based on labels (compose is usually allowed)
    if (!shouldTrackBasedOnLabels()) {
      return;
    }

    const emails = toField.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
    if (emails) {
      emails.forEach(email => {
        const emailLower = email.toLowerCase();
        // Skip user's own email or excluded domain
        if (isUserEmail(emailLower) || isExcludedDomain(emailLower)) {
          return;
        }
        if (!contacts.find(c => c.email === emailLower) &&
            !pendingContacts.find(p => p.email === emailLower) &&
            !rejectedEmails.has(emailLower) &&
            !emailLower.includes('noreply') &&
            !emailLower.includes('no-reply')) {
          const contact = {
            email: emailLower,
            firstName: null,
            lastName: null,
            status: 'New',
            lastContact: new Date().toISOString()
          };
          
          // Skip if name is excluded (though name is null here, check anyway for future-proofing)
          if (isExcludedName(contact.firstName, contact.lastName)) {
            return;
          }
          
          sessionFoundCount += 1;
          chrome.storage.local.set({ sessionFoundCount });
          pendingContacts.push(contact);
          if (!settings.autoApprove) {
            playClickSound('newContact');
            showApprovalPanel(contact, null);
          } else {
            approveContact(contact, null);
          }
        }
      });
    }
  }

  // Full email scan with scrolling
  async function bulkScanAllEmails() {
    if (isScanning) {
      showNotification('Scan already in progress...');
      return;
    }

    isScanning = true;
    showNotification('Scanning all emails... This may take a moment.');
    
    const scannedContacts = new Set();
    const newPendingContacts = [];
    let scrollCount = 0;
    const maxScrolls = 50; // Limit to prevent infinite scrolling

    // Function to scan current view
    function scanCurrentView() {
      // Scan email list - improved selectors
      const emailListSelectors = [
        '[role="list"]',
        '.Cp',
        '.aDP',
        '[data-thread-perm-id]'
      ];

      let emailList = null;
      for (const selector of emailListSelectors) {
        emailList = document.querySelector(selector);
        if (emailList) break;
      }

      if (emailList) {
        const listItemSelectors = [
          '[role="listitem"]',
          'tr[role="row"]',
          '.zA',
          '.yO'
        ];

        let listItems = [];
        for (const selector of listItemSelectors) {
          listItems = emailList.querySelectorAll(selector);
          if (listItems.length > 0) break;
        }

        listItems.forEach(item => {
          const email = extractEmailFromElement(item);
          if (email && !scannedContacts.has(email) && 
              !isUserEmail(email) && !isExcludedDomain(email) &&
              !rejectedEmails.has(email.toLowerCase()) &&
              !contacts.find(c => c.email === email) &&
              !email.includes('noreply') && !email.includes('no-reply') &&
              !email.includes('mailer') && !email.includes('notification') &&
              !email.includes('donotreply') && !email.includes('automated')) {
            sessionFoundCount += 1;
            chrome.storage.local.set({ sessionFoundCount });
            scannedContacts.add(email);
            
            // Get full text for better extraction
            const fullText = item.textContent || item.innerText || '';
            const extractedName = extractNameFromElement(item, item.parentElement) || extractNameFromText(fullText, email);
            const { firstName, lastName } = splitName(extractedName);
            let extractedPhone = extractPhone(fullText, email, userEmails);
            
            // Filter out excluded phones
            if (extractedPhone && isExcludedPhone(extractedPhone)) {
              extractedPhone = null;
            }
            
            const contact = {
              email: email,
              firstName: firstName,
              lastName: lastName,
              jobTitle: extractJobTitle(fullText),
              company: extractCompany(fullText),
              phone: extractedPhone,
              linkedin: extractLinkedIn(fullText),
              lastContact: new Date().toISOString(),
              status: 'New'
            };
            
            // Skip if name is excluded
            if (!isExcludedName(firstName, lastName)) {
              newPendingContacts.push(contact);
            }
          }
        });
      }

      // Scan thread view if open - improved selectors
      const threadView = document.querySelector('[role="main"]');
      if (threadView) {
        const senderSelectors = [
          '[email]',
          '[data-email]',
          '[data-hovercard-id]',
          'span[title*="@"]',
          '.gD[email]',
          '.bog span[email]',
          '.bA4[email]'
        ];

        let senderElements = [];
        for (const selector of senderSelectors) {
          senderElements = threadView.querySelectorAll(selector);
          if (senderElements.length > 0) break;
        }

        senderElements.forEach(el => {
          const email = extractEmailFromElement(el);
          // Skip user's own email or excluded domain
          if (!email || isUserEmail(email) || isExcludedDomain(email) || rejectedEmails.has(email.toLowerCase())) {
            return;
          }
          if (!scannedContacts.has(email) && 
              !contacts.find(c => c.email === email) &&
              !email.includes('noreply') && !email.includes('no-reply') &&
              !email.includes('mailer') && !email.includes('notification') &&
              !email.includes('donotreply') && !email.includes('automated')) {
            sessionFoundCount += 1;
            chrome.storage.local.set({ sessionFoundCount });
            scannedContacts.add(email);
            
            // Get message context for better extraction
            const messageEl = el.closest('[role="article"]') || el.closest('[role="listitem"]') || el.parentElement;
            const fullText = messageEl ? (messageEl.textContent || messageEl.innerText || '') : '';
            
            const extractedName = extractNameFromElement(el, messageEl) || extractNameFromText(fullText, email);
            const { firstName, lastName } = splitName(extractedName);
            let extractedPhone = extractPhone(fullText);
            
            // Filter out excluded phones
            if (extractedPhone && isExcludedPhone(extractedPhone)) {
              extractedPhone = null;
            }
            
            const contact = {
              email: email,
              firstName: firstName,
              lastName: lastName,
              jobTitle: extractJobTitle(fullText),
              company: extractCompany(fullText),
              phone: extractedPhone,
              linkedin: extractLinkedIn(fullText),
              lastContact: new Date().toISOString(),
              status: 'New'
            };
            
            // Skip if name is excluded
            if (!isExcludedName(firstName, lastName)) {
              newPendingContacts.push(contact);
            }
          }
        });
      }
    }

    // Initial scan
    scanCurrentView();

    // Scroll and scan - find the correct scroll container
    let scrollContainer = null;
    
    // Try multiple selectors for Gmail's scroll container
    const possibleContainers = [
      document.querySelector('[role="main"] [role="list"]')?.parentElement,
      document.querySelector('[role="main"]'),
      document.querySelector('[role="list"]')?.parentElement,
      document.querySelector('.aDP'),
      document.querySelector('[data-ogsc]')
    ];
    
    for (const container of possibleContainers) {
      if (container && container.scrollHeight > container.clientHeight) {
        scrollContainer = container;
        break;
      }
    }
    
    if (scrollContainer) {
      const initialScrollTop = scrollContainer.scrollTop;
      let lastScrollHeight = scrollContainer.scrollHeight;
      let noChangeCount = 0;

      async function scrollAndScan() {
        scanCurrentView();
        
        const currentScroll = scrollContainer.scrollTop;
        const currentScrollHeight = scrollContainer.scrollHeight;
        const clientHeight = scrollContainer.clientHeight;
        const scrollStep = Math.max(300, clientHeight * 0.7);
        
        // Check if we've reached the bottom
        const isAtBottom = currentScroll + clientHeight >= currentScrollHeight - 50;
        
        // Check if scroll height changed (new content loaded)
        if (currentScrollHeight === lastScrollHeight) {
          noChangeCount++;
        } else {
          noChangeCount = 0;
          lastScrollHeight = currentScrollHeight;
        }
        
        if (!isAtBottom && scrollCount < maxScrolls && noChangeCount < 3) {
          // Scroll down
          scrollContainer.scrollTop = currentScroll + scrollStep;
          scrollCount++;
          
          // Wait for content to load
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Continue scanning
          await scrollAndScan();
        } else {
          // Try scrolling to bottom one more time
          if (!isAtBottom && scrollCount < maxScrolls) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, 1000));
            scanCurrentView();
          }
          
          // Final scan
          scanCurrentView();
          finishScan();
        }
      }

      await scrollAndScan();
    } else {
      // No scroll container found, just scan what's visible
      finishScan();
    }

    async function finishScan() {
      isScanning = false;
      
      if (newPendingContacts.length > 0) {
        // If auto-approve is enabled, automatically save all contacts
        if (settings.autoApprove) {
          let savedCount = 0;
          for (const contact of newPendingContacts) {
            // Check if contact already exists
            const existing = contacts.find(c => c.email === contact.email);
            const lower = (contact.email || '').toLowerCase();
            if (!existing && !pendingContacts.find(p => p.email === contact.email) &&
                !rejectedEmails.has(lower)) {
              sessionFoundCount += 1;
              chrome.storage.local.set({ sessionFoundCount });
              await approveContact(contact, null);
              savedCount++;
            }
          }
          showNotification(`Found and automatically saved ${savedCount} new contacts!`);
          await loadContacts();
          updateSidebar();
        } else {
          // Add to pending contacts for manual approval
          newPendingContacts.forEach(contact => {
            const lower = (contact.email || '').toLowerCase();
            if (!pendingContacts.find(p => p.email === contact.email) &&
                !rejectedEmails.has(lower)) {
              sessionFoundCount += 1;
              chrome.storage.local.set({ sessionFoundCount });
              pendingContacts.push(contact);
            }
          });
          showNotification(`Found ${newPendingContacts.length} new contacts! Use Bulk Approve to review them.`);
          updateSidebar();
          showBulkApprovalPanel();
        }
      } else {
        showNotification('No new contacts found.');
      }
    }
  }

  function extractEmailFromElement(element) {
    if (!element) return null;

    // Try attributes first (most reliable in Gmail)
    const emailAttr = element.getAttribute('email') || 
                     element.getAttribute('data-email') ||
                     element.getAttribute('data-hovercard-id') ||
                     element.getAttribute('title') ||
                     element.getAttribute('aria-label');
    
    if (emailAttr && emailAttr.includes('@')) {
      const match = emailAttr.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      if (match) {
        const email = match[1].toLowerCase();
        // Filter out common non-contact emails
        if (!email.includes('noreply') && !email.includes('no-reply') && 
            !email.includes('mailer') && !email.includes('notification') &&
            !email.includes('donotreply') && !email.includes('automated')) {
          return email;
        }
      }
    }

    // Try text content
    const text = element.textContent || element.innerText || '';
    const emailMatch = text.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) {
      const email = emailMatch[1].toLowerCase();
      // Filter out common non-contact emails
      if (!email.includes('noreply') && !email.includes('no-reply') && 
          !email.includes('mailer') && !email.includes('notification') &&
          !email.includes('donotreply') && !email.includes('automated')) {
        return email;
      }
    }

    // Try parent element (Gmail sometimes nests email in parent)
    if (element.parentElement) {
      const parentEmail = extractEmailFromElement(element.parentElement);
      if (parentEmail) return parentEmail;
    }

    return null;
  }

  // Extract email from plain header text such as "From:" or "Sent:"
  function extractEmailFromHeaderText(text) {
    if (!text) return null;
    const headerPatterns = [
      /^(?:from|fra|de)\s*:\s*.*?<\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*>/im,
      /^(?:from|fra|de)\s*:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/im,
      /^(?:sender|sendt|sent)\s*:\s*.*?<\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*>/im,
      /^(?:sender|sendt|sent)\s*:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/im
    ];

    for (const pattern of headerPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const email = match[1].toLowerCase();
        if (!isUserEmail(email) &&
            !isExcludedDomain(email) &&
            !email.includes('noreply') &&
            !email.includes('no-reply') &&
            !email.includes('mailer') &&
            !email.includes('notification') &&
            !email.includes('donotreply') &&
            !email.includes('automated')) {
          return email;
        }
      }
    }

    // Fallback: pick the first email-looking token in the text
    const fallbackMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (fallbackMatch && fallbackMatch[1]) {
      const email = fallbackMatch[1].toLowerCase();
      if (!isUserEmail(email) && !isExcludedDomain(email)) {
        return email;
      }
    }

    return null;
  }

  function isPlausibleName(name) {
    if (!name) return false;
    const cleaned = name.trim();
    if (cleaned.length < 2 || cleaned.length > 60) return false;
    if (cleaned.includes('@')) return false;
    if (/^\d+$/.test(cleaned)) return false;
    const lower = cleaned.toLowerCase();
    const banned = ['noreply', 'no-reply', 'unsubscribe', 'privacy', 'terms', 'view online', 'copyright', 'closure'];
    if (banned.some(b => lower.includes(b))) return false;
    // Prefer at least two words
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length < 2) return false;
    return true;
  }

  function extractNameFromElement(element, parent) {
    if (!element) return null;

    // Modern Gmail selectors (2024)
    const nameSelectors = [
      '[data-name]',
      '.gD',
      '.go',
      '.g2', // Gmail name class
      'span[email]',
      '.yW span[email]',
      '.yW .zF',
      '.bA4', // Gmail sender name
      '[data-sender-name]',
      '.bog', // Gmail sender
      'span[title*="@"]', // Title with email
      '.bA4 span',
      '.gD span'
    ];

    const searchRoot = parent || element;

    for (const selector of nameSelectors) {
      try {
        const nameEl = searchRoot.querySelector(selector);
        if (nameEl) {
          // Try attributes first
          let name = nameEl.getAttribute('data-name') || 
                     nameEl.getAttribute('data-sender-name') ||
                     nameEl.getAttribute('title') ||
                     nameEl.getAttribute('aria-label');
          
          // If no attribute, try text content
          if (!name || name.includes('@')) {
            name = nameEl.textContent || nameEl.innerText || '';
          }

          name = name.trim();
          
          // Clean up name (remove email if present, remove extra whitespace)
          name = name.replace(/<[^>]*>/g, ''); // Remove HTML tags
          name = name.replace(/[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, ''); // Remove email
          name = name.replace(/[<>]/g, ''); // Remove brackets
          name = name.split(/\s+/).filter(w => w.length > 0).join(' ').trim();

          if (isPlausibleName(name)) {
            return name;
          }
        }
      } catch (e) {
        // Continue to next selector
        continue;
      }
    }

    // Fallback: extract from text content
    const text = (parent || element).textContent || (parent || element).innerText || '';
    const fallback = extractNameFromText(text);
    return isPlausibleName(fallback) ? fallback : null;
  }

  function extractNameFromText(text, email) {
    if (!text) return null;

    // Remove email addresses from text first
    let cleanText = text.replace(/[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '');
    
    // Try to find name before email if email provided
    if (email) {
      const beforeEmail = text.split(email)[0];
      // Pattern: First Last or First Middle Last
      const nameMatch = beforeEmail.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        if (isPlausibleName(name)) return name;
      }
    }

    // Pattern: First Last (capitalized words)
    const nameMatch = cleanText.match(/\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      if (isPlausibleName(name)) return name;
    }

    // Pattern: "Name: John Doe" or "From: John Doe"
    const labeledMatch = cleanText.match(/(?:name|from|sender):\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
    if (labeledMatch) {
      const name = labeledMatch[1].trim();
      if (isPlausibleName(name)) return name;
    }

    return null;
  }

  function extractNameFromEmailContext(email) {
    if (!email) return null;
    const emailLower = email.toLowerCase();
    const root = document.querySelector('[role="main"]') || document.body;
    if (!root) return null;

    const candidates = [];
    const pushCandidate = (val, score) => {
      if (isPlausibleName(val)) {
        candidates.push({ val: val.trim(), score });
      }
    };

    // Header/display name sources
    const headerSelectors = [
      `[email="${emailLower}"]`,
      `[data-email="${emailLower}"]`,
      `[data-hovercard-id="${emailLower}"]`,
      `.gD[email]`,
      `.g2[email]`,
      `.go[email]`,
      `.gD[data-hovercard-id="${emailLower}"]`,
      `span[email="${emailLower}"]`
    ];
    headerSelectors.forEach(sel => {
      root.querySelectorAll(sel).forEach(el => {
        const attrs = [
          el.getAttribute('data-name'),
          el.getAttribute('data-sender-name'),
          el.getAttribute('title'),
          el.getAttribute('aria-label')
        ].filter(Boolean);
        const texts = [
          el.textContent || '',
          el.innerText || ''
        ];
        const raw = [...attrs, ...texts].map(s => (s || '').trim()).filter(Boolean);
        raw.forEach(r => {
          const cleaned = r
            .replace(/<[^>]*>/g, '')
            .replace(/[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '')
            .replace(/[<>]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 0)
            .join(' ')
            .trim();
          if (isPlausibleName(cleaned)) {
            pushCandidate(cleaned, 3);
          }
        });
      });
    });

    // Signature context: look at lines around where the email appears
    const nodes = root.querySelectorAll('[role="article"], .a3s, .ii, [data-message-id], .nH.if, [role="listitem"]');
    nodes.forEach(node => {
      const text = node.textContent || '';
      const lower = text.toLowerCase();
      if (!lower.includes(emailLower)) return;
      const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(emailLower)) {
          const windowLines = lines.slice(Math.max(0, idx - 3), idx + 1);
          const windowText = windowLines.join(' ');
          const name = extractNameFromText(windowText, emailLower);
          if (isPlausibleName(name)) {
            pushCandidate(name, 2);
          }
        }
      });
    });

    if (candidates.length === 0) return null;
    // Prefer highest score, then longer (more specific) names
    candidates.sort((a, b) => b.score - a.score || b.val.length - a.val.length);
    return candidates[0].val;
  }

  function extractJobTitle(text) {
    if (!text) return null;

    // Clean text
    let cleanText = text.replace(/[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '');
    cleanText = cleanText.replace(/https?:\/\/[^\s]+/gi, '');

    const titlePatterns = [
      // Danish titles with dash and "og" (e.g., "PR- og marketingchef")
      /([A-Z]{2,}(?:-[a-z]+)?\s+og\s+[a-z]+(?:chef|manager|direktør|director))/i,
      // Executive titles
      /(?:CEO|CTO|CFO|CMO|VP|SVP|EVP|President|Founder|Co-founder|Co-Founder)\s+(?:of\s+)?[A-Za-z\s&]+/i,
      // Business Partner titles (e.g., "Marketing Business Partner")
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Business\s+)?Partner)\b/i,
      // Director/Manager titles with "&" support (e.g., "Head of Marketing & Communication")
      /(?:Director|Manager|Lead|Head|Chief)\s+(?:of|for)\s+[A-Za-z\s&]+/i,
      // Director/Manager titles (general)
      /(?:Director|Manager|Lead|Head|Chief)\s+(?:of\s+)?[A-Za-z\s&]+/i,
      // Danish "chef" titles (e.g., "marketingchef", "salgschef")
      /([A-Za-z]+(?:chef|direktør|manager|director))/i,
      // Senior/Junior titles
      /(?:Senior|Junior|Principal|Staff|Associate)\s+[A-Za-z\s&]+/i,
      // Role-based titles with more keywords
      /([A-Z][a-z]+ (?:Engineer|Developer|Designer|Analyst|Specialist|Coordinator|Executive|Officer|Representative|Consultant|Advisor|Architect|Partner))/i,
      // Full title on a line (common in signatures) - appears after name, before contact details
      /^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,4})$/m,
      // "Title:" label
      /(?:title|position|role):\s*([A-Z][A-Za-z\s&.,-]{3,})/i,
      // Common patterns
      /\b([A-Z][a-z]+ (?:of|at|for)\s+[A-Z][A-Za-z\s&]+)\b/
    ];

    for (const pattern of titlePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        let title = (match[1] || match[0]).trim();
        // Validate title
        if (title.length > 3 && title.length < 60 && 
            !title.toLowerCase().includes('email') &&
            !title.toLowerCase().includes('phone') &&
            !title.includes('@')) {
          return title;
        }
      }
    }
    return null;
  }

  /**
   * Extract company name using email domain as a hint
   * e.g., if email is kable@porsche.dk, search for "porsche" in signature
   * and return the full company name like "Porsche Danmark"
   */
  function extractCompanyByDomainHint(text, domainHint) {
    if (!text || !domainHint) return null;
    
    const domainLower = domainHint.toLowerCase();
    
    // Split text into lines to find company name lines
    const lines = text.split(/\n/);
    
    // Look for lines that contain the domain word
    for (const line of lines) {
      const lineTrimmed = line.trim();
      const lineLower = lineTrimmed.toLowerCase();
      
      // Skip empty lines, phone numbers, email addresses, URLs
      if (!lineLower || 
          lineLower.match(/^\+?\d/) || // Phone numbers
          lineLower.includes('@') || // Email addresses
          lineLower.includes('http') || // URLs
          lineLower.length < 3 ||
          lineLower.match(/^(t|m|phone|tel|mobile|tlf):/i)) { // Phone labels
        continue;
      }
      
      // Check if this line contains the domain word
      if (lineLower.includes(domainLower)) {
        // Extract the company name from this line
        let company = lineTrimmed;
        
        // Remove common prefixes
        company = company.replace(/^(at|company|firma|virksomhed):?\s*/i, '');
        
        // Split by common separators (addresses often come after company name)
        // Look for patterns like "Company Name\nAddress" or "Company Name Address"
        // Try to extract just the company part (before address indicators)
        const addressIndicators = [
          /\s+\d+/,  // Numbers (street numbers, postal codes)
          /\s+(DK|SE|UK|USA|Denmark|Sweden|Norway|Germany|France|Spain|Italy)/i,  // Country names
          /\s+[A-Z]{1,2}\d{1,4}\s+[A-Z]/,  // Postal code patterns
          /\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)/i  // Street types
        ];
        
        // Find where address might start
        let addressStart = -1;
        for (const indicator of addressIndicators) {
          const match = company.search(indicator);
          if (match > 0 && (addressStart === -1 || match < addressStart)) {
            addressStart = match;
          }
        }
        
        // If we found an address indicator, cut the company name there
        if (addressStart > 0) {
          company = company.substring(0, addressStart).trim();
        }
        
        // Remove trailing common suffixes (but keep A/S, A.B., etc. if they're part of the name)
        company = company.replace(/\s+(Inc|LLC|Ltd|Corp|Corporation|Company|Co|L\.L\.C\.|Limited)$/i, '');
        
        // Remove any remaining trailing numbers or special chars
        company = company.replace(/\s+[^\w\s&.,-]+$/, ''); // Remove trailing special chars
        company = company.replace(/\s+\d+$/, ''); // Remove trailing standalone numbers
        
        // Validate: should be 2-50 chars, start with capital letter, contain domain word
        if (company.length >= 2 && 
            company.length <= 50 &&
            /^[A-Z]/.test(company) &&
            company.toLowerCase().includes(domainLower)) {
          // Additional validation: should look like a company name (not a sentence)
          const wordCount = company.split(/\s+/).length;
          if (wordCount <= 5) { // Company names are usually 1-5 words
            return company.trim();
          }
        }
      }
    }
    
    // If no line match, try regex pattern matching
    // Look for capitalized words containing the domain
    const pattern = new RegExp(`\\b([A-Z][A-Za-z0-9\\s&.,-]*${domainLower}[A-Za-z0-9\\s&.,-]*)\\b`, 'i');
    const match = text.match(pattern);
    if (match && match[1]) {
      let company = match[1].trim();
      // Clean up - remove trailing numbers/addresses
      company = company.replace(/\s+\d+.*$/, ''); // Remove trailing numbers/addresses
      // Validate length and word count
      const wordCount = company.split(/\s+/).length;
      if (company.length >= 2 && company.length <= 50 && wordCount <= 5) {
        return company;
      }
    }
    
    return null;
  }

  function companyFromEmailDomain(email) {
    if (!email || !email.includes('@')) return null;
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (!domain) return null;

    // Skip common public/provider domains
    const publicDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'yahoo.com', 'aol.com', 'proton.me', 'protonmail.com', 'me.com'];
    if (publicDomains.includes(domain)) return null;

    // Strip obvious subdomains
    const parts = domain.split('.');
    if (parts.length < 2) return null;
    // Remove leading subdomains like mail, smtp, mx
    const trimmed = parts.length > 2 && ['mail', 'smtp', 'mx', 'owa', 'webmail'].includes(parts[0]) ? parts.slice(1) : parts;
    const core = trimmed[0];
    if (!core || core.length < 2) return null;

    // Title-case hyphenated or simple words
    const words = core.split('-').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '').filter(Boolean);
    const candidate = words.join(' ');

    if (candidate.length >= 2 && candidate.length <= 50) {
      return candidate;
    }
    return null;
  }

  function extractCompany(text) {
    if (!text) return null;

    // Clean text - remove email addresses and URLs
    let cleanText = text.replace(/[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '');
    cleanText = cleanText.replace(/https?:\/\/[^\s]+/gi, '');
    cleanText = cleanText.replace(/linkedin\.com\/[^\s]+/gi, '');

    // Danish and European company markers
    const companyMarkers = [
      'A/S', 'ApS', 'IVS', 'P/S', 'K/S', 'I/S', 'A.m.b.a.', 'f.m.b.a.', 
      'Ltd', 'Limited', 'PLC', 'Inc', 'Corp', 'Corporation', 'GmbH', 'AG', 
      'SA', 'SAS', 'BV', 'NV', 'S.r.l.', 'Oy', 'AB', 'S.A.R.L.', 'LLP',
      'virksomhed', 'firma', 'selskab', 'koncern', 'afdeling', 'enhed', 'team'
    ];

    // Company label words (Danish and English)
    const companyLabels = [
      'Company', 'Company name', 'Organization', 'Organisation', 'Firm', 
      'Business', 'Brand', 'Group', 'Holdings', 'Media', 'Consulting', 
      'Solutions', 'Systems', 'Virksomhed:', 'Firma:', 'Selskab:'
    ];

    // Split into lines for better detection
    const lines = cleanText.split(/\n/);
    
    // First, try to find company with markers
    for (const line of lines) {
      const lineTrimmed = line.trim();
      if (!lineTrimmed || lineTrimmed.length < 3) continue;
      
      // Skip lines that are clearly not company names
      if (lineTrimmed.match(/^\+?\d/) || // Phone numbers
          lineTrimmed.includes('@') || // Email addresses
          lineTrimmed.match(/^https?:\/\//i) || // URLs
          lineTrimmed.match(/^(T|Tlf|Telefon|Mobil|Phone|Tel|Mobile):/i)) { // Phone labels
        continue;
      }

      // Check for company markers in the line
      for (const marker of companyMarkers) {
        const markerRegex = new RegExp(`\\b${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (markerRegex.test(lineTrimmed)) {
          // Extract company name with marker
          let company = lineTrimmed;
          
          // Remove label prefixes
          for (const label of companyLabels) {
            const labelRegex = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:?\\s*`, 'i');
            company = company.replace(labelRegex, '');
          }
          
          // Remove address parts (numbers, postal codes, street names)
          company = company.replace(/\s+\d+.*$/, ''); // Remove trailing numbers/addresses
          company = company.replace(/\s+(DK|SE|NO|UK|DE|FR|ES|IT|NL|BE|AT|CH|PL|CZ|FI|DK-\d{4}|\d{4}\s+[A-Z]{2,}).*$/i, ''); // Remove postal codes and countries
          
          // Clean up
          company = company.trim();
          
          // Validate
          if (company.length >= 2 && company.length <= 60 && 
              !company.match(/^\d+$/) &&
              !company.toLowerCase().includes('gmail') &&
              !company.toLowerCase().includes('yahoo') &&
              !company.toLowerCase().includes('outlook') &&
              !company.toLowerCase().includes('hotmail')) {
            return company;
          }
        }
      }
    }

    // Second, try to find company with labels
    for (const line of lines) {
      const lineTrimmed = line.trim();
      if (!lineTrimmed || lineTrimmed.length < 3) continue;
      
      // Skip phone/email/URL lines
      if (lineTrimmed.match(/^\+?\d/) || 
          lineTrimmed.includes('@') || 
          lineTrimmed.match(/^https?:\/\//i) ||
          lineTrimmed.match(/^(T|Tlf|Telefon|Mobil|Phone|Tel|Mobile):/i)) {
        continue;
      }

      // Check for company labels
      for (const label of companyLabels) {
        const labelRegex = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:?\\s*(.+)$`, 'i');
        const match = lineTrimmed.match(labelRegex);
        if (match && match[1]) {
          let company = match[1].trim();
          
          // Remove address parts
          company = company.replace(/\s+\d+.*$/, '');
          company = company.replace(/\s+(DK|SE|NO|UK|DE|FR|ES|IT|NL|BE|AT|CH|PL|CZ|FI|\d{4}\s+[A-Z]{2,}).*$/i, '');
          
          // Clean up
          company = company.trim();
          
          // Validate
          if (company.length >= 2 && company.length <= 60 &&
              /^[A-Z]/.test(company) && // Should start with capital
              !company.match(/^\d+$/) &&
              !company.toLowerCase().includes('gmail') &&
              !company.toLowerCase().includes('yahoo') &&
              !company.toLowerCase().includes('outlook') &&
              !company.toLowerCase().includes('hotmail')) {
            return company;
          }
        }
      }
    }

    // Third, try pattern matching for capitalized company names with markers
    const markerPattern = new RegExp(
      `\\b([A-Z][A-Za-z0-9\\s&.,-]{2,}(?:${companyMarkers.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))\\b`,
      'i'
    );
    const markerMatch = cleanText.match(markerPattern);
    if (markerMatch && markerMatch[1]) {
      let company = markerMatch[1].trim();
      company = company.replace(/\s+\d+.*$/, '');
      company = company.replace(/\s+(DK|SE|NO|UK|DE|FR|ES|IT|NL|BE|AT|CH|PL|CZ|FI|\d{4}\s+[A-Z]{2,}).*$/i, '');
      company = company.trim();
      
      if (company.length >= 2 && company.length <= 60 &&
          !company.match(/^\d+$/) &&
          !company.toLowerCase().includes('gmail') &&
          !company.toLowerCase().includes('yahoo') &&
          !company.toLowerCase().includes('outlook') &&
          !company.toLowerCase().includes('hotmail')) {
        return company;
      }
    }

    // Fallback: look for capitalized word sequences that might be company names
    const capitalizedPattern = /^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,4})$/m;
    const capMatch = cleanText.match(capitalizedPattern);
    if (capMatch && capMatch[1]) {
      const company = capMatch[1].trim();
      if (company.length >= 2 && company.length <= 50 &&
          !company.match(/^\d+$/) &&
          !company.toLowerCase().includes('gmail') &&
          !company.toLowerCase().includes('yahoo') &&
          !company.toLowerCase().includes('outlook') &&
          !company.toLowerCase().includes('hotmail')) {
        return company;
      }
    }

    return null;
  }

  function extractPhone(text, contactEmail = null, userEmailsToExclude = null) {
    if (!text) return null;

    // Split text by email addresses to create sections
    const emailPattern = /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    const emails = Array.from(text.matchAll(emailPattern)).map(m => ({ email: m[0], index: m.index }));
    
    // Danish and European phone labels
    const phoneLabels = [
      'T:', 'Tlf:', 'Tlf.:', 'Telefon:', 'Mobil:', 'Mob.:', 'Direkte:', 
      'Kontor:', 'Tel:', 'Tel.', 'Phone:', 'Mobile:', 'Cell:', 'Direct:', 
      'Office:', 'Switchboard:', 'Hotline', 'Support', 'Sales'
    ];

    // Phone patterns for European formats
    const phonePatterns = [
      // With labels - prioritize this (Danish/European labels)
      new RegExp(`(?:^|\\s)(?:${phoneLabels.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\s*([+]?\\d{1,3}[-.\\s]?(?:\\(0\\))?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,4}(?:[-.\\s]?\\d{1,9})?(?:\\s*(?:ext|ext\\.|x|#)\\s*\\d+)?)`, 'i'),
      
      // Danish format: +45 12 34 56 78 or +4512345678
      /(?:^|\s)([+]\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2})(?:\s*(?:ext|ext\.|x|#)\s*\d+)?/,
      
      // Danish format without country code: 12 34 56 78 or 12345678
      /(?:^|\s)(\d{2}\s?\d{2}\s?\d{2}\s?\d{2})(?:\s*(?:ext|ext\.|x|#)\s*\d+)?/,
      
      // UK format: +44 (0)20 7123 4567 or +44 20 7123 4567
      /(?:^|\s)([+]\d{2}\s?\(0\)?\s?\d{1,4}\s?\d{3,4}\s?\d{3,4})(?:\s*(?:ext|ext\.|x|#)\s*\d+)?/,
      
      // German format: +49 171 1234567
      /(?:^|\s)([+]\d{2}\s?\d{2,4}\s?\d{6,8})(?:\s*(?:ext|ext\.|x|#)\s*\d+)?/,
      
      // European format with spaces: +XX XX XXX XXXX
      /(?:^|\s)([+]\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4})(?:\s*(?:ext|ext\.|x|#)\s*\d+)?/,
      
      // European format without +: XX XX XX XX (8 digits)
      /(?:^|\s)(\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2})(?:\s*(?:ext|ext\.|x|#)\s*\d+)?/,
      
      // US/Canada: (123) 456-7890 or 123-456-7890
      /(?:^|\s)((\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})(?:\s*(?:ext|ext\.|x|#)\s*\d+)?/,
      
      // International compact: +XX XXXXXXXXXX
      /(?:^|\s)([+]\d{1,3}[-.\s]?\d{6,12})(?:\s*(?:ext|ext\.|x|#)\s*\d+)?/,
      
      // Long format: XXX-XXX-XXXX or XXX.XXX.XXXX
      /(?:^|\s)(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})(?:\s*(?:ext|ext\.|x|#)\s*\d+)?/
    ];

    // Helper to find phone numbers in text
    const findPhonesInText = (searchText) => {
      const found = [];
      for (const pattern of phonePatterns) {
        const matches = searchText.matchAll(new RegExp(pattern.source, pattern.flags + 'g'));
        for (const match of matches) {
          let phone = (match[1] || match[0]).trim();
          
          // Normalize phone number
          let normalized = phone.replace(/[-.\s()]/g, '');
          
          // Extract extension if present
          const extMatch = normalized.match(/(?:ext|ext\.|x|#)(\d+)$/i);
          const extension = extMatch ? extMatch[1] : null;
          if (extension) {
            normalized = normalized.replace(/(?:ext|ext\.|x|#)\d+$/i, '');
          }
          
          // Validate: should have at least 7 digits and at most 15 (without extension)
          const digits = normalized.replace(/\D/g, '');
          if (digits.length >= 7 && digits.length <= 15) {
            // Don't match years (1900-2099)
            if (digits.length === 4 && (digits.startsWith('19') || digits.startsWith('20'))) {
              continue;
            }
            
            // Format the phone number nicely
            let formatted = phone;
            
            // If we have extension, add it back
            if (extension) {
              formatted = `${phone.replace(/(?:ext|ext\.|x|#)\s*\d+$/i, '').trim()} ext. ${extension}`;
            }
            
            // Clean up formatting
            formatted = formatted.replace(/\s+/g, ' ').trim();
            
            found.push({ phone: formatted, index: searchText.indexOf(phone) });
          }
        }
      }
      return found;
    };

    // Strategy 1: If we have contactEmail, look for phone numbers near it
    if (contactEmail) {
      const contactEmailLower = contactEmail.toLowerCase();
      const contactEmailMatch = emails.find(e => e.email.toLowerCase() === contactEmailLower);
      
      if (contactEmailMatch) {
        // Extract text around the contact's email (500 chars before and after)
        const start = Math.max(0, contactEmailMatch.index - 500);
        const end = Math.min(text.length, contactEmailMatch.index + 500);
        const contextText = text.substring(start, end);
        
        const phonesNearContact = findPhonesInText(contextText);
        if (phonesNearContact.length > 0) {
          // Return the first phone found near contact's email
          return phonesNearContact[0].phone;
        }
      }
    }

    // Strategy 2: If we have userEmails, exclude phone numbers near them
    const userEmailsArray = Array.isArray(userEmailsToExclude) ? userEmailsToExclude : (userEmailsToExclude ? [userEmailsToExclude] : []);
    const excludedPhones = new Set();
    
    if (userEmailsArray.length > 0) {
      for (const userEmail of userEmailsArray) {
        const userEmailLower = userEmail.toLowerCase();
        const userEmailMatch = emails.find(e => e.email.toLowerCase() === userEmailLower);
        
        if (userEmailMatch) {
          // Find phones near user's email and exclude them
          const start = Math.max(0, userEmailMatch.index - 500);
          const end = Math.min(text.length, userEmailMatch.index + 500);
          const contextText = text.substring(start, end);
          
          const phonesNearUser = findPhonesInText(contextText);
          phonesNearUser.forEach(p => excludedPhones.add(p.phone));
        }
      }
    }

    // Strategy 3: Find all phones in text, excluding user's phones
    const allPhones = findPhonesInText(text);
    for (const phoneObj of allPhones) {
      if (!excludedPhones.has(phoneObj.phone)) {
        return phoneObj.phone;
      }
    }
    
    return null;
  }

  function extractLinkedIn(text) {
    const linkedinPattern = /(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([a-zA-Z0-9-]+)/i;
    const match = text.match(linkedinPattern);
    return match ? `https://linkedin.com/in/${match[1]}` : null;
  }

  function normalizeLinkedInUrl(urlOrSlug) {
    if (!urlOrSlug) return null;
    let val = urlOrSlug.trim();
    if (!val) return null;
    // If it's already a full URL, normalize
    if (val.startsWith('http')) {
      const match = val.match(/linkedin\.com\/(?:in|pub|company)\/[A-Za-z0-9-_.]+/i);
      if (match) return `https://${match[0].replace(/^https?:\/\//, '')}`;
    }
    // If it looks like a slug, assume /in/
    if (/^[A-Za-z0-9][A-Za-z0-9-_.]+$/.test(val)) {
      return `https://linkedin.com/in/${val}`;
    }
    return null;
  }

  function guessLinkedInFromNameAndCompany(contact) {
    const name = (getFullName(contact.firstName, contact.lastName) || contact.name || '').trim();
    const company = (contact.company || '').trim();
    if (!name) return null;
    // Build candidate slugs
    const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const nameParts = name.split(/\s+/).filter(Boolean);
    const baseSlug = slugify(nameParts.join('-'));
    const slugs = new Set();
    if (baseSlug) slugs.add(baseSlug);
    if (company) {
      const companySlug = slugify(company);
      if (companySlug) {
        slugs.add(`${baseSlug}-${companySlug}`);
        if (nameParts.length >= 2) {
          slugs.add(`${slugify(nameParts[0])}-${slugify(nameParts[nameParts.length - 1])}-${companySlug}`);
        }
      }
    }
    for (const slug of slugs) {
      const url = normalizeLinkedInUrl(slug);
      if (url) return { url, guessed: true };
    }
    return null;
  }

  function extractLinkedInFromThreadContext(email) {
    const root = document.querySelector('[role="main"]') || document.body;
    if (!root) return null;
    const emailLower = (email || '').toLowerCase();
    const candidates = [];
    // Look for explicit linkedin links in the thread
    const links = root.querySelectorAll('a[href*="linkedin.com"]');
    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      const url = normalizeLinkedInUrl(href);
      if (url) {
        candidates.push({ url, score: href.toLowerCase().includes('/in/') ? 3 : 2 });
      }
    });
    // Look for plain text linkedin URLs near the sender email
    const nodes = root.querySelectorAll('[role="article"], .a3s, .ii, [data-message-id], .nH.if, [role="listitem"]');
    nodes.forEach(node => {
      const text = node.textContent || '';
      if (!text.toLowerCase().includes('linkedin.com')) return;
      // If the node also contains the sender email, boost
      const scoreBoost = emailLower && text.toLowerCase().includes(emailLower) ? 1 : 0;
      const match = text.match(/linkedin\.com\/(?:in|pub|company)\/[A-Za-z0-9-_.]+/i);
      if (match) {
        const url = normalizeLinkedInUrl(match[0]);
        if (url) candidates.push({ url, score: 2 + scoreBoost });
      }
    });
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  function showApprovalPanel(contact, existing) {
    console.log(`CRMSYNC: showApprovalPanel called`, { email: contact.email, existing: !!existing, contact });
    
    // Check exclusions BEFORE showing the panel
    console.log(`🔍 DEBUG (old panel): Checking exclusions for ${contact.email}`);
    console.log(`🔍 DEBUG: Name: First="${contact.firstName}", Last="${contact.lastName}"`);
    
    const nameExcluded = isExcludedName(contact.firstName, contact.lastName);
    if (nameExcluded) {
      const fullName = getFullName(contact.firstName, contact.lastName);
      console.log(`✋ CRMSYNC: Contact BLOCKED by name: ${fullName}`);
      return; // Don't show approval panel for excluded names
    }
    
    const domainExcluded = isExcludedDomain(contact.email);
    if (domainExcluded) {
      console.log(`✋ CRMSYNC: Contact BLOCKED by domain: ${contact.email}`);
      return; // Don't show approval panel for excluded domains
    }
    
    // Remove any existing panels for this email
    const existingPanels = document.querySelectorAll('.contact-approval-panel');
    console.log(`CRMSYNC: Found ${existingPanels.length} existing approval panels`);
    existingPanels.forEach(panel => {
      if (panel.querySelector(`[data-email="${contact.email}"]`)) {
        console.log(`CRMSYNC: Removing existing panel for ${contact.email}`);
        panel.remove();
      }
    });

    const panel = document.createElement('div');
    panel.className = 'contact-approval-panel';
    panel.innerHTML = `
      <div class="approval-header">
        <h3>${existing ? 'Update Contact' : 'New Contact'}</h3>
        <button class="close-btn">×</button>
      </div>
      <div class="approval-content">
        <div class="contact-preview">
          <div class="contact-field">
            <div class="field-top">
              <label>Email</label>
            </div>
            <div class="field-value" data-field="email">${contact.email}</div>
          </div>

          ${['name','jobTitle','company','phone','linkedin'].map(field => {
            const pretty = {
              name: 'Name',
              jobTitle: 'Job Title',
              company: 'Company',
              phone: 'Phone',
              linkedin: 'LinkedIn'
            }[field];
            // Handle name specially - combine firstName and lastName
            const value = field === 'name' 
              ? getFullName(contact.firstName, contact.lastName) 
              : contact[field];
            const display = field === 'linkedin'
              ? (value ? `<a href="${value}" target="_blank">View Profile</a>` : 'Not found')
              : (value || 'Not found');
            return `
              <div class="contact-field">
                <div class="field-top" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                  <label style="margin:0;">${pretty}</label>
                  <div class="field-actions" style="display:flex;gap:6px;">
                    <button class="btn-field-retry" data-field="${field}" title="Retry" style="padding:4px 8px;font-size:12px;">↻ Retry</button>
                    <button class="btn-field-edit" data-field="${field}" title="Edit" style="padding:4px 8px;font-size:12px;">✏ Edit</button>
                  </div>
                </div>
                <div class="field-value" data-field="${field}">${display}</div>
                <div class="field-status" data-field-status="${field}" style="font-size:11px;opacity:0.7;margin-top:2px;"></div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="approval-actions">
          <button class="btn-approve" data-email="${contact.email}">✓ Approve</button>
          <button class="btn-reject" data-email="${contact.email}">✗ Reject</button>
        </div>
      </div>
    `;

    panel.querySelector('.close-btn').addEventListener('click', () => {
      playClickSound('close');
      panel.remove();
      pendingContacts = pendingContacts.filter(p => p.email !== contact.email);
    });

    panel.querySelector('.btn-approve').addEventListener('click', async () => {
      playClickSound('approve');
      await approveContact(contact, existing);
      panel.remove();
    });

    panel.querySelector('.btn-reject').addEventListener('click', () => {
      playClickSound('reject');
    markRejected(contact.email);
      pendingContacts = pendingContacts.filter(p => p.email !== contact.email);
      panel.remove();
    });

    const setFieldValue = (field, value) => {
      const target = panel.querySelector(`[data-field="${field}"]`);
      if (!target) return;
      if (field === 'linkedin') {
        target.innerHTML = value ? `<a href="${value}" target="_blank">View Profile</a>` : 'Not found';
      } else {
        target.textContent = value || 'Not found';
      }
    };

    const setStatus = (field, message) => {
      const el = panel.querySelector(`[data-field-status="${field}"]`);
      if (el) el.textContent = message || '';
    };

    const syncPending = (field, value) => {
      const idx = pendingContacts.findIndex(c => c.email === contact.email);
      if (idx >= 0) {
        pendingContacts[idx] = { ...pendingContacts[idx], [field]: value };
      }
    };

    panel.querySelectorAll('.btn-field-retry').forEach(btn => {
      btn.addEventListener('click', async () => {
        const field = btn.getAttribute('data-field');
        setStatus(field, 'Retrying...');
        btn.disabled = true;
        try {
          const result = await retryFieldExtraction(contact, field);
          if (result.updated) {
            setFieldValue(field, result.value);
            
            // Handle name field specially - split into firstName/lastName
            if (field === 'name' && result.value) {
              const { firstName, lastName } = splitName(result.value);
              contact.firstName = firstName;
              contact.lastName = lastName;
              // Update pending contacts
              const idx = pendingContacts.findIndex(c => c.email === contact.email);
              if (idx >= 0) {
                pendingContacts[idx] = { ...pendingContacts[idx], firstName, lastName };
              }
            } else {
              contact[field] = result.value;
              syncPending(field, result.value);
            }
            
            if (result.meta && result.meta.guessed) {
              setStatus(field, `Guessed ${field} (please verify)`);
            } else {
              setStatus(field, `Updated ${field}`);
            }
          } else {
            setStatus(field, 'No better data found');
          }
        } catch (err) {
          console.error('Retry field extraction failed', err);
          setStatus(field, 'Retry failed');
        } finally {
          btn.disabled = false;
        }
      });
    });

    panel.querySelectorAll('.btn-field-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.getAttribute('data-field');
        const currentVal = field === 'name' 
          ? getFullName(contact.firstName, contact.lastName) 
          : (contact[field] || '');
        const input = window.prompt(`Edit ${field}`, currentVal);
        if (input === null) return; // cancelled
        const trimmed = input.trim();
        const newVal = trimmed.length ? trimmed : null;
        
        // Handle name field specially - split into firstName/lastName
        if (field === 'name' && newVal) {
          const { firstName, lastName } = splitName(newVal);
          contact.firstName = firstName;
          contact.lastName = lastName;
          // Update pending contacts
          const idx = pendingContacts.findIndex(c => c.email === contact.email);
          if (idx >= 0) {
            pendingContacts[idx] = { ...pendingContacts[idx], firstName, lastName };
          }
        } else {
          contact[field] = newVal;
          syncPending(field, newVal);
        }
        
        setFieldValue(field, newVal);
        setStatus(field, 'Edited');
      });
    });

    console.log(`CRMSYNC: Appending approval panel to document.body for ${contact.email}`);
    document.body.appendChild(panel);
    console.log(`CRMSYNC: Panel appended, panel.parentNode:`, panel.parentNode);
    
    setTimeout(() => {
      if (panel.parentNode) {
        console.log(`CRMSYNC: Panel still in DOM after timeout, adding show class`);
        panel.classList.add('visible');
      }
    }, 10);

    // Keep panel open; do not auto-close to avoid re-triggering scans
  }

  async function retryFieldExtraction(contact, field) {
    const emailLower = (contact.email || '').toLowerCase();
    if (!emailLower) return { updated: false, value: null };

    const root = document.querySelector('[role="main"]') || document.body;
    if (!root) return { updated: false, value: null };

    const nodes = root.querySelectorAll('[role="article"], .a3s, .ii, [data-message-id], .nH.if, [role="listitem"]');
    let bestText = '';
    nodes.forEach(node => {
      const text = node.textContent || '';
      if (text && text.toLowerCase().includes(emailLower) && text.length > bestText.length) {
        bestText = text;
      }
    });

    if (!bestText && document.body) {
      const pageText = document.body.textContent || '';
      if (pageText.toLowerCase().includes(emailLower)) {
        bestText = pageText;
      }
    }

    if (!bestText) return { updated: false, value: null };

    let newValue = null;
    switch (field) {
      case 'company':
        // Try email-domain-derived company first (most reliable quick win)
        newValue = companyFromEmailDomain(contact.email) || companyFromEmailDomain(emailLower);
        if (!newValue) {
          // Then try domain hint inside the text
          const domainPart = (contact.email || '').split('@')[1]?.split('.')[0];
          newValue = extractCompanyByDomainHint(bestText, domainPart) || extractCompany(bestText);
        }
        break;
      case 'jobTitle':
        newValue = extractJobTitle(bestText);
        break;
      case 'name':
        newValue = extractNameFromEmailContext(contact.email) ||
                   extractNameFromText(bestText, contact.email) ||
                   extractNameFromText(bestText, emailLower);
        break;
      case 'phone':
        newValue = extractPhone(bestText);
        break;
      case 'linkedin':
        // 1) Explicit links in thread
        const fromContext = extractLinkedInFromThreadContext(contact.email);
        if (fromContext && fromContext.url) {
          newValue = fromContext.url;
          resultMeta = { guessed: false };
          break;
        }
        // 2) Plain text in body we already scanned
        newValue = extractLinkedIn(bestText);
        if (newValue) {
          resultMeta = { guessed: false };
          break;
        }
        // 3) Heuristic guess from name + company/domain
        const guess = guessLinkedInFromNameAndCompany(contact);
        if (guess && guess.url) {
          newValue = guess.url;
          resultMeta = { guessed: true };
        }
        break;
      default:
        return { updated: false, value: null };
    }

    if (newValue && typeof newValue === 'string') {
      newValue = newValue.trim();
    }

    if (newValue && newValue !== contact[field]) {
      contact[field] = newValue;
      const idx = pendingContacts.findIndex(c => c.email === contact.email);
      if (idx >= 0) {
        pendingContacts[idx] = { ...pendingContacts[idx], [field]: newValue };
      }
      return { updated: true, value: newValue };
    }

    return { updated: false, value: contact[field] || null };
  }

  async function approveContact(contact, existing) {
    try {
      clearRejected(contact.email);
      // Ensure contact has required fields for export
      const contactToSave = {
        ...contact,
        status: 'approved', // Explicitly set status to approved
        lastContactAt: contact.lastContactAt || contact.lastContact || new Date().toISOString(),
        firstContactAt: contact.firstContactAt || contact.createdAt || new Date().toISOString()
      };

      // Track whether we actually updated any details on an existing contact
      let wasUpdated = false;

      if (existing) {
        // Smart merge: update fields intelligently
        const merged = { 
          ...existing,
          status: 'approved' // Ensure status is approved
        };
        
        // Update lastContactAt if new contact has more recent date
        if (contactToSave.lastContactAt) {
          const existingDate = existing.lastContactAt ? new Date(existing.lastContactAt) : null;
          const newDate = new Date(contactToSave.lastContactAt);
          if (!existingDate || newDate > existingDate) {
            merged.lastContactAt = contactToSave.lastContactAt;
          }
        }
        
        // Smart field updates: fill missing OR update with better/more complete data
        // Name: update if missing or new one is longer/more complete
        const contactToSaveName = getFullName(contactToSave.firstName, contactToSave.lastName) || contactToSave.name;
        const mergedName = getFullName(merged.firstName, merged.lastName) || merged.name;
        if (contactToSaveName) {
          if (!mergedName || 
              (contactToSaveName.length > mergedName.length && 
               contactToSaveName.split(' ').length >= mergedName.split(' ').length)) {
            merged.name = contactToSave.name;
          }
        }
        
        // Company: update if missing or new one is more complete (longer, has company markers)
        if (contactToSave.company) {
          if (!merged.company) {
            merged.company = contactToSave.company;
          } else {
            // Update if new company name is longer and contains company markers (A/S, Ltd, etc.)
            const companyMarkers = /(A\/S|ApS|IVS|Ltd|Limited|GmbH|AG|SA|SAS|BV|NV|Inc|Corp|Corporation)/i;
            const newHasMarker = companyMarkers.test(contactToSave.company);
            const existingHasMarker = companyMarkers.test(merged.company);
            
            if (newHasMarker && !existingHasMarker) {
              merged.company = contactToSave.company; // New has marker, existing doesn't
            } else if (contactToSave.company.length > merged.company.length + 3) {
              // New is significantly longer (likely more complete)
              merged.company = contactToSave.company;
            }
          }
        }
        
        // Job Title: update if missing or new one is more specific (longer)
        if (contactToSave.jobTitle) {
          if (!merged.title && !merged.jobTitle) {
            merged.title = contactToSave.jobTitle;
            merged.jobTitle = contactToSave.jobTitle;
          } else {
            const existingTitle = merged.title || merged.jobTitle || '';
            // Update if new title is longer (more specific) or contains "Senior", "Lead", "Chief", etc.
            const seniorKeywords = /(Senior|Lead|Chief|Head|Director|VP|President|CEO|CTO|CFO)/i;
            const newHasSenior = seniorKeywords.test(contactToSave.jobTitle);
            const existingHasSenior = seniorKeywords.test(existingTitle);
            
            if (newHasSenior && !existingHasSenior) {
              merged.title = contactToSave.jobTitle;
              merged.jobTitle = contactToSave.jobTitle;
            } else if (contactToSave.jobTitle.length > existingTitle.length + 5) {
              merged.title = contactToSave.jobTitle;
              merged.jobTitle = contactToSave.jobTitle;
            }
          }
        }
        
        // Phone: update if missing or new one has country code/extensions
        if (contactToSave.phone) {
          if (!merged.phone) {
            merged.phone = contactToSave.phone;
          } else {
            // Update if new phone has country code (+) and existing doesn't
            const newHasCountryCode = contactToSave.phone.includes('+');
            const existingHasCountryCode = merged.phone.includes('+');
            const newHasExtension = /(ext|ext\.|x|#)\s*\d+/i.test(contactToSave.phone);
            const existingHasExtension = /(ext|ext\.|x|#)\s*\d+/i.test(merged.phone);
            
            if ((newHasCountryCode && !existingHasCountryCode) ||
                (newHasExtension && !existingHasExtension) ||
                (contactToSave.phone.replace(/\D/g, '').length > merged.phone.replace(/\D/g, '').length)) {
              merged.phone = contactToSave.phone;
            }
          }
        }
        
        // LinkedIn: update if missing or new one is different (might be more complete)
        if (contactToSave.linkedin) {
          if (!merged.linkedin) {
            merged.linkedin = contactToSave.linkedin;
          } else if (contactToSave.linkedin !== merged.linkedin) {
            // Update if new LinkedIn URL is different (might be more complete)
            merged.linkedin = contactToSave.linkedin;
          }
        }
        
        // Detect meaningful changes
        const trackedFields = [
          'name',
          'company',
          'title',
          'jobTitle',
          'phone',
          'linkedin',
          'lastContactAt',
          'firstContactAt'
        ];
        wasUpdated = trackedFields.some(key => merged[key] !== existing[key]);

        await chrome.runtime.sendMessage({ action: 'updateContact', contact: merged });
      } else {
        await chrome.runtime.sendMessage({ action: 'saveContact', contact: contactToSave });
      }
      
      pendingContacts = pendingContacts.filter(p => p.email !== contact.email);
      await loadContacts();
      updateWidget();
      updateSidebar();

      if (wasUpdated) {
        showNotification(`Updated contact details for ${contact.email}`);
      }
    } catch (error) {
      console.error('CRMSYNC: Error approving contact', error);
    }
  }

  function showNotification(message) {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification-panel');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = 'notification-panel';
    notification.textContent = message;
    notification.style.zIndex = '10003';
    document.body.appendChild(notification);
    
    // Force visibility
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add('visible');
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
      }
    }, 10);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.remove('visible');
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 4000);
  }

  function createSidebar() {
    // Remove existing sidebar if any
    if (sidebarContainer && sidebarContainer.parentNode) {
      sidebarContainer.remove();
    }

    sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'contact-extractor-sidebar';
    sidebarContainer.style.width = sidebarWidth + 'px';
    sidebarContainer.innerHTML = `
      <div class="sidebar-resize-handle"></div>
      
      <!-- Header -->
      <div class="sidebar-header">
        <button class="sidebar-settings-btn" title="Settings">⚙️</button>
        <img src="${chrome.runtime.getURL('icons/header-logo.png')}" alt="CRMSYNC" class="sidebar-logo-center" onerror="this.src='${chrome.runtime.getURL('icons/widget-logo.png')}'" />
        <button class="toggle-sidebar" title="Close Sidebar">✕</button>
      </div>

      <!-- Session Stats (Collapsed by Default) -->
      <div class="sidebar-session-stats-compact" id="sidebar-stats-toggle">
        <div class="stats-summary">
          <span>📊 Today: <strong id="sidebar-stats-text">0 new, 0 synced</strong></span>
          <button class="stats-expand-btn" id="sidebar-stats-expand">▼</button>
        </div>
        <div class="stats-expanded" id="sidebar-stats-expanded" style="display: none;">
          <div class="stat-card-inline">
            <span class="stat-label-inline">New Today</span>
            <span class="stat-value-inline" id="sidebar-new-count">0</span>
          </div>
          <div class="stat-card-inline">
            <span class="stat-label-inline">Synced</span>
            <span class="stat-value-inline" id="sidebar-synced-count">0</span>
          </div>
          <div class="stat-card-inline">
            <span class="stat-label-inline">Follow-ups</span>
            <span class="stat-value-inline" id="sidebar-followups-count">0</span>
          </div>
        </div>
      </div>

      <!-- Contact Limit Warning Banner -->
      <div id="sidebar-limit-banner" class="sidebar-limit-banner" style="display: none;">
        <div class="limit-banner-content">
          <div class="limit-banner-icon">⚠️</div>
          <div class="limit-banner-text">
            <div class="limit-banner-title">Contact Limit Warning</div>
            <div class="limit-banner-subtitle" id="sidebar-limit-text">-/-</div>
          </div>
          <button class="limit-banner-btn" id="sidebar-upgrade-btn">Upgrade</button>
        </div>
      </div>

      <!-- Single Content Section -->
      <div class="sidebar-content">
        <!-- Today's Contacts Section -->
        <div class="sidebar-today-section">
          <div class="section-header">
            <h3>📧 Today's Contacts</h3>
            <span class="count-badge" id="sidebar-today-badge">0</span>
          </div>
          
          <div id="sidebar-today-contacts-list" class="sidebar-contacts-list">
            <!-- Today's contacts will be rendered here -->
          </div>
          
          <div class="sidebar-empty-state" id="sidebar-empty-state" style="display: none;">
            <div class="empty-icon">📭</div>
            <div class="empty-text">No new contacts today</div>
            <div class="empty-subtext">Open an email to detect contacts</div>
          </div>
        </div>
      </div>

      <!-- Floating Action Button -->
      <button class="sidebar-fab" id="sidebar-fab-btn" title="Quick Actions">
        <span>+</span>
      </button>
      
      <!-- FAB Menu (Hidden by Default) -->
      <div class="sidebar-fab-menu" id="sidebar-fab-menu" style="display: none;">
        <button class="fab-menu-item" id="fab-scan-btn">
          <span class="fab-icon">🔍</span>
          <span class="fab-label">Scan Inbox</span>
        </button>
        <button class="fab-menu-item" id="fab-popup-btn">
          <span class="fab-icon">📤</span>
          <span class="fab-label">Open Full View</span>
        </button>
        <button class="fab-menu-item" id="fab-settings-btn">
          <span class="fab-icon">⚙️</span>
          <span class="fab-label">Settings</span>
        </button>
      </div>
    `;

    document.body.appendChild(sidebarContainer);
    
    // Inject CSS styles for simplified sidebar
    if (!document.getElementById('crmsync-sidebar-styles')) {
      const style = document.createElement('style');
      style.id = 'crmsync-sidebar-styles';
      style.textContent = `
        /* Compact Sidebar Styles */
        
        /* Collapsed Stats */
        .sidebar-session-stats-compact {
          padding: 12px 16px;
          background: var(--surface, #f8f9fa);
          border-bottom: 1px solid var(--border, #e5e7eb);
        }
        
        .stats-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text, #1f2937);
          cursor: pointer;
        }
        
        .stats-summary:hover {
          color: var(--primary, #7c3aed);
        }
        
        .stats-expand-btn {
          background: transparent;
          border: none;
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          color: var(--text-secondary, #6b7280);
          transition: all 0.2s;
        }
        
        .stats-expand-btn:hover {
          color: var(--primary, #7c3aed);
        }
        
        .stats-expanded {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border, #e5e7eb);
        }
        
        .stat-card-inline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 6px;
        }
        
        .stat-label-inline {
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
          font-weight: 500;
        }
        
        .stat-value-inline {
          font-size: 16px;
          font-weight: 700;
          color: var(--text, #1f2937);
        }
        
        /* Compact Contact Cards (2 rows) */
        .sidebar-contact-card-compact {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .sidebar-contact-card-compact:hover {
          border-color: var(--primary, #7c3aed);
          transform: translateX(-2px);
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.12);
        }
        
        .contact-row-compact {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        
        .contact-name-compact {
          font-weight: 600;
          font-size: 13px;
          color: var(--text, #1f2937);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
        
        .contact-email-compact {
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .sync-badge {
          font-size: 12px;
          font-weight: 600;
          color: var(--success, #10b981);
          flex-shrink: 0;
        }
        
        /* Floating Action Button */
        .sidebar-fab {
          position: fixed;
          bottom: 24px;
          right: calc(100% - var(--sidebar-width, 320px) + 24px);
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--primary, #7c3aed);
          color: white;
          border: none;
          font-size: 24px;
          font-weight: 300;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10001;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .sidebar-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.6);
        }
        
        .sidebar-fab:active {
          transform: scale(0.95);
        }
        
        /* FAB Menu */
        .sidebar-fab-menu {
          position: fixed;
          bottom: 90px;
          right: calc(100% - var(--sidebar-width, 320px) + 24px);
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 10000;
        }
        
        .fab-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 28px;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 500;
          color: var(--text, #1f2937);
          white-space: nowrap;
        }
        
        .fab-menu-item:hover {
          background: var(--primary, #7c3aed);
          color: white;
          transform: translateX(-4px);
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3);
        }
        
        .fab-icon {
          font-size: 18px;
        }
        
        .fab-label {
          font-size: 13px;
        }
        
        /* Today Section */
        .sidebar-today-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        
        .sidebar-today-section .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }
        
        .sidebar-today-section .section-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text, #1f2937);
        }
        
        .sidebar-contacts-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px 16px;
        }
        
        .sidebar-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
        }
        
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .empty-text {
          font-size: 14px;
          font-weight: 600;
          color: var(--text, #1f2937);
          margin-bottom: 4px;
        }
        
        .empty-subtext {
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
        }
        
        .sidebar-settings-btn {
          background: transparent;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s;
          line-height: 1;
        }
        
        .sidebar-settings-btn:hover {
          background: var(--surface, #f8f9fa);
          transform: scale(1.1);
        }
        
        /* Dark mode adjustments */
        [data-theme="dark"] .stat-card-inline,
        [data-theme="dark"] .sidebar-contact-card-compact,
        [data-theme="dark"] .fab-menu-item {
          background: var(--card-bg, #1e293b);
          border-color: var(--border, #334155);
        }
        
        [data-theme="dark"] .sidebar-session-stats-compact {
          background: var(--surface, #0f172a);
          border-color: var(--border, #334155);
        }
        
        [data-theme="dark"] .fab-menu-item:hover {
          background: var(--primary, #7c3aed);
          color: white;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Attach all event listeners with error handling
    try {
      attachSidebarEventListeners();
      // Ensure buttons are clickable
      ensureButtonsClickable();
    } catch (error) {
      console.error('CRMSYNC: Error attaching sidebar event listeners:', error);
    }
    
    updateSidebar();
    
    // Resize handle
    const resizeHandle = sidebarContainer.querySelector('.sidebar-resize-handle');
    if (resizeHandle) {
      let isResizing = false;
      let startX = 0;
      let startWidth = 0;

      resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = sidebarWidth;
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
        e.preventDefault();
      });

      function handleResize(e) {
        if (!isResizing) return;
        const diff = startX - e.clientX; // Reverse because sidebar is on right
        const newWidth = Math.max(250, Math.min(600, startWidth + diff));
        sidebarWidth = newWidth;
        sidebarContainer.style.width = sidebarWidth + 'px';
        applySidebarWidthCSS();
        updateFloatingWidgetPosition();
        chrome.storage.local.set({ sidebarWidth: sidebarWidth });
      }

      function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
      }
    }
  }

  // Separate function to attach all sidebar event listeners
  function attachSidebarEventListeners() {
    if (!sidebarContainer) return;
    
    // Use event delegation for more reliable button handling
    sidebarContainer.addEventListener('click', (e) => {
      const target = e.target;
      const button = target.closest('button');
      if (!button) return;
      
      // Handle toggle sidebar button
      if (button.classList.contains('toggle-sidebar')) {
        e.stopPropagation();
        e.preventDefault();
        playClickSound('navigation');
        toggleSidebar();
        return;
      }
      
      // Handle export buttons
      if (button.classList.contains('btn-export-csv')) {
        e.stopPropagation();
        playClickSound('action');
        handleExportClick();
        return;
      }
      
      // Handle clear button
      if (button.classList.contains('btn-clear-contacts')) {
        e.stopPropagation();
        playClickSound('reject');
        handleClearClick();
        return;
      }
      
      // Handle scan all button
      if (button.classList.contains('btn-scan-all')) {
        e.stopPropagation();
        playClickSound('action');
        bulkScanAllEmails();
        return;
      }
      
      // Handle bulk approve buttons
      if (button.classList.contains('btn-bulk-approve') || button.classList.contains('btn-bulk-approve-small')) {
        e.stopPropagation();
        showBulkApprovalPanel();
        return;
      }
      
      // Handle export today button
      if (button.classList.contains('btn-export-today')) {
        e.stopPropagation();
        handleExportTodayClick();
        return;
      }
      
    });
    
    // Toggle sidebar - ensure it works properly (keep for compatibility)
    const toggleBtn = sidebarContainer.querySelector('.toggle-sidebar');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        playClickSound('navigation');
        toggleSidebar();
      });
    }

    // Scan all emails
    const scanAllBtn = sidebarContainer.querySelector('.btn-scan-all');
    if (scanAllBtn) {
      scanAllBtn.addEventListener('click', async () => {
        playClickSound('action');
        await bulkScanAllEmails();
      });
    }

    // Export CSV handler function
    async function handleExportClick() {
      try {
        // Get contacts directly
        const result = await chrome.storage.local.get(['contacts']);
        const contactsToExport = result.contacts || [];
        
        if (contactsToExport.length === 0) {
          showNotification('No contacts to export.');
          return;
        }
        
        // Create CSV
        const headers = ['Name', 'Email', 'Job Title', 'Company', 'Phone', 'LinkedIn', 'Last Contact', 'Status'];
        const rows = contactsToExport.map(contact => [
          getFullName(contact.firstName, contact.lastName) || contact.name || '',
          contact.email || '',
          contact.jobTitle || '',
          contact.company || '',
          contact.phone || '',
          contact.linkedin || '',
          contact.lastContact || '',
          contact.status || 'New'
        ]);
        
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        // Create and download
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const filename = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification(`Exported ${contactsToExport.length} contacts!`);
      } catch (error) {
        console.error('Export error:', error);
        showNotification('Export failed. Please try again.');
      }
    }
    
    // Export CSV - attach to ALL export buttons (CRM tab and Overview tab)
    const exportButtons = sidebarContainer.querySelectorAll('.btn-export-csv');
    exportButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        playClickSound('action');
        handleExportClick();
      });
    });

    // Clear contacts handler function
    async function handleClearClick() {
      try {
        const confirmed = window.confirm('This will remove all saved contacts from CRMSYNC. This cannot be undone. Continue?');
        if (!confirmed) {
          return;
        }
        const response = await chrome.runtime.sendMessage({ type: 'CLEAR_CONTACTS' });
        if (response && response.success) {
          showNotification('All contacts cleared.');
          contacts = [];
          pendingContacts = [];
          sessionFoundCount = 0;
          lastSeenCountAtSidebarOpen = 0;
          chrome.storage.local.set({
            contacts: [],
            pendingContacts: [],
            sessionFoundCount,
            lastSeenCountAtSidebarOpen
          });
          await loadContacts(); // Reload to ensure state is synced
          updateSidebar();
          updateWidget();
        } else {
          showNotification('Failed to clear contacts. Please try again.');
        }
      } catch (error) {
        console.error('CRMSYNC: Error clearing contacts from sidebar', error);
        showNotification('Error clearing contacts.');
      }
    }
    
    // Clear all contacts from sidebar - ensure it works
    const clearBtn = sidebarContainer.querySelector('.btn-clear-contacts');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        playClickSound('reject');
        handleClearClick();
      });
    }

    // Bulk Approve - check if buttons exist
    const bulkApproveBtn = sidebarContainer.querySelector('.btn-bulk-approve');
    if (bulkApproveBtn) {
      bulkApproveBtn.addEventListener('click', () => {
        playClickSound('approve');
        showBulkApprovalPanel();
      });
    }

    const bulkApproveSmallBtn = sidebarContainer.querySelector('.btn-bulk-approve-small');
    if (bulkApproveSmallBtn) {
      bulkApproveSmallBtn.addEventListener('click', () => {
        playClickSound('approve');
        showBulkApprovalPanel();
      });
    }

    // Setup sidebar tabs
    setupSidebarTabs();

    // CRM tab event listeners
    const searchInput = document.getElementById('sidebar-search-input');
    const statusFilter = document.getElementById('sidebar-status-filter');
    const sortSelect = document.getElementById('sidebar-sort');
    
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => loadSidebarCRM(), 300);
      });
    }
    
    if (statusFilter) {
      statusFilter.addEventListener('change', () => loadSidebarCRM());
    }
    
    if (sortSelect) {
      sortSelect.addEventListener('change', () => loadSidebarCRM());
    }

    // Export Today handler function
    async function handleExportTodayClick() {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'EXPORT_AND_MARK_REVIEWED' });
        if (response && response.success) {
          showNotification(`Exported ${response.count || 0} contacts!`);
          loadSidebarToday();
        } else {
          showNotification('Export failed. Please try again.');
        }
      } catch (error) {
        console.error('Error exporting today:', error);
        showNotification('Export failed.');
      }
    }
    
    // Export Today button
    const exportTodayBtn = sidebarContainer.querySelector('.btn-export-today');
    if (exportTodayBtn) {
      exportTodayBtn.addEventListener('click', () => {
        playClickSound('action');
        handleExportTodayClick();
      });
    }

    // Note: Sidebar can only be closed via the hide button, not by clicking outside
  }
  
  // Ensure buttons are clickable - add pointer-events and cursor styles
  function ensureButtonsClickable() {
    if (!sidebarContainer) return;
    
    // Ensure all buttons have proper cursor and pointer-events
    const allButtons = sidebarContainer.querySelectorAll('button');
    allButtons.forEach(btn => {
      btn.style.cursor = 'pointer';
      btn.style.pointerEvents = 'auto';
      // Remove any disabled state that might prevent clicks
      if (btn.disabled) {
        btn.disabled = false;
      }
    });
  }

  // Setup sidebar button handlers (simplified - no tabs)
  function setupSidebarTabs() {
    // Settings button - opens popup in settings tab
    const settingsBtn = sidebarContainer.querySelector('.sidebar-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound('navigation');
        // Open popup via background script
        chrome.runtime.sendMessage({ action: 'openPopup' });
      });
    }

    // Stats toggle button
    const statsExpandBtn = sidebarContainer.querySelector('#sidebar-stats-expand');
    const statsExpanded = sidebarContainer.querySelector('#sidebar-stats-expanded');
    if (statsExpandBtn && statsExpanded) {
      statsExpandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound('navigation');
        const isExpanded = statsExpanded.style.display !== 'none';
        statsExpanded.style.display = isExpanded ? 'none' : 'block';
        statsExpandBtn.textContent = isExpanded ? '▼' : '▲';
      });
    }

    // Floating Action Button (FAB)
    const fabBtn = sidebarContainer.querySelector('#sidebar-fab-btn');
    const fabMenu = sidebarContainer.querySelector('#sidebar-fab-menu');
    if (fabBtn && fabMenu) {
      let fabOpen = false;
      
      fabBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound('navigation');
        fabOpen = !fabOpen;
        fabMenu.style.display = fabOpen ? 'flex' : 'none';
        fabBtn.style.transform = fabOpen ? 'rotate(45deg)' : 'rotate(0deg)';
      });
      
      // Close FAB menu when clicking outside
      document.addEventListener('click', (e) => {
        if (fabOpen && !fabBtn.contains(e.target) && !fabMenu.contains(e.target)) {
          fabOpen = false;
          fabMenu.style.display = 'none';
          fabBtn.style.transform = 'rotate(0deg)';
        }
      });
    }

    // FAB Menu Items
    const fabScanBtn = sidebarContainer.querySelector('#fab-scan-btn');
    const fabPopupBtn = sidebarContainer.querySelector('#fab-popup-btn');
    const fabSettingsBtn = sidebarContainer.querySelector('#fab-settings-btn');
    
    if (fabScanBtn) {
      fabScanBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        playClickSound('action');
        // Close FAB menu
        fabMenu.style.display = 'none';
        fabBtn.style.transform = 'rotate(0deg)';
        // Scan inbox
        await bulkScanAllEmails();
        await loadSidebarToday();
      });
    }
    
    if (fabPopupBtn) {
      fabPopupBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound('navigation');
        chrome.runtime.sendMessage({ action: 'openPopup' });
      });
    }
    
    if (fabSettingsBtn) {
      fabSettingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound('navigation');
        chrome.runtime.sendMessage({ action: 'openPopup' });
      });
    }

    // Load today's contacts
    loadSidebarToday();
  }

  // Load CRM tab data
  async function loadSidebarCRM() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getContacts' });
      const allContacts = (response && response.contacts) || [];

      // Update limit warning banner
      updateSidebarLimitBanner();

      // Apply filters - show ALL contacts by default (like popup)
      const searchTerm = (document.getElementById('sidebar-search-input')?.value || '').toLowerCase();
      const statusFilter = document.getElementById('sidebar-status-filter')?.value || '';
      const sortBy = document.getElementById('sidebar-sort')?.value || 'lastContact';
      
      let filtered = allContacts.filter(contact => {
        const matchesSearch = !searchTerm || 
          (getFullName(contact.firstName, contact.lastName) || contact.name || '').toLowerCase().includes(searchTerm) ||
          (contact.email || '').toLowerCase().includes(searchTerm) ||
          (contact.company || '').toLowerCase().includes(searchTerm) ||
          (contact.title || '').toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || (contact.status || 'approved') === statusFilter;
        return matchesSearch && matchesStatus;
      });
      
      // Sort
      filtered.sort((a, b) => {
        if (sortBy === 'name') {
          const nameA = (getFullName(a.firstName, a.lastName) || a.email || '').toLowerCase();
          const nameB = (getFullName(b.firstName, b.lastName) || b.email || '').toLowerCase();
          return nameA.localeCompare(nameB);
        } else if (sortBy === 'company') {
          const companyA = (a.company || '').toLowerCase();
          const companyB = (b.company || '').toLowerCase();
          return companyA.localeCompare(companyB);
        } else {
          // lastContact - default
          const dateA = a.lastContactAt || a.lastContact || a.createdAt || '';
          const dateB = b.lastContactAt || b.lastContact || b.createdAt || '';
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return new Date(dateB) - new Date(dateA);
        }
      });
      
      // Render - show all contacts (no limit, but with scroll)
      const listEl = document.getElementById('sidebar-all-contacts-list');
      if (listEl) {
        if (filtered.length === 0) {
          listEl.innerHTML = '<div class="empty-state" style="padding:20px;text-align:center;color:var(--text-secondary);">No contacts found</div>';
        } else {
          listEl.innerHTML = filtered.map(contact => `
            <div class="contact-item" data-email="${contact.email}" style="cursor:pointer;padding:12px;margin-bottom:8px;border-radius:8px;border:1px solid var(--border);background:var(--surface);transition:all 0.2s;">
              <div class="contact-info" style="flex:1;">
                <strong style="display:block;margin-bottom:4px;font-size:14px;">${getFullName(contact.firstName, contact.lastName) || contact.email}</strong>
                ${contact.email && getFullName(contact.firstName, contact.lastName) ? `<div class="contact-meta" style="font-size:12px;color:var(--text-secondary);margin-bottom:2px;">${contact.email}</div>` : ''}
                ${contact.company ? `<div class="contact-meta" style="font-size:12px;color:var(--text-secondary);margin-bottom:2px;">${contact.company}</div>` : ''}
                ${contact.title ? `<div class="contact-meta" style="font-size:12px;color:var(--text-secondary);">${contact.title}</div>` : ''}
              </div>
              <div class="contact-status ${(contact.status || 'approved').toLowerCase().replace(/\s+/g, '-')}" style="margin-top:8px;padding:4px 8px;border-radius:4px;font-size:11px;text-align:center;">${contact.status || 'Approved'}</div>
            </div>
          `).join('');
          
          // Show count
          const countInfo = document.getElementById('sidebar-crm-count');
          if (countInfo) {
            countInfo.textContent = `${filtered.length} of ${allContacts.length} contacts`;
          }
          
          // Make clickable
          listEl.querySelectorAll('.contact-item').forEach(item => {
            item.addEventListener('click', () => {
              const email = item.getAttribute('data-email');
              const contact = filtered.find(c => c.email === email);
              if (contact) {
                showContactDetails(contact);
              }
            });
            // Hover effect
            item.addEventListener('mouseenter', () => {
              item.style.background = 'var(--hover)';
              item.style.borderColor = 'var(--primary)';
            });
            item.addEventListener('mouseleave', () => {
              item.style.background = 'var(--surface)';
              item.style.borderColor = 'var(--border)';
            });
          });
        }
      }
    } catch (error) {
      console.error('Error loading sidebar CRM:', error);
    }
  }

  // Load Overview tab data
  async function loadSidebarOverview() {
    try {
      const [statsRes, pendingRes, allContactsRes] = await Promise.all([
        chrome.runtime.sendMessage({ type: 'GET_DASHBOARD_STATS' }),
        chrome.runtime.sendMessage({ type: 'GET_PENDING_CONTACTS' }),
        chrome.runtime.sendMessage({ action: 'getContacts' })
      ]);

      const stats = (statsRes && statsRes.stats) || {};
      const pendingContacts = (pendingRes && pendingRes.contacts) || [];
      const allContacts = (allContactsRes && allContactsRes.contacts) || [];

      // Update stats
      const statsEl = sidebarContainer.querySelector('.dashboard-stats');
      if (statsEl) {
        statsEl.innerHTML = `
          <div class="stat-item">
            <div class="stat-value">${stats.totalContacts || 0}</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.newToday || 0}</div>
            <div class="stat-label">New Today</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.pendingApprovals || pendingContacts.length}</div>
            <div class="stat-label">Pending</div>
          </div>
        `;
      }

      // Render pending
      const pendingEl = document.getElementById('sidebar-pending-list');
      if (pendingEl) {
        if (pendingContacts.length === 0) {
          pendingEl.innerHTML = '<div class="empty-state">No pending approvals</div>';
        } else {
          pendingEl.innerHTML = pendingContacts.map(contact => `
            <div class="contact-item" data-email="${contact.email}" style="cursor:pointer;">
              <div class="contact-info">
                <strong>${getFullName(contact.firstName, contact.lastName) || contact.email}</strong>
                ${contact.company ? `<div class="contact-meta">${contact.company}</div>` : ''}
              </div>
              <button class="btn-inline-approve" data-email="${contact.email}" style="padding:4px 8px;font-size:11px;">Approve</button>
            </div>
          `).join('');
          
          // Approve buttons
          pendingEl.querySelectorAll('.btn-inline-approve').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const email = btn.getAttribute('data-email');
              const contact = pendingContacts.find(c => c.email === email);
              
              if (contact) {
                btn.textContent = 'Approving...';
                btn.disabled = true;
                
                try {
                  await approveContact(contact, null);
                  await loadContacts();
                  updateWidget();
                  updateSidebar();
                  showNotification(`${getFullName(contact.firstName, contact.lastName) || contact.email} approved!`);
                  loadSidebarOverview();
                } catch (error) {
                  console.error('Error approving contact:', error);
                  showNotification('Failed to approve contact', 'error');
                  btn.textContent = 'Approve';
                  btn.disabled = false;
                }
              }
            });
          });
          
          // Click to view details
          pendingEl.querySelectorAll('.contact-item').forEach(item => {
            item.addEventListener('click', () => {
              const email = item.getAttribute('data-email');
              const contact = pendingContacts.find(c => c.email === email);
              if (contact) showContactDetails(contact);
            });
          });
        }
      }

      // Render recent contacts
      const recentEl = document.getElementById('sidebar-recent-contacts-list');
      if (recentEl) {
        const recent = allContacts
          .slice()
          .sort((a, b) => new Date(b.lastContactAt || 0) - new Date(a.lastContactAt || 0))
          .slice(0, 10);
        
        if (recent.length === 0) {
          recentEl.innerHTML = '<div class="empty-state">No contacts yet</div>';
        } else {
          recentEl.innerHTML = recent.map(contact => `
            <div class="contact-item" data-email="${contact.email}" style="cursor:pointer;">
              <div class="contact-info">
                <strong>${getFullName(contact.firstName, contact.lastName) || contact.email}</strong>
                ${contact.company ? `<div class="contact-meta">${contact.company}</div>` : ''}
              </div>
              <div class="contact-status ${(contact.status || 'approved').toLowerCase().replace(/\s+/g, '-')}">${contact.status || 'Approved'}</div>
            </div>
          `).join('');
          
          recentEl.querySelectorAll('.contact-item').forEach(item => {
            item.addEventListener('click', () => {
              const email = item.getAttribute('data-email');
              const contact = recent.find(c => c.email === email);
              if (contact) showContactDetails(contact);
            });
          });
        }
      }
    } catch (error) {
      console.error('Error loading sidebar overview:', error);
    }
  }

  // Load Today tab data
  async function loadSidebarToday() {
    try {
      // Get all contacts
      const response = await chrome.runtime.sendMessage({ action: 'getContacts' });
      const allContacts = (response && response.contacts) || [];
      
      // Get today's date (start of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();
      
      // Filter contacts created today
      const todayContacts = allContacts.filter(contact => {
        const createdDate = new Date(contact.createdAt || contact.created_at || 0);
        createdDate.setHours(0, 0, 0, 0);
        return createdDate.getTime() === todayTimestamp;
      });
      
      // Sort by most recent first
      todayContacts.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0);
        const dateB = new Date(b.createdAt || b.created_at || 0);
        return dateB - dateA;
      });
      
      // Calculate stats
      const newCount = todayContacts.filter(c => c.source === 'gmail').length;
      const syncedCount = todayContacts.filter(c => {
        const mappings = c.crmMappings || {};
        return mappings.hubspot || mappings.salesforce;
      }).length;
      const followupsCount = todayContacts.filter(c => c.followUpDate).length;
      
      // Update stats cards
      const newCountEl = document.getElementById('sidebar-new-count');
      const syncedCountEl = document.getElementById('sidebar-synced-count');
      const followupsCountEl = document.getElementById('sidebar-followups-count');
      
      if (newCountEl) newCountEl.textContent = newCount;
      if (syncedCountEl) syncedCountEl.textContent = syncedCount;
      if (followupsCountEl) followupsCountEl.textContent = followupsCount;
      
      // Update collapsed stats summary text
      const statsSummaryText = document.getElementById('sidebar-stats-text');
      if (statsSummaryText) {
        statsSummaryText.textContent = `${newCount} new, ${syncedCount} synced`;
      }
      
      // Update today's count badge
      const todayBadge = document.getElementById('sidebar-today-badge');
      if (todayBadge) todayBadge.textContent = todayContacts.length;
      
      // Update limit warning banner
      updateSidebarLimitBanner();
      
      // Render today's contacts
      const todayListEl = document.getElementById('sidebar-today-contacts-list');
      const emptyStateEl = document.getElementById('sidebar-empty-state');
      
      if (todayListEl && emptyStateEl) {
        if (todayContacts.length === 0) {
          todayListEl.style.display = 'none';
          emptyStateEl.style.display = 'flex';
        } else {
          todayListEl.style.display = 'block';
          emptyStateEl.style.display = 'none';
          
          todayListEl.innerHTML = todayContacts.map(contact => {
            // Determine sync status badge (ONLY show this - most important)
            // Filter by connected platforms
            const connectedPlatforms = window.integrationManager?.getConnectedPlatforms() || { hubspot: true, salesforce: true };
            const mappings = contact.crmMappings || {};
            let syncBadge = '';
            // Only show HubSpot badge if connected to HubSpot
            if (mappings.hubspot && connectedPlatforms.hubspot) {
              syncBadge = '<span class="sync-badge synced" title="Synced to HubSpot">✓H</span>';
            // Only show Salesforce badge if connected to Salesforce  
            } else if (mappings.salesforce && connectedPlatforms.salesforce) {
              syncBadge = '<span class="sync-badge synced" title="Synced to Salesforce">✓S</span>';
            }
            
            return `
              <div class="sidebar-contact-card-compact" data-email="${contact.email}">
                <div class="contact-row-compact">
                  <span class="contact-name-compact">${getFullName(contact.firstName, contact.lastName) || contact.email}</span>
                  ${syncBadge}
                </div>
                <div class="contact-email-compact">${contact.email}</div>
              </div>
            `;
          }).join('');
          
          // Add click handlers
          todayListEl.querySelectorAll('.sidebar-contact-card-compact').forEach(card => {
            card.addEventListener('click', () => {
              const email = card.getAttribute('data-email');
              const contact = todayContacts.find(c => c.email === email);
              if (contact) showContactDetails(contact);
            });
          });
        }
      }
    } catch (error) {
      console.error('CRMSYNC: Error loading sidebar today:', error);
    }
  }

  function toggleSidebar(forceOpen = null) {
    if (!sidebarContainer) {
      createSidebar();
    }
    if (forceOpen === true) {
      sidebarVisible = true;
    } else if (forceOpen === false) {
      sidebarVisible = false;
    } else {
    sidebarVisible = !sidebarVisible;
    }
    document.body.classList.toggle('crmsync-sidebar-open', sidebarVisible);
    applySidebarWidthCSS();
    if (sidebarVisible) {
      // Reset "new since last open" baseline
      lastSeenCountAtSidebarOpen = contacts.length;
      chrome.storage.local.set({ lastSeenCountAtSidebarOpen });
      sidebarContainer.classList.add('visible');
      const toggleBtn = sidebarContainer.querySelector('.toggle-sidebar');
      if (toggleBtn) {
        toggleBtn.textContent = 'Hide';
        toggleBtn.title = 'Hide Sidebar';
      }
      // Trigger a scan when sidebar opens if we're in a thread view
      setTimeout(() => {
        const currentUrl = window.location.href;
        const threadId = currentUrl.match(/#(?:inbox|all|sent|starred|important|drafts)\/([A-Za-z0-9_-]+)/i);
        if (threadId && globalScanThread) {
          // We're in a thread, trigger scan directly
          globalScanThread();
        }
      }, 500);
    } else {
      sidebarContainer.classList.remove('visible');
      const toggleBtn = sidebarContainer.querySelector('.toggle-sidebar');
      if (toggleBtn) {
        toggleBtn.textContent = 'Show';
        toggleBtn.title = 'Show Sidebar';
      }
    }
    updateFloatingWidgetPosition();
  }

  function showBulkApprovalPanel() {
    if (pendingContacts.length === 0) {
      showNotification('No pending contacts to approve. Use "Scan All Emails" to find contacts.');
      return;
    }

    // Remove existing bulk panel if any
    const existingPanel = document.querySelector('.bulk-approval-panel');
    if (existingPanel) {
      existingPanel.remove();
    }

    const panel = document.createElement('div');
    panel.className = 'bulk-approval-panel';
    panel.innerHTML = `
      <div class="bulk-approval-header">
        <h3>Bulk Approve (${pendingContacts.length})</h3>
        <button class="close-btn">×</button>
      </div>
      <div class="bulk-approval-content">
        <div class="bulk-contacts-list">
          ${pendingContacts.map((contact, index) => `
            <div class="bulk-contact-item">
              <input type="checkbox" class="bulk-checkbox" data-index="${index}" checked>
              <div class="bulk-contact-info">
                <strong>${contact.email}</strong>
                ${getFullName(contact.firstName, contact.lastName) ? `<div>${getFullName(contact.firstName, contact.lastName)}</div>` : ''}
                ${contact.jobTitle ? `<div class="contact-meta">${contact.jobTitle}</div>` : ''}
                ${contact.company ? `<div class="contact-meta">${contact.company}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="bulk-approval-actions">
          <button class="btn-select-all">Select All</button>
          <button class="btn-approve-selected">✓ Approve Selected</button>
          <button class="btn-reject-all">✗ Reject All</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    panel.querySelector('.close-btn').addEventListener('click', () => {
      playClickSound('close');
      panel.remove();
    });

    panel.querySelector('.btn-select-all').addEventListener('click', () => {
      playClickSound('navigation');
      const checkboxes = panel.querySelectorAll('.bulk-checkbox');
      const allChecked = Array.from(checkboxes).every(cb => cb.checked);
      checkboxes.forEach(cb => cb.checked = !allChecked);
    });

    panel.querySelector('.btn-approve-selected').addEventListener('click', async () => {
      playClickSound('approve');
      const checkboxes = panel.querySelectorAll('.bulk-checkbox:checked');
      const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
      
      if (selectedIndices.length === 0) {
        showNotification('Please select at least one contact to approve.');
        return;
      }

      // Disable button and show loading state
      const approveBtn = panel.querySelector('.btn-approve-selected');
      const originalText = approveBtn.textContent;
      approveBtn.disabled = true;
      approveBtn.textContent = 'Processing...';
      approveBtn.style.opacity = '0.6';
      approveBtn.style.cursor = 'not-allowed';

      let approvedCount = 0;
      let errorCount = 0;

      try {
        for (const index of selectedIndices) {
          try {
            const contact = pendingContacts[index];
            if (!contact) continue;
            
            const existing = contacts.find(c => c.email === contact.email);
            await approveContact(contact, existing);
            approvedCount++;
          } catch (error) {
            console.error('Error approving contact:', error);
            errorCount++;
          }
        }

        // Remove approved contacts from pending
        pendingContacts = pendingContacts.filter((_, index) => !selectedIndices.includes(index));
        
        // Close panel
        panel.remove();
        
        // Update sidebar
        updateSidebar();
        
        // Show success notification
        if (approvedCount > 0) {
          showNotification(`✓ Successfully approved ${approvedCount} contact${approvedCount > 1 ? 's' : ''}!`);
        }
        
        if (errorCount > 0) {
          showNotification(`⚠ ${errorCount} contact${errorCount > 1 ? 's' : ''} failed to approve.`);
        }
      } catch (error) {
        console.error('Bulk approval error:', error);
        showNotification('Error approving contacts. Please try again.');
        // Re-enable button
        approveBtn.disabled = false;
        approveBtn.textContent = originalText;
        approveBtn.style.opacity = '1';
        approveBtn.style.cursor = 'pointer';
      }
    });

    panel.querySelector('.btn-reject-all').addEventListener('click', () => {
      playClickSound('reject');
    pendingContacts.forEach(c => markRejected(c.email));
      pendingContacts = [];
      panel.remove();
      updateSidebar();
      showNotification('All pending contacts rejected.');
    });
  }

  async function createFloatingWidget() {
    // Remove existing widget if any
    const existing = document.getElementById('contact-extractor-widget');
    if (existing) {
      existing.remove();
      widgetContainer = null;
    }

    if (widgetContainer && widgetContainer.parentNode) {
      return;
    }

    widgetContainer = document.createElement('div');
    widgetContainer.id = 'contact-extractor-widget';
    widgetContainer.innerHTML = `
      <div class="widget-content">
        <img src="${chrome.runtime.getURL('icons/widget-logo.png.png')}" alt="" title="" class="widget-logo widget-logo-static" onerror="this.src='${chrome.runtime.getURL('icons/icon128.png')}'" />
        <img src="${chrome.runtime.getURL('icons/widget-logo-animated.gif')}" alt="" title="" class="widget-logo widget-logo-animated" style="display: none;" onerror="this.style.display='none'" />
        <div class="widget-badges"></div>
        <div class="widget-tooltip" aria-live="polite"></div>
        <div class="widget-peek" aria-live="polite"></div>
      </div>
    `;

    // Load saved position or use default
    const savedPosition = await chrome.storage.local.get(['widgetPosition']);
    const position = savedPosition.widgetPosition || { bottom: 24, right: 24 };

    // Ensure widget is always visible with inline styles
    widgetContainer.style.position = 'fixed';
    widgetContainer.style.bottom = position.bottom + 'px';
    widgetContainer.style.right = position.right + 'px';
    widgetContainer.style.width = '64px';
    widgetContainer.style.height = '64px';
    widgetContainer.style.zIndex = '99999';
    widgetContainer.style.display = 'flex';
    widgetContainer.style.alignItems = 'center';
    widgetContainer.style.justifyContent = 'center';
    widgetContainer.style.cursor = 'grab';
    widgetContainer.style.background = 'transparent';
    widgetContainer.style.transition = 'transform 0.2s ease';
    widgetContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    widgetContainer.style.userSelect = 'none';

    // Drag functionality - Enhanced for free movement
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialBottom = 0;
    let initialRight = 0;
    let hasDragged = false;

    widgetContainer.addEventListener('mousedown', (e) => {
      // Only allow dragging on the widget itself, not on badges or tooltips
      if (e.target.closest('.widget-badges') || e.target.closest('.widget-tooltip') || e.target.closest('.widget-peek')) {
        return;
      }

      isDragging = true;
      hasDragged = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      
      // Get current position
      const rect = widgetContainer.getBoundingClientRect();
      initialBottom = window.innerHeight - rect.bottom;
      initialRight = window.innerWidth - rect.right;
      
      widgetContainer.style.cursor = 'grabbing';
      widgetContainer.style.opacity = '0.9';
      widgetContainer.style.transition = 'none';
      widgetContainer.style.transform = 'scale(1.05)';
      
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      hasDragged = true;
      const deltaX = dragStartX - e.clientX;
      const deltaY = e.clientY - dragStartY;
      
      let newRight = initialRight + deltaX;
      let newBottom = initialBottom - deltaY;
      
      // Keep widget within viewport bounds (with padding)
      const padding = 10;
      const maxRight = window.innerWidth - 64 - padding;
      const maxBottom = window.innerHeight - 64 - padding;
      
      newRight = Math.max(padding, Math.min(newRight, maxRight));
      newBottom = Math.max(padding, Math.min(newBottom, maxBottom));
      
      widgetContainer.style.right = newRight + 'px';
      widgetContainer.style.bottom = newBottom + 'px';
    });

    document.addEventListener('mouseup', async () => {
      if (!isDragging) return;
      
      isDragging = false;
      widgetContainer.style.cursor = 'grab';
      widgetContainer.style.opacity = '1';
      widgetContainer.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
      widgetContainer.style.transform = 'scale(1)';
      
      // Save position if widget was actually dragged
      if (hasDragged) {
        const newPosition = {
          bottom: parseInt(widgetContainer.style.bottom),
          right: parseInt(widgetContainer.style.right)
        };
        await chrome.storage.local.set({ widgetPosition: newPosition });
        logger.log('📍 Widget position saved:', newPosition);
      }
    });

    widgetContainer.addEventListener('click', (e) => {
      // Don't toggle sidebar if user just finished dragging
      if (hasDragged) {
        hasDragged = false;
        return;
      }
      
      if (e.target.closest('button[data-peek-action="open"]')) {
        return; // handled separately
      }
      e.stopPropagation();
      e.preventDefault();
      playClickSound('navigation');
      toggleSidebar();
    });

    widgetContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-peek-action="open"]');
      if (btn) {
        toggleSidebar(true);
      }
    });

    widgetContainer.addEventListener('mouseenter', () => {
      if (!isDragging) {
        widgetContainer.style.transform = 'scale(1.15)';
      }
    });

    widgetContainer.addEventListener('mouseleave', () => {
      if (!isDragging) {
        widgetContainer.style.transform = 'scale(1)';
      }
    });

    // Ensure body exists before appending
    if (document.body) {
      document.body.appendChild(widgetContainer);
      updateFloatingWidgetPosition();
      updateWidget();
    } else {
      // Retry if body not ready
      setTimeout(() => {
        if (document.body && !document.getElementById('contact-extractor-widget')) {
          document.body.appendChild(widgetContainer);
          updateFloatingWidgetPosition();
          updateWidget();
        }
      }, 1000);
    }
  }

  function updateWidget() {
    if (widgetContainer) {
      const count = contacts.length;

      const pendingCount = pendingContacts.length;
      const newCount = contacts.filter(c => (c.status || '').toLowerCase() === 'new').length;
      const awaitingCount = contacts.filter(c => (c.status || '').toLowerCase().includes('await')).length;
      const sinceLastOpen = Math.max(0, contacts.length - lastSeenCountAtSidebarOpen);
      const sessionCount = sessionFoundCount;

      const badgesEl = widgetContainer.querySelector('.widget-badges');
      if (badgesEl) {
        const badges = [];
        if (pendingCount > 0) badges.push(`<span class="widget-badge pending" title="Pending approvals">${pendingCount}</span>`);
        if (newCount > 0) badges.push(`<span class="widget-badge new" title="New contacts">${newCount}</span>`);
        if (awaitingCount > 0) badges.push(`<span class="widget-badge awaiting" title="Awaiting replies">${awaitingCount}</span>`);
        // Add session and since-last-open badges (small, optional)
        if (sessionCount > 0) badges.push(`<span class="widget-badge new" title="Found this session">${sessionCount}</span>`);
        if (sinceLastOpen > 0) badges.push(`<span class="widget-badge pending" title="New since sidebar open">${sinceLastOpen}</span>`);
        badgesEl.innerHTML = badges.join('');
      }

      updateWidgetTooltipContent();
      updateWidgetPeekContent();
    }
  }

  function getLatestContact() {
    if (!contacts || contacts.length === 0) return null;
    return contacts
      .slice()
      .sort((a, b) => new Date(b.lastContactAt || b.lastContact || 0) - new Date(a.lastContactAt || a.lastContact || 0))[0];
  }

  function getCurrentThreadId() {
    try {
      const url = window.location.href;
      const match = url.match(/#(?:inbox|all|sent|starred|important|drafts)\/([A-Za-z0-9]+)/);
      if (match && match[1]) return match[1];
      const threadEl = document.querySelector('[data-thread-perm-id]');
      if (threadEl && threadEl.getAttribute('data-thread-perm-id')) {
        return threadEl.getAttribute('data-thread-perm-id');
      }
    } catch (err) {
      console.error('CRMSYNC: Error getting thread id', err);
    }
    return null;
  }

  function updateWidgetTooltipContent() {
    const tooltip = widgetContainer ? widgetContainer.querySelector('.widget-tooltip') : null;
    if (!tooltip) return;
    const latest = getLatestContact();
    if (!latest) {
      tooltip.innerHTML = '<div class="contact-meta">No contacts yet.</div>';
      return;
    }
    tooltip.innerHTML = `
      <div class="contact-name">${getFullName(latest.firstName, latest.lastName) || latest.email || 'Unknown'}</div>
      ${latest.email ? `<div class="contact-meta">${latest.email}</div>` : ''}
      ${latest.company ? `<div class="contact-meta">${latest.company}</div>` : ''}
      ${latest.status ? `<div class="contact-meta">Status: ${latest.status}</div>` : ''}
    `;
  }

  function updateWidgetPeekContent() {
    const peek = widgetContainer ? widgetContainer.querySelector('.widget-peek') : null;
    if (!peek) return;
    if (!pendingContacts || pendingContacts.length === 0) {
      peek.innerHTML = '<div class="contact-meta">No pending approvals.</div>';
      return;
    }
    const next = pendingContacts[0];
    peek.innerHTML = `
      <div class="peek-title">Next pending</div>
      <div class="peek-contact">
        <div class="contact-meta">Email</div>
        <div>${next.email || ''}</div>
        <div class="contact-meta">Name</div>
        <div>${getFullName(next.firstName, next.lastName) || 'Unknown'}</div>
        ${next.company ? `<div class="contact-meta">Company</div><div>${next.company}</div>` : ''}
      </div>
      <div class="peek-actions">
        <button type="button" data-peek-action="open">Open sidebar</button>
      </div>
    `;
  }

  function showWidgetTooltip() {
    const tooltip = widgetContainer ? widgetContainer.querySelector('.widget-tooltip') : null;
    if (tooltip) tooltip.classList.add('visible');
  }

  function hideWidgetTooltip() {
    const tooltip = widgetContainer ? widgetContainer.querySelector('.widget-tooltip') : null;
    if (tooltip) tooltip.classList.remove('visible');
  }

  function showWidgetPeek() {
    const peek = widgetContainer ? widgetContainer.querySelector('.widget-peek') : null;
    if (peek) peek.classList.add('visible');
  }

  function hideWidgetPeek() {
    const peek = widgetContainer ? widgetContainer.querySelector('.widget-peek') : null;
    if (peek) peek.classList.remove('visible');
  }

  function updateSidebar() {
    if (!sidebarContainer) return;
    
    // Simple refresh - just reload today's contacts
    loadSidebarToday();
  }

  /**
   * Update the sidebar limit warning banner
   */
  async function updateSidebarLimitBanner() {
    try {
      const banner = document.getElementById('sidebar-limit-banner');
      const limitText = document.getElementById('sidebar-limit-text');
      const upgradeBtn = document.getElementById('sidebar-upgrade-btn');
      
      if (!banner || !limitText) return;

      // Get contact limit info
      const limitInfo = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getContactLimit' }, (response) => {
          resolve(response || { success: false });
        });
      });

      if (!limitInfo.success) {
        banner.style.display = 'none';
        return;
      }

      const { count, limit, tier, isOverLimit, isNearLimit } = limitInfo;
      const percentage = limit > 0 ? (count / limit) * 100 : 0;

      // Show warning at 80% or above
      if (percentage >= 80 || isNearLimit || isOverLimit) {
        banner.style.display = 'block';
        limitText.textContent = `${count}/${limit} contacts used`;

        // Change styling based on severity
        if (isOverLimit || percentage >= 100) {
          banner.classList.add('limit-critical');
          banner.classList.remove('limit-warning');
          limitText.parentElement.querySelector('.limit-banner-title').textContent = '🚨 Limit Reached';
        } else if (percentage >= 95 || isNearLimit) {
          banner.classList.add('limit-warning');
          banner.classList.remove('limit-critical');
          limitText.parentElement.querySelector('.limit-banner-title').textContent = '⚠️ Almost Full';
        } else {
          banner.classList.remove('limit-critical', 'limit-warning');
          limitText.parentElement.querySelector('.limit-banner-title').textContent = '💡 Getting Full';
        }

        // Setup upgrade button
        if (upgradeBtn && !upgradeBtn.hasAttribute('data-listener')) {
          upgradeBtn.setAttribute('data-listener', 'true');
          upgradeBtn.addEventListener('click', () => {
            const websiteUrl = 'https://www.crm-sync.net';
            const pricingPath = '/#/pricing';
            const extensionId = chrome.runtime.id;
            const upgradeUrl = `${websiteUrl}?source=extension&extensionId=${extensionId}${pricingPath}`;
            chrome.tabs.create({ url: upgradeUrl });
          });
        }
      } else {
        banner.style.display = 'none';
      }
    } catch (error) {
      console.error('Error updating sidebar limit banner:', error);
    }
  }

  /**
   * Show upgrade required panel when user is at contact limit
   * @param {any} contact - The contact that triggered the limit
   * @param {Object} limitInfo - Limit information from background
   */
  function showUpgradeRequiredPanel(contact, limitInfo) {
    try {
      // Remove existing panels
      const existing = document.querySelector('.crmsync-approval-panel, .crmsync-upgrade-panel');
      if (existing) {
        existing.remove();
      }

      const panel = document.createElement('div');
      panel.className = 'crmsync-upgrade-panel';
      panel.setAttribute('data-contact-email', contact.email);
      
      const fullName = getFullName(contact.firstName, contact.lastName) || contact.email;
      
      panel.innerHTML = `
        <div class="upgrade-overlay">
          <div class="upgrade-icon">🔒</div>
          <div class="upgrade-title">Contact Limit Reached</div>
          <div class="upgrade-subtitle">${limitInfo.count}/${limitInfo.limit} contacts</div>
          
          <div class="upgrade-contact-preview">
            <div class="upgrade-contact-icon">👤</div>
            <div class="upgrade-contact-info">
              <strong>${fullName}</strong>
              <div style="font-size: 12px; opacity: 0.8;">${contact.email}</div>
              ${contact.company ? `<div style="font-size: 11px; opacity: 0.7;">${contact.company}</div>` : ''}
            </div>
          </div>
          
          <div class="upgrade-message">
            You've reached your ${limitInfo.tier || 'Free'} tier limit. Upgrade to <strong>Pro</strong> for <strong>1,000 contacts</strong>, or free up space by deleting old contacts.
          </div>
          
          <div class="upgrade-actions">
            <button class="btn-upgrade-now">✨ Upgrade to Pro</button>
            <button class="btn-upgrade-dismiss">Not Now</button>
          </div>
          
          <div class="upgrade-note">
            💡 Tip: Export your contacts before deleting to keep a backup
          </div>
        </div>
      `;

      // Styling
      panel.style.position = 'fixed';
      panel.style.bottom = '100px';
      panel.style.right = '24px';
      panel.style.zIndex = '10005';
      panel.style.width = '380px';
      panel.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      panel.style.border = 'none';
      panel.style.borderRadius = '16px';
      panel.style.padding = '0';
      panel.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.4)';
      panel.style.animation = 'slideIn 0.3s ease-out';

      document.body.appendChild(panel);

      // Upgrade button
      const upgradeBtn = panel.querySelector('.btn-upgrade-now');
      upgradeBtn.addEventListener('click', () => {
        playClickSound('success');
        // Open pricing page
        const websiteUrl = 'https://www.crm-sync.net';
        const pricingUrl = `${websiteUrl}?source=extension#/pricing`;
        window.open(pricingUrl, '_blank');
        panel.remove();
      });

      // Dismiss button
      const dismissBtn = panel.querySelector('.btn-upgrade-dismiss');
      dismissBtn.addEventListener('click', () => {
        playClickSound('reject');
        panel.remove();
      });

      // Auto-dismiss after 30 seconds
      setTimeout(() => {
        if (panel.parentNode) {
          panel.remove();
        }
      }, 30000);

    } catch (error) {
      console.error('CRMSYNC: Error showing upgrade panel', error);
    }
  }

  /**
   * Show approval panel for a new contact with 1-minute auto-pending timer
   * @param {any} contact
   * @param {HTMLElement} messageContainer - The message element to re-scan from
   */
  async function showApprovalPanel(contact, messageContainer) {
    try {
      // Check exclusions BEFORE showing the panel
      console.log(`🔍 DEBUG showApprovalPanel: Checking exclusions for ${contact.email}`);
      console.log(`🔍 DEBUG: Name to check: First="${contact.firstName}", Last="${contact.lastName}"`);
      console.log(`🔍 DEBUG: Settings loaded:`, { excludeNames: settings.excludeNames, excludeDomains: settings.excludeDomains });
      
      const nameExcluded = isExcludedName(contact.firstName, contact.lastName);
      console.log(`🔍 DEBUG: isExcludedName result: ${nameExcluded}`);
      
      if (nameExcluded) {
        const fullName = getFullName(contact.firstName, contact.lastName);
        console.log(`✋ CRMSYNC: Contact BLOCKED by name exclusion: ${fullName}`);
        return; // Don't show approval panel for excluded names
      }
      
      const domainExcluded = isExcludedDomain(contact.email);
      console.log(`🔍 DEBUG: isExcludedDomain result: ${domainExcluded}`);
      
      if (domainExcluded) {
        console.log(`✋ CRMSYNC: Contact BLOCKED by domain exclusion: ${contact.email}`);
        return; // Don't show approval panel for excluded domains
      }
      
      console.log(`✅ CRMSYNC: Contact passed exclusion checks, showing approval panel`);
      
      // Check contact limit BEFORE showing approval panel
      const limitInfo = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getContactLimit' }, (response) => {
          resolve(response || { success: false });
        });
      });

      // Only block if OVER limit (100%+), not just near it
      if (limitInfo.success && limitInfo.isOverLimit) {
        showUpgradeRequiredPanel(contact, limitInfo);
        return;
      }
      
      
      // Remove existing approval panel if any
      const existing = document.querySelector('.crmsync-approval-panel');
      if (existing) {
        existing.remove();
      }

      const panel = document.createElement('div');
      panel.className = 'crmsync-approval-panel';
      panel.setAttribute('data-contact-email', contact.email);
      
      const safeId = contact.email.replace(/[^a-z0-9]/gi, '');
      
      panel.innerHTML = `
        <div class="approval-header">
          <div class="approval-title">📧 New Contact Found</div>
          <div class="approval-timer" id="approval-timer-${safeId}">1:00</div>
        </div>
        <div class="approval-content">
          <div class="approval-field-row">
            <label>First Name</label>
            <div class="field-with-retry">
              <input type="text" id="field-firstName-${safeId}" value="${contact.firstName || ''}" placeholder="Enter first name" />
              <button class="btn-retry" data-field="firstName" title="Retry extraction">↻</button>
            </div>
          </div>
          <div class="approval-field-row">
            <label>Last Name</label>
            <div class="field-with-retry">
              <input type="text" id="field-lastName-${safeId}" value="${contact.lastName || ''}" placeholder="Enter last name" />
              <button class="btn-retry" data-field="lastName" title="Retry extraction">↻</button>
            </div>
          </div>
          <div class="approval-field-row">
            <label>Email</label>
            <div class="field-with-retry">
              <input type="text" id="field-email-${safeId}" value="${contact.email}" readonly style="opacity:0.7;" />
            </div>
          </div>
          <div class="approval-field-row">
            <label>Company</label>
            <div class="field-with-retry">
              <input type="text" id="field-company-${safeId}" value="${contact.company || ''}" placeholder="Enter company" />
              <button class="btn-retry" data-field="company" title="Retry extraction">↻</button>
            </div>
          </div>
          <div class="approval-field-row">
            <label>Job Title</label>
            <div class="field-with-retry">
              <input type="text" id="field-jobTitle-${safeId}" value="${contact.jobTitle || ''}" placeholder="Enter job title" />
              <button class="btn-retry" data-field="jobTitle" title="Retry extraction">↻</button>
            </div>
          </div>
          <div class="approval-field-row">
            <label>Phone</label>
            <div class="field-with-retry">
              <input type="text" id="field-phone-${safeId}" value="${contact.phone || ''}" placeholder="Enter phone" />
              <button class="btn-retry" data-field="phone" title="Retry extraction">↻</button>
            </div>
          </div>
          <div class="approval-field-row">
            <label>LinkedIn</label>
            <div class="field-with-retry">
              <input type="text" id="field-linkedin-${safeId}" value="${contact.linkedin || ''}" placeholder="LinkedIn URL" />
              <button class="btn-retry" data-field="linkedin" title="Retry extraction">↻</button>
            </div>
          </div>
        </div>
        <div class="approval-actions">
          <button class="btn-approve">✓ Approve</button>
          <button class="btn-reject">✕ Reject</button>
        </div>
        <div class="approval-note">Auto-saves as pending in 1 minute</div>
      `;

      // Position panel
      panel.style.position = 'fixed';
      panel.style.bottom = '100px';
      panel.style.right = '24px';
      panel.style.zIndex = '10005';
      panel.style.background = 'var(--card-bg, #1e293b)';
      panel.style.border = '1px solid var(--border, #334155)';
      panel.style.borderRadius = '12px';
      panel.style.padding = '20px';
      panel.style.minWidth = '360px';
      panel.style.maxWidth = '400px';
      panel.style.maxHeight = '80vh';
      panel.style.overflowY = 'auto';
      panel.style.boxShadow = '0 10px 40px rgba(0,0,0,0.3)';
      panel.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

      document.body.appendChild(panel);

      // Retry button functionality
      const retryButtons = panel.querySelectorAll('.btn-retry');
      retryButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
          const field = btn.getAttribute('data-field');
          btn.textContent = '...';
          btn.disabled = true;
          
          try {
            // Re-extract from the message container
            if (messageContainer) {
              const bodyText = messageContainer.textContent || '';
              const signature = extractSignatureBlock(bodyText);
              const searchText = signature || bodyText;
              
              let newValue = '';
              switch(field) {
                case 'firstName':
                case 'lastName':
                  // Extract full name and split it
                  const extractedName = extractNameFromText(searchText, contact.email);
                  if (extractedName) {
                    const { firstName, lastName } = splitName(extractedName);
                    if (field === 'firstName') {
                      newValue = firstName;
                    } else {
                      newValue = lastName;
                    }
                  }
                  break;
                case 'company':
                  const emailDomain = contact.email.split('@')[1]?.split('.')[0];
                  const skipDomains = ['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'mail'];
                  const domainHint = skipDomains.includes(emailDomain) ? null : emailDomain;
                  newValue = domainHint ? extractCompanyByDomainHint(searchText, domainHint) : extractCompany(searchText);
                  break;
                case 'jobTitle':
                  newValue = extractJobTitle(searchText);
                  break;
                case 'phone':
                  newValue = extractPhone(searchText, contact.email, userEmails);
                  break;
                case 'linkedin':
                  newValue = extractLinkedIn(searchText);
                  break;
              }
              
              const inputField = document.getElementById(`field-${field}-${safeId}`);
              const oldValue = inputField?.value || '';
              
              if (newValue && newValue !== oldValue) {
                // Value found and it's different from current value
                inputField.value = newValue;
                contact[field] = newValue;
                showNotification(`Updated ${field}!`);
              } else if (!newValue) {
                // No value found
                showNotification(`No ${field} found`, 'error');
              } else {
                // Value found but same as current
                showNotification(`${field} unchanged (same value)`);
              }
            }
          } catch (error) {
            console.error(`Error retrying ${field}:`, error);
            showNotification(`Failed to retry ${field}`, 'error');
          } finally {
            btn.textContent = '↻';
            btn.disabled = false;
          }
        });
      });

      // Start 1-minute countdown timer
      let timeLeft = 60; // seconds
      const timerElement = document.getElementById(`approval-timer-${safeId}`);
      
      const countdownInterval = setInterval(() => {
        timeLeft--;
        if (timerElement) {
          const mins = Math.floor(timeLeft / 60);
          const secs = timeLeft % 60;
          timerElement.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);

      // Start 1-minute auto-pending timer
      const autoPendingTimer = setTimeout(async () => {
        console.log(`⏰ CRMSYNC: 1 minute elapsed for ${contact.email} - auto-saving as pending`);
        
        // Check if contact was already approved/rejected
        const alreadyExists = contacts.find(c => c.email.toLowerCase() === contact.email.toLowerCase());
        const alreadyRejected = rejectedEmails.has(contact.email.toLowerCase());
        
        if (!alreadyExists && !alreadyRejected) {
          // Get updated values from input fields
          contact.firstName = document.getElementById(`field-firstName-${safeId}`)?.value || contact.firstName;
          contact.lastName = document.getElementById(`field-lastName-${safeId}`)?.value || contact.lastName;
          contact.company = document.getElementById(`field-company-${safeId}`)?.value || contact.company;
          contact.jobTitle = document.getElementById(`field-jobTitle-${safeId}`)?.value || contact.jobTitle;
          contact.phone = document.getElementById(`field-phone-${safeId}`)?.value || contact.phone;
          contact.linkedin = document.getElementById(`field-linkedin-${safeId}`)?.value || contact.linkedin;
          
          // Save as pending status
          contact.status = 'pending';
          contact.lastContact = new Date().toISOString();
          contact.lastContactAt = new Date().toISOString();
          contact.createdAt = new Date().toISOString();
          
          await chrome.runtime.sendMessage({ action: 'saveContact', contact });
          await loadContacts();
          updateWidget();
          updateSidebar();
          
          console.log(`✅ CRMSYNC: Contact ${contact.email} auto-saved as pending`);
          showNotification(`${getFullName(contact.firstName, contact.lastName) || contact.email} moved to pending`);
        }
        
        // Cleanup
        clearInterval(countdownInterval);
        panel.remove();
        autoPendingTimers.delete(contact.email);
        contactsInApproval.delete(contact.email);
      }, 60000); // 1 minute

      // Store timer
      autoPendingTimers.set(contact.email, autoPendingTimer);

      // Approve button
      const approveBtn = panel.querySelector('.btn-approve');
      approveBtn.addEventListener('click', async () => {
        // Get updated values from input fields
        contact.firstName = document.getElementById(`field-firstName-${safeId}`)?.value || contact.firstName;
        contact.lastName = document.getElementById(`field-lastName-${safeId}`)?.value || contact.lastName;
        contact.company = document.getElementById(`field-company-${safeId}`)?.value || contact.company;
        contact.jobTitle = document.getElementById(`field-jobTitle-${safeId}`)?.value || contact.jobTitle;
        contact.phone = document.getElementById(`field-phone-${safeId}`)?.value || contact.phone;
        contact.linkedin = document.getElementById(`field-linkedin-${safeId}`)?.value || contact.linkedin;
        
        clearTimeout(autoPendingTimer);
        clearInterval(countdownInterval);
        autoPendingTimers.delete(contact.email);
        contactsInApproval.delete(contact.email);
        
        await approveContact(contact, null);
        panel.remove();
        showNotification(`${getFullName(contact.firstName, contact.lastName) || contact.email} approved!`);
      });

      // Reject button
      const rejectBtn = panel.querySelector('.btn-reject');
      rejectBtn.addEventListener('click', () => {
        clearTimeout(autoPendingTimer);
        clearInterval(countdownInterval);
        autoPendingTimers.delete(contact.email);
        contactsInApproval.delete(contact.email);
        
        rejectedEmails.add(contact.email.toLowerCase());
        chrome.storage.local.set({ rejectedEmails: Array.from(rejectedEmails) });
        panel.remove();
        showNotification(`${getFullName(contact.firstName, contact.lastName) || contact.email} rejected`);
      });

    } catch (error) {
      console.error('Error showing approval panel:', error);
    }
  }

  /**
   * Show an editable details panel for a contact from the sidebar.
   * @param {any} contact
   */
  function showContactDetails(contact) {
    try {
      // Remove existing detail panel if any
      const existing = document.querySelector('.crmsync-contact-details-panel');
      if (existing) {
        existing.remove();
      }

      const panel = document.createElement('div');
      panel.className = 'crmsync-contact-details-panel';
      panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
          <div style="flex:1;">
            <div style="font-weight:600;font-size:18px;color:var(--text,#e2e8f0);margin-bottom:4px;line-height:1.3;">${getFullName(contact.firstName, contact.lastName) || contact.email}</div>
            <div style="font-size:13px;color:var(--text-secondary,#9ca3af);opacity:0.7;">${contact.email}</div>
          </div>
          <button class="details-close" style="border:none;background:transparent;color:var(--text,#e2e8f0);font-size:20px;cursor:pointer;opacity:0.5;transition:all 0.2s;line-height:1;padding:4px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px;flex-shrink:0;" onmouseover="this.style.opacity='0.8';this.style.background='var(--surface,#1a1f2e)'" onmouseout="this.style.opacity='0.5';this.style.background='transparent'">×</button>
        </div>
        <form class="crmsync-details-form" style="display:flex;flex-direction:column;gap:20px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div>
              <label style="display:block;margin-bottom:6px;">
                <span style="font-size:13px;font-weight:500;color:var(--text,#e2e8f0);display:block;">First Name</span>
              </label>
              <input type="text" name="firstName" value="${contact.firstName || ''}" style="width:100%;padding:8px 12px;border:1px solid var(--border,#2d3748);border-radius:8px;font-size:14px;font-weight:500;background:var(--surface,#1a1f2e);color:var(--text,#e2e8f0);font-family:inherit;transition:all 0.2s;" placeholder="First name" />
            </div>
            <div>
              <label style="display:block;margin-bottom:6px;">
                <span style="font-size:13px;font-weight:500;color:var(--text,#e2e8f0);display:block;">Last Name</span>
              </label>
              <input type="text" name="lastName" value="${contact.lastName || ''}" style="width:100%;padding:8px 12px;border:1px solid var(--border,#2d3748);border-radius:8px;font-size:14px;font-weight:500;background:var(--surface,#1a1f2e);color:var(--text,#e2e8f0);font-family:inherit;transition:all 0.2s;" placeholder="Last name" />
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr;gap:16px;">
            <div>
              <label style="display:block;margin-bottom:6px;">
                <span style="font-size:13px;font-weight:500;color:var(--text,#e2e8f0);display:block;">Email</span>
              </label>
              <input type="text" name="email" value="${contact.email || ''}" style="width:100%;padding:8px 12px;border:1px solid var(--border,#2d3748);border-radius:8px;font-size:14px;font-weight:500;background:var(--surface,#1a1f2e);color:var(--text,#e2e8f0);font-family:inherit;opacity:0.7;cursor:not-allowed;" readonly />
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div>
              <label style="display:block;margin-bottom:6px;">
                <span style="font-size:13px;font-weight:500;color:var(--text,#e2e8f0);display:block;">Job Title</span>
              </label>
              <input type="text" name="title" value="${contact.title || ''}" style="width:100%;padding:8px 12px;border:1px solid var(--border,#2d3748);border-radius:8px;font-size:14px;font-weight:500;background:var(--surface,#1a1f2e);color:var(--text,#e2e8f0);font-family:inherit;transition:all 0.2s;" placeholder="Enter job title" />
            </div>
            <div>
              <label style="display:block;margin-bottom:6px;">
                <span style="font-size:13px;font-weight:500;color:var(--text,#e2e8f0);display:block;">Company</span>
              </label>
              <input type="text" name="company" value="${contact.company || ''}" style="width:100%;padding:8px 12px;border:1px solid var(--border,#2d3748);border-radius:8px;font-size:14px;font-weight:500;background:var(--surface,#1a1f2e);color:var(--text,#e2e8f0);font-family:inherit;transition:all 0.2s;" placeholder="Enter company" />
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div>
              <label style="display:block;margin-bottom:6px;">
                <span style="font-size:13px;font-weight:500;color:var(--text,#e2e8f0);display:block;">Phone</span>
              </label>
              <input type="text" name="phone" value="${contact.phone || ''}" style="width:100%;padding:8px 12px;border:1px solid var(--border,#2d3748);border-radius:8px;font-size:14px;font-weight:500;background:var(--surface,#1a1f2e);color:var(--text,#e2e8f0);font-family:inherit;transition:all 0.2s;" placeholder="Enter phone number" />
            </div>
            <div>
              <label style="display:block;margin-bottom:6px;">
                <span style="font-size:13px;font-weight:500;color:var(--text,#e2e8f0);display:block;">LinkedIn</span>
              </label>
              <input type="text" name="linkedin" value="${contact.linkedin || ''}" style="width:100%;padding:8px 12px;border:1px solid var(--border,#2d3748);border-radius:8px;font-size:14px;font-weight:500;background:var(--surface,#1a1f2e);color:var(--text,#e2e8f0);font-family:inherit;transition:all 0.2s;" placeholder="LinkedIn URL" />
            </div>
          </div>
          <div style="padding-top:16px;border-top:1px solid var(--border,#2d3748);">
            <div>
              <label style="display:block;margin-bottom:6px;">
                <span style="font-size:13px;font-weight:500;color:var(--text,#e2e8f0);display:block;">Status</span>
              </label>
              <select name="status" style="width:100%;padding:8px 12px;border:1px solid var(--border,#2d3748);border-radius:8px;font-size:14px;font-weight:500;background:var(--surface,#1a1f2e);color:var(--text,#e2e8f0);font-family:inherit;transition:all 0.2s;">
                ${['approved','pending','contacted','qualified','archived','lost'].map(s => `
                  <option value="${s}" ${String(contact.status || '').toLowerCase() === s.toLowerCase() ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>
                `).join('')}
              </select>
            </div>
          </div>
          <div style="padding-top:16px;border-top:1px solid var(--border,#2d3748);display:flex;justify-content:space-between;align-items:center;gap:10px;">
            <button type="button" class="details-delete" style="padding:10px 20px;font-size:14px;font-weight:600;border:1px solid var(--error,#ef4444);background:transparent;color:var(--error,#ef4444);border-radius:12px;cursor:pointer;transition:all 0.2s;min-width:80px;">🗑️ Delete</button>
            <div style="display:flex;gap:10px;">
              <button type="button" class="details-cancel" style="padding:10px 20px;font-size:14px;font-weight:600;border:1px solid var(--border,#2d3748);background:transparent;color:var(--text,#e2e8f0);border-radius:12px;cursor:pointer;transition:all 0.2s;min-width:80px;">Cancel</button>
              <button type="submit" class="details-save" style="padding:10px 20px;font-size:14px;font-weight:600;border:none;background:var(--primary,#7c3aed);color:#fff;border-radius:12px;cursor:pointer;transition:all 0.2s;min-width:80px;">Save</button>
            </div>
          </div>
        </form>
      `;

      panel.style.position = 'fixed';
      panel.style.right = (sidebarWidth + 20) + 'px';
      panel.style.bottom = '40px';
      panel.style.zIndex = '10006';
      panel.style.background = 'var(--bg, #0a0e1a)';
      panel.style.color = 'var(--text, #e2e8f0)';
      panel.style.padding = '24px';
      panel.style.borderRadius = '12px';
      panel.style.boxShadow = '0 20px 60px rgba(0,0,0,0.4)';
      panel.style.minWidth = '460px';
      panel.style.maxWidth = '500px';
      panel.style.fontSize = '14px';
      panel.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      panel.style.border = '1px solid var(--border, #2d3748)';

      // Add focus styles for inputs
      const style = document.createElement('style');
      style.textContent = `
        .crmsync-contact-details-panel input:focus,
        .crmsync-contact-details-panel select:focus {
          outline: none;
          border-color: var(--primary, #7c3aed);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }
        .crmsync-contact-details-panel .details-save:hover {
          background: var(--primary-hover, #6d28d9) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }
        .crmsync-contact-details-panel .details-cancel:hover {
          background: var(--surface, #1a1f2e) !important;
          border-color: var(--primary, #7c3aed) !important;
          color: var(--primary, #7c3aed) !important;
        }
        .crmsync-contact-details-panel .details-delete:hover {
          background: var(--error, #ef4444) !important;
          color: white !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }
      `;
      document.head.appendChild(style);

      const closeBtn = panel.querySelector('.details-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          panel.remove();
          if (style.parentNode) style.remove();
        });
      }

      const form = panel.querySelector('.crmsync-details-form');
      const cancelBtn = panel.querySelector('.details-cancel');
      const saveBtn = panel.querySelector('.details-save');
      const deleteBtn = panel.querySelector('.details-delete');

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          panel.remove();
          if (style.parentNode) style.remove();
        });
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
          if (confirm(`Are you sure you want to delete ${getFullName(contact.firstName, contact.lastName) || contact.email}? This action cannot be undone.`)) {
            try {
              deleteBtn.disabled = true;
              deleteBtn.textContent = 'Deleting...';
              
              // Delete the contact
              await chrome.runtime.sendMessage({ 
                action: 'deleteContact', 
                email: contact.email 
              });
              
              // Remove from local array
              const index = contacts.findIndex(c => c.email === contact.email);
              if (index > -1) {
                contacts.splice(index, 1);
              }
              
              // Remove from pending if present
              const pendingIndex = pendingContacts.findIndex(c => c.email === contact.email);
              if (pendingIndex > -1) {
                pendingContacts.splice(pendingIndex, 1);
              }
              
              // Update UI
              updateWidget();
              updateSidebar();
              
              // Close panel
              panel.remove();
              if (style.parentNode) style.remove();
              
              showNotification('Contact deleted successfully');
            } catch (error) {
              console.error('Error deleting contact:', error);
              deleteBtn.disabled = false;
              deleteBtn.textContent = '🗑️ Delete';
              showNotification('Failed to delete contact', 'error');
            }
          }
        });
      }

      if (form && saveBtn) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(form);
          const updated = {
            ...contact,
            firstName: formData.get('firstName') || '',
            lastName: formData.get('lastName') || '',
            email: formData.get('email') || '',
            title: formData.get('title') || '',
            company: formData.get('company') || '',
            phone: formData.get('phone') || '',
            linkedin: formData.get('linkedin') || '',
            lastContactAt: formData.get('lastContactAt') || contact.lastContactAt || undefined,
            status: formData.get('status') || contact.status
          };

          saveBtn.disabled = true;
          saveBtn.textContent = 'Saving...';

          try {
            await chrome.runtime.sendMessage({ action: 'updateContact', contact: updated });
            panel.remove();
            if (style.parentNode) style.remove();
            await loadContacts();
            updateSidebar();
            updateWidget();
          } catch (err) {
            console.error('CRMSYNC: Error updating contact from sidebar panel', err);
          } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save';
          }
        });
      }

      document.body.appendChild(panel);
    } catch (error) {
      console.error('CRMSYNC: Error showing contact details panel', error);
    }
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showSidebar') {
      if (!sidebarContainer) {
        createSidebar();
      }
      toggleSidebar();
      sendResponse({ success: true });
    } else if (request.action === 'showWidget') {
      // Show the widget (floating action button) and return it to top right
      if (!widgetContainer) {
        createFloatingWidget();
      }
      if (widgetContainer) {
        // Make it visible
        widgetContainer.style.display = 'flex';
        widgetContainer.style.opacity = '1';
        widgetContainer.style.visibility = 'visible';
        
        // Reset position to top right corner
        widgetContainer.style.right = '20px';
        widgetContainer.style.bottom = 'auto';
        widgetContainer.style.top = '80px';
        widgetContainer.style.left = 'auto';
        
        // Briefly highlight it with pulse animation
        widgetContainer.style.animation = 'pulse 0.5s ease-in-out';
        setTimeout(() => {
          if (widgetContainer) {
            widgetContainer.style.animation = '';
          }
        }, 500);
      }
      sendResponse({ success: true });
    } else if (request.action === 'exportCSV') {
      // Handle export from popup too
      chrome.runtime.sendMessage({ action: 'exportCSV' }).then(response => {
        if (response && response.success && response.csvContent) {
          const blob = new Blob([response.csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = response.filename || 'contacts.csv';
          a.click();
          URL.revokeObjectURL(url);
        }
        sendResponse(response);
      });
      return true;
    } else if (request.action === 'themeChanged') {
      // Update theme when changed from popup
      settings.darkMode = request.darkMode;
      applyTheme();
      sendResponse({ success: true });
    }
    return true;
  });

  /**
   * Gmail-specific detector for "email sent" events.
   * Uses both send button clicks and the "Message sent." toast.
   */
  function setupEmailSentDetector() {
    try {
      observeSendButtonsForEmailSent();
      observeGmailToasts();
    } catch (error) {
      console.error('CRMSYNC: Error setting up email sent detector', error);
    }
  }

  function markRejected(email) {
    if (!email) return;
    const lower = email.toLowerCase();
    rejectedEmails.add(lower);
    chrome.storage.local.set({ rejectedEmails: Array.from(rejectedEmails) });
  }

  function clearRejected(email) {
    if (!email) return;
    const lower = email.toLowerCase();
    if (rejectedEmails.has(lower)) {
      rejectedEmails.delete(lower);
      chrome.storage.local.set({ rejectedEmails: Array.from(rejectedEmails) });
    }
  }

  /**
   * Detect and cache the user's own email address to exclude from contact collection.
   * NOW: ONLY uses emails explicitly set in settings - no auto-detection
   */
  function detectUserEmail() {
    // DISABLED: Auto-detection was picking up contact emails and marking them as user emails
    // Now we ONLY use what's explicitly defined in settings
    
    console.log('👤 CRMSYNC: detectUserEmail called - using ONLY settings, no auto-detection');
    console.log('👤 CRMSYNC: Current userEmails from settings:', userEmails);
    
    // If userEmails is already populated from settings, don't do anything
    if (userEmails && userEmails.length > 0) {
      console.log('👤 CRMSYNC: User emails already set from settings:', userEmails);
      return;
    }
    
    // If no user emails are set, we can optionally detect from Gmail account button ONLY
    // (not from all [email] attributes which was causing false positives)
    const accountButton = document.querySelector('a[aria-label*="Google"][href*="myaccount"], [gb_yc] [email], [data-ogsc] [email]');
    if (accountButton) {
      const email = accountButton.getAttribute('email') || 
                   accountButton.getAttribute('aria-label')?.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)?.[1];
      if (email) {
        userEmails = [email.toLowerCase()];
        userEmail = userEmails[0];
        chrome.storage.local.set({ userEmails, userEmail });
        console.log('👤 CRMSYNC: Detected user email from account button:', userEmails);
        return;
      }
    }
    
    console.log('⚠️ CRMSYNC: No user email configured. Please set your email in settings.');

    // Retry detection after a delay if not found
    setTimeout(() => {
      if (!userEmails || userEmails.length === 0) {
        detectUserEmail();
      }
    }, 3000);
  }

  /**
   * Check if an email belongs to the user (should be excluded from collection).
   */
  function isUserEmail(email) {
    if (!email) return false;
    const lower = email.toLowerCase();
    if (userEmails && userEmails.length > 0) {
      return userEmails.some(e => e && e.toLowerCase() === lower);
    }
    if (userEmail) {
      return userEmail.toLowerCase() === lower;
    }
    if (window.gmailUserEmail) {
      return window.gmailUserEmail.toLowerCase() === lower;
    }
    return false;
  }

  function textContainsUserEmail(text) {
    if (!text || !userEmails || userEmails.length === 0) return false;
    const lower = (text || '').toLowerCase();
    return userEmails.some(e => e && lower.includes(e.toLowerCase()));
  }

  /**
   * Check if an email should be excluded based on domain settings.
   */
  function isExcludedDomain(email) {
    if (!email || !settings || !settings.excludeDomains || settings.excludeDomains.length === 0) {
      return false;
    }
    const emailLower = email.toLowerCase();
    const domain = emailLower.split('@')[1];
    if (!domain) return false;
    
    return settings.excludeDomains.some(excludedDomain => {
      const excludedLower = excludedDomain.toLowerCase().trim();
      // Match exact domain or subdomain
      return domain === excludedLower || domain.endsWith('.' + excludedLower);
    });
  }

  /**
   * Check if a name should be excluded based on name settings.
   * Can check either full name string OR firstName + lastName combination.
   * Format in settings: "Sebastian Staal" will match ONLY when firstName="Sebastian" AND lastName="Staal"
   * @param {string} firstName - First name to check
   * @param {string} lastName - Last name to check
   */
  function isExcludedName(firstName, lastName) {
    if (!settings || !settings.excludeNames || settings.excludeNames.length === 0) {
      return false;
    }
    
    const firstLower = (firstName || '').trim().toLowerCase();
    const lastLower = (lastName || '').trim().toLowerCase();
    const fullName = getFullName(firstName, lastName);
    const fullNameLower = (fullName || '').trim().toLowerCase();
    
    if (!firstLower && !lastLower) return false;
    
    return settings.excludeNames.some(excludedName => {
      const excludedLower = excludedName.trim().toLowerCase();
      
      // Check if excluded name contains a space (indicates firstName + lastName combo)
      if (excludedLower.includes(' ')) {
        const parts = excludedLower.split(/\s+/);
        if (parts.length >= 2) {
          // Match ONLY if BOTH first and last names match
          const excludedFirst = parts.slice(0, -1).join(' '); // Everything except last word
          const excludedLast = parts[parts.length - 1]; // Last word
          
          return firstLower === excludedFirst && lastLower === excludedLast;
        }
      }
      
      // For single-word exclusions, match against either first name, last name, or full name
      return firstLower === excludedLower || 
             lastLower === excludedLower || 
             fullNameLower === excludedLower ||
             fullNameLower.includes(excludedLower);
    });
  }

  /**
   * Check if a phone number should be excluded (e.g., user's own phone).
   * Normalizes both numbers by removing spaces, dashes, parentheses for comparison.
   */
  function isExcludedPhone(phone) {
    if (!phone || !settings || !settings.excludePhones || settings.excludePhones.length === 0) {
      return false;
    }
    // Normalize phone: remove all non-digit characters except leading +
    const normalizedPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    
    return settings.excludePhones.some(excludedPhone => {
      const normalizedExcluded = excludedPhone.replace(/[\s\-\(\)\.]/g, '');
      // Match if normalized versions are the same
      return normalizedPhone === normalizedExcluded || 
             normalizedPhone.includes(normalizedExcluded) || 
             normalizedExcluded.includes(normalizedPhone);
    });
  }

  /**
   * Automatically scan email threads when they are opened/viewed.
   * This enables background collection without user interaction.
   */
  // Global reference to scanThread so it can be triggered manually
  let globalScanThread = null;
  
  // Auto-pending timers for contacts
  let autoPendingTimers = new Map(); // Map<email, timerId>
  
  // Track contacts currently shown in approval panels to prevent duplicates
  let contactsInApproval = new Set(); // Set of emails

  function setupThreadObserver() {
    let lastScannedThread = null;
    let scanDebounceTimer = null;

    /**
     * Simple, robust thread scanner.
     * Step 1: Find all message containers in the current view
     * Step 2: For each message, extract sender email from header
     * Step 3: Extract signature data from that message's body
     * Step 4: Create contact
     */
    const scanThread = async () => {
      console.log('🔍 CRMSYNC: Starting thread scan...');
      
      // SAFETY: Clean up user emails - remove any that don't contain hydemedia.dk
      // (your actual domain - adjust this if needed)
      if (userEmails && userEmails.length > 0) {
        const cleanedEmails = userEmails.filter(email => {
          const isValid = email.includes('hydemedia.dk') || email.includes('staal');
          if (!isValid) {
            console.log(`⚠️ CRMSYNC: Removing wrongly detected user email: ${email}`);
          }
          return isValid;
        });
        
        if (cleanedEmails.length !== userEmails.length) {
          userEmails = cleanedEmails;
          userEmail = userEmails[0] || null;
          chrome.storage.local.set({ userEmails, userEmail });
          console.log(`✅ CRMSYNC: Cleaned user emails list: ${JSON.stringify(userEmails)}`);
        }
      }
      
      console.log(`👤 CRMSYNC: User emails in list: ${JSON.stringify(userEmails)}`);
      console.log(`👤 CRMSYNC: Primary user email: ${userEmail}`);
      
      // STEP 1: Find all message containers
      // In Gmail, messages are usually in [role="article"] or specific message containers
      const messages = document.querySelectorAll('[role="article"], [data-message-id], .adn, .a3s');
      
      if (messages.length === 0) {
        console.log('⚠️ CRMSYNC: No messages found');
        return;
      }
      
      console.log(`📧 CRMSYNC: Found ${messages.length} potential message containers`);
      
      //STEP 2: Extract unique message containers (avoid duplicates)
      const uniqueMessages = new Set();
      messages.forEach(msg => {
        // Try to find the root message container (usually role="article" or a parent with message body)
        const article = msg.closest('[role="article"]') || msg.closest('.adn') || msg;
        uniqueMessages.add(article);
      });
      
      console.log(`📬 CRMSYNC: Processing ${uniqueMessages.size} unique messages`);
      
      let newCount = 0;
      let skipped = { existing: 0, userEmail: 0, invalid: 0, rejected: 0 };
      
      // STEP 3: Process each message
      let messageIndex = 0;
      for (const messageContainer of uniqueMessages) {
        messageIndex++;
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📬 CRMSYNC: Processing message ${messageIndex}/${uniqueMessages.size}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        
        // STEP 3A: Extract sender/recipient email from this message
        // For SENT emails: we want the TO/recipient email
        // For RECEIVED emails: we want the FROM/sender email
        let contactEmail = null;
        let contactName = null;
        
        // Try Gmail header elements - collect ALL emails first
        const emailElements = messageContainer.querySelectorAll('[email], [data-email], [data-hovercard-id]');
        console.log(`🔍 CRMSYNC: Found ${emailElements.length} email elements in message`);
        
        const allEmails = [];
        for (const el of emailElements) {
          const email = extractEmailFromElement(el);
          if (email) {
            allEmails.push({ email, element: el, isUser: isUserEmail(email) });
            console.log(`   🔍 Found email: "${email}", isUser=${isUserEmail(email)}`);
          }
        }
        
        // Strategy: Find the FIRST email that's NOT the user's
        // This works for both sent and received emails
        for (const { email, element, isUser } of allEmails) {
          if (!isUser) {
            contactEmail = email;
            contactName = extractNameFromElement(element, messageContainer);
            console.log(`   ✅ Selected contact email: ${contactEmail}, name: ${contactName || 'none'}`);
            break;
          }
        }
        
        // If all emails are user's emails, this might be a sent message
        // Try to find TO/recipient in text
        if (!contactEmail && allEmails.every(e => e.isUser)) {
          console.log(`   ℹ️ All emails are user's - this is likely a SENT message. Looking for TO/recipient...`);
        }
        
        // Fallback: Look for From:/To:/Sent: in message header text
        if (!contactEmail) {
          console.log(`🔍 CRMSYNC: No contact email found in attributes, trying header text...`);
          const messageText = messageContainer.textContent || '';
          const lines = messageText.split('\n').slice(0, 30); // First 30 lines usually contain header
          console.log(`🔍 CRMSYNC: Checking first 30 lines for From:/To:/Sent: headers`);
          
          // First pass: look for From: or Fra: (received emails)
          for (const line of lines) {
            if (/^(From|Fra|Sender):/i.test(line)) {
              console.log(`   📧 Found FROM header: "${line.substring(0, 100)}..."`);
              const emailMatch = line.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
              if (emailMatch) {
                const email = emailMatch[1].toLowerCase();
                console.log(`   🔍 Checking FROM email: "${email}", isUser=${isUserEmail(email)}`);
                if (!isUserEmail(email)) {
                  contactEmail = email;
                  // Try to extract name from same line
                  const nameMatch = line.match(/[<"']?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)[>"']?/);
                  if (nameMatch) contactName = nameMatch[1];
                  console.log(`   ✅ Extracted from FROM: email=${contactEmail}, name=${contactName || 'none'}`);
                  break;
                } else {
                  console.log(`   ⏭️ Skipping FROM email ${email} - it's a user email`);
                }
              }
            }
          }
          
          // Second pass: if still no email, look for To:/Til: (sent emails)
          if (!contactEmail) {
            console.log(`   📧 No FROM found, checking TO headers...`);
            console.log(`   📄 First 30 lines of message text:\n${lines.join('\n')}`);
            
            for (const line of lines) {
              if (/^(To|Til|Recipient):/i.test(line)) {
                console.log(`   📧 Found TO header: "${line.substring(0, 100)}..."`);
                const emailMatch = line.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                if (emailMatch) {
                  const email = emailMatch[1].toLowerCase();
                  console.log(`   🔍 Checking TO email: "${email}", isUser=${isUserEmail(email)}`);
                  if (!isUserEmail(email)) {
                    contactEmail = email;
                    // Try to extract name from same line
                    const nameMatch = line.match(/[<"']?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)[>"']?/);
                    if (nameMatch) contactName = nameMatch[1];
                    console.log(`   ✅ Extracted from TO: email=${contactEmail}, name=${contactName || 'none'}`);
                    break;
                  } else {
                    console.log(`   ⏭️ Skipping TO email ${email} - it's a user email`);
                  }
                }
              }
            }
          }
          
          if (!contactEmail) {
            console.log(`   ❌ No From: or To: header found in first 30 lines`);
          }
        }
        
        // Skip if no email found or it's the user's own email
        if (!contactEmail) {
          console.log('⏭️ CRMSYNC: No contact email found in message');
          skipped.invalid++;
          continue;
        }
        
        if (isUserEmail(contactEmail) || isExcludedDomain(contactEmail)) {
          console.log(`⏭️ CRMSYNC: Skipping ${contactEmail} (user/excluded)`);
          skipped.userEmail++;
          continue;
        }
        
        // Check if already exists
        const existingContact = contacts.find(c => c.email === contactEmail);
        const existingPending = pendingContacts.find(p => p.email === contactEmail);
        const isRejected = rejectedEmails.has(contactEmail.toLowerCase());
        
        if (existingContact || existingPending) {
          console.log(`⏭️ CRMSYNC: ${contactEmail} already exists`);
          skipped.existing++;
          continue;
        }
        
        if (isRejected) {
          console.log(`⏭️ CRMSYNC: ${contactEmail} was rejected before`);
          skipped.rejected++;
          continue;
        }
        
        console.log(`✅ CRMSYNC: Processing new contact: ${contactEmail}`);
        
        // STEP 3B: Extract signature and contact info from THIS message's body
        const messageBody = messageContainer.querySelector('.a3s, .ii, [data-message-id]') || messageContainer;
        const bodyText = messageBody.textContent || '';
        const bodyHtml = messageBody.innerHTML || '';
        const combinedText = bodyText + ' ' + bodyHtml.replace(/<[^>]+>/g, ' ');
        
        console.log(`📄 CRMSYNC: Message body length: ${bodyText.length} chars`);
        console.log(`📄 CRMSYNC: First 300 chars of body:\n${bodyText.substring(0, 300)}...`);
        
        // Extract signature block (last part of email, usually)
        let signature = extractSignatureBlock(combinedText);
        
        if (signature) {
          console.log(`✍️ CRMSYNC: Found signature (${signature.length} chars):\n${signature.substring(0, 200)}...`);
        } else {
          console.log(`⚠️ CRMSYNC: No signature block found`);
        }
        
        // Filter out quoted user content
        if (signature && textContainsUserEmail(signature)) {
          console.log(`⚠️ CRMSYNC: Signature contains user email, ignoring it`);
          signature = null;
        }
        
        // Extract contact details
        const emailDomain = contactEmail.split('@')[1]?.split('.')[0];
        const skipDomains = ['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'mail'];
        const domainHint = skipDomains.includes(emailDomain) ? null : emailDomain;
        
        console.log(`🏢 CRMSYNC: Email domain: ${emailDomain}, domain hint: ${domainHint || 'none'}`);
        
        const searchText = signature || combinedText;
        console.log(`🔍 CRMSYNC: Searching for data in ${signature ? 'signature' : 'full text'} (${searchText.length} chars)`);
        
        const company = domainHint ? extractCompanyByDomainHint(searchText, domainHint) : extractCompany(searchText);
        const jobTitle = extractJobTitle(searchText);
        const phone = extractPhone(searchText, contactEmail, userEmails);
        const linkedin = extractLinkedIn(searchText);
        // Use searchText instead of bodyText to avoid extracting name from user's signature
        let extractedName = contactName || extractNameFromText(searchText, contactEmail);
        
        // Additional safeguard: If extracted name is excluded, set to null
        const { firstName: tempFirst, lastName: tempLast } = splitName(extractedName);
        console.log(`🔍 DEBUG: Checking exclusion for "${extractedName}" (First: "${tempFirst}", Last: "${tempLast}")`);
        console.log(`🔍 DEBUG: Excluded names in settings:`, settings.excludeNames);
        const isExcluded = isExcludedName(tempFirst, tempLast);
        console.log(`🔍 DEBUG: isExcluded result: ${isExcluded}`);
        if (isExcluded) {
          console.log(`⚠️ CRMSYNC: Extracted name "${extractedName}" is in exclusion list, clearing it`);
          extractedName = null;
        }
        
        const { firstName, lastName } = splitName(extractedName);
        
        console.log(`📋 CRMSYNC: Extracted data for ${contactEmail}:`);
        console.log(`   👤 Name: ${getFullName(firstName, lastName) || 'NOT FOUND'} (First: ${firstName || 'N/A'}, Last: ${lastName || 'N/A'})`);
        console.log(`   🏢 Company: ${company || 'NOT FOUND'}`);
        console.log(`   💼 Job Title: ${jobTitle || 'NOT FOUND'}`);
        console.log(`   📞 Phone: ${phone || 'NOT FOUND'}`);
        console.log(`   🔗 LinkedIn: ${linkedin || 'NOT FOUND'}`);
        
        // Create contact
        const contact = {
          email: contactEmail,
          firstName: firstName,
          lastName: lastName,
          jobTitle: jobTitle,
          company: company || (domainHint ? domainHint.charAt(0).toUpperCase() + domainHint.slice(1) : null),
          phone: phone,
          linkedin: linkedin,
          lastContact: new Date().toISOString(),
          status: 'New'
        };
        
        console.log(`📦 CRMSYNC: Created contact object:`, contact);
        
        // Skip if name is excluded
        if (isExcludedName(firstName, lastName)) {
          const fullName = getFullName(firstName, lastName);
          console.log(`⏭️ CRMSYNC: Skipping ${contactEmail} - excluded name: "${fullName}"`);
          skipped.userEmail++;
          continue;
        }
        
        // Auto-approve or show approval panel
        if (settings.autoApprove) {
          console.log(`✅ CRMSYNC: Auto-approving contact ${contactEmail}`);
          await approveContact(contact, null);
          newCount++;
          console.log(`✅ CRMSYNC: Contact ${contactEmail} approved and added to contacts`);
        } else {
          // Check if this contact is already shown in an approval panel
          if (contactsInApproval.has(contactEmail)) {
            console.log(`⏭️ CRMSYNC: Contact ${contactEmail} already in approval panel, skipping`);
            skipped.existing++;
            continue;
          }
          
          console.log(`📝 CRMSYNC: Showing approval panel for ${contactEmail}`);
          sessionFoundCount += 1;
          chrome.storage.local.set({ sessionFoundCount });
          playClickSound('newContact');
          showApprovalPanel(contact, messageContainer);
          contactsInApproval.add(contactEmail);
          newCount++;
          console.log(`✅ CRMSYNC: Approval panel shown for ${contactEmail}`);
        }
      }
      
      console.log(`🎉 CRMSYNC: Scan complete! Found: ${newCount}, Skipped: existing=${skipped.existing}, user=${skipped.userEmail}, invalid=${skipped.invalid}, rejected=${skipped.rejected}`);
      
      if (newCount > 0) {
        showNotification(`Found ${newCount} contact${newCount > 1 ? 's' : ''}!`);
      }
      
      // Refresh UI
      await loadContacts();
      updateWidget();
      updateSidebar();
    };
    
    // Store reference globally for manual triggering
    globalScanThread = scanThread;

    // Watch for URL changes (Gmail uses pushState)
    let lastUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        console.log('CRMSYNC: URL changed, triggering scan', { from: lastUrl, to: window.location.href });
        
        // Clear all auto-pending timers and approval panels when leaving a thread
        if (autoPendingTimers.size > 0) {
          console.log(`🧹 CRMSYNC: Clearing ${autoPendingTimers.size} auto-pending timers`);
          autoPendingTimers.forEach((timerId) => clearTimeout(timerId));
          autoPendingTimers.clear();
        }
        
        // Clear contacts in approval tracking
        contactsInApproval.clear();
        
        // Remove any visible approval panels
        const existingPanel = document.querySelector('.crmsync-approval-panel');
        if (existingPanel) {
          existingPanel.remove();
        }
        
        lastUrl = window.location.href;
        lastScannedThread = null; // Reset to allow re-scanning new thread
        clearTimeout(scanDebounceTimer);
        scanDebounceTimer = setTimeout(scanThread, 800); // Reduced delay
      }
    });

    // Watch for DOM changes and trigger scans (let scanThread decide inbox vs thread)
    const domObserver = new MutationObserver((mutations) => {
      // Only trigger if there are significant changes (not just attribute updates)
      const hasSignificantChange = mutations.some(m => 
        m.addedNodes.length > 0 || m.removedNodes.length > 0 || m.type === 'childList'
      );
      if (hasSignificantChange) {
        clearTimeout(scanDebounceTimer);
        scanDebounceTimer = setTimeout(() => {
          console.log('CRMSYNC: DOM changed, triggering scan');
          scanThread();
        }, 800); // Reduced delay for faster scanning
      }
    });

    // Start observing
    if (document.body) {
      urlObserver.observe(document.body, { childList: true, subtree: true });
      domObserver.observe(document.body, { childList: true, subtree: true });
    }

    // Also listen for popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      console.log('CRMSYNC: popstate event, triggering scan');
      lastScannedThread = null;
      clearTimeout(scanDebounceTimer);
      scanDebounceTimer = setTimeout(scanThread, 800); // Reduced delay
    });
    
    // Listen for hashchange (Gmail uses hash-based navigation)
    window.addEventListener('hashchange', () => {
      console.log('CRMSYNC: hashchange event, triggering scan', window.location.href);
      lastScannedThread = null;
      clearTimeout(scanDebounceTimer);
      scanDebounceTimer = setTimeout(scanThread, 800); // Reduced delay
    });

    // Initial scan - more aggressive with multiple retries
    // Gmail can be slow to render, so try multiple times
    const tryInitialScan = (attempt) => {
      const currentUrl = window.location.href;
      const isInboxList = isInboxListView(currentUrl);
      console.log(`CRMSYNC: Initial scan attempt ${attempt}`, { url: currentUrl, isInboxList });
      if (!isInboxList) {
        console.log(`CRMSYNC: Attempting initial thread scan (attempt ${attempt})`);
        scanThread();
      } else {
        console.log(`CRMSYNC: Skipping initial scan - in inbox list view`);
      }
    };
    
    // Try immediately, then after delays to catch lazy-loaded content
    setTimeout(() => tryInitialScan(1), 500);
    setTimeout(() => tryInitialScan(2), 1500);
    setTimeout(() => tryInitialScan(3), 3000);
    setTimeout(() => tryInitialScan(4), 5000);
    
    console.log('CRMSYNC: Thread observer setup complete');
  }

  function observeSendButtonsForEmailSent() {
    const observer = new MutationObserver(() => {
      const sendButtons = document.querySelectorAll(
        '[role="button"][aria-label*="Send"], ' +
        '[role="button"][aria-label*="send"], ' +
        '[role="button"][data-tooltip*="Send"], ' +
        '[role="button"][data-tooltip*="send"], ' +
        'div[role="button"][aria-label*="Send"], ' +
        'button[aria-label*="Send"]'
      );
      sendButtons.forEach(button => {
        if (button.dataset.crmsyncEmailSentListener === 'true') {
          return;
        }
        button.dataset.crmsyncEmailSentListener = 'true';
        button.addEventListener('click', () => {
          // Small delay to ensure Gmail has processed the send
          setTimeout(() => {
            const emailData = collectCurrentComposeEmailData();
            if (emailData && emailData.recipients && emailData.recipients.length > 0) {
              // Avoid duplicate processing
              const emailKey = `${emailData.recipients.join(',')}_${emailData.subject}_${Date.now()}`;
              if (lastSentEmailKey === emailKey) {
                return;
              }
              lastSentEmailKey = emailKey;
              
              // Reset after 5 seconds to allow same email to be sent again if needed
              setTimeout(() => {
                if (lastSentEmailKey === emailKey) {
                  lastSentEmailKey = null;
                }
              }, 5000);

              handleEmailSent(emailData);
            }
          }, 500);
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function observeGmailToasts() {
    let lastToastProcessed = null;
    
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return;
          
          // Check the node and its children for toast messages
          const text = (node.innerText || node.textContent || '').toLowerCase();
          const isToast = text.includes('message sent') || 
                         text.includes('sending') ||
                         node.querySelector('[role="alert"]') ||
                         node.classList.contains('banner') ||
                         node.getAttribute('aria-live');
          
          if (isToast && (text.includes('message sent') || text.includes('sent'))) {
            // Avoid processing same toast multiple times
            const toastKey = node.textContent || Date.now().toString();
            if (lastToastProcessed === toastKey) {
              return;
            }
            lastToastProcessed = toastKey;

            // Small delay to ensure email data is available
            setTimeout(() => {
              // Use latest compose data, or collect fresh as fallback
              const emailData = lastSentEmailData || collectCurrentComposeEmailData();
              if (emailData && emailData.recipients && emailData.recipients.length > 0) {
                handleEmailSent(emailData);
              }
            }, 300);
          }
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function collectCurrentComposeEmailData() {
    try {
      // Try multiple selectors for compose window (Gmail updates these)
      const composeSelectors = [
        '[role="dialog"]',
        '.aYF',
        '.nH.if',
        '.aYF.aYF'
      ];

      let activeCompose = null;
      for (const selector of composeSelectors) {
        const dialogs = document.querySelectorAll(selector);
        if (dialogs.length) {
          activeCompose = dialogs[dialogs.length - 1];
          break;
        }
      }

      if (!activeCompose) {
        return null;
      }

      // Recipients - try multiple selectors
      const toFieldSelectors = [
        'textarea[name="to"]',
        'input[name="to"]',
        '[aria-label*="To"][role="textbox"]',
        '[aria-label^="To"]',
        '[name="to"]',
        '.aoD.az6 input',
        '.wO.nr.l1 textarea',
        '[data-tooltip*="To"]'
      ];

      const recipientsSet = new Set();
      
      for (const selector of toFieldSelectors) {
        const toFields = activeCompose.querySelectorAll(selector);
        toFields.forEach(field => {
          const value = field.value || field.textContent || field.innerText || '';
          const matches = value.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
          if (matches) {
            matches.forEach(email => {
              const cleanEmail = email.toLowerCase().trim();
              // Filter out system emails
              if (!cleanEmail.includes('noreply') && !cleanEmail.includes('no-reply') &&
                  !cleanEmail.includes('mailer') && !cleanEmail.includes('notification')) {
                recipientsSet.add(cleanEmail);
              }
            });
          }
        });
      }

      // Also check for recipient chips/tags (Gmail shows emails as chips)
      const recipientChips = activeCompose.querySelectorAll('[email], [data-email], span[title*="@"]');
      recipientChips.forEach(chip => {
        const email = extractEmailFromElement(chip);
        if (email) {
          recipientsSet.add(email);
        }
      });

      const recipients = Array.from(recipientsSet);

      // Subject - try multiple selectors
      const subjectSelectors = [
        'input[name="subjectbox"]',
        '[name="subjectbox"]',
        'input[aria-label*="Subject"]',
        '[aria-label*="Subject"] input',
        '.aoD input[placeholder*="Subject"]'
      ];

      let subject = '';
      for (const selector of subjectSelectors) {
        const subjectInput = activeCompose.querySelector(selector);
        if (subjectInput) {
          subject = subjectInput.value || subjectInput.textContent || '';
          if (subject) break;
        }
      }

      if (!recipients.length && !subject) {
        return null;
      }

      const sentAt = new Date().toISOString();
      const direction = 'outbound';

      return { recipients, subject, sentAt, direction };
    } catch (error) {
      console.error('CRMSYNC: Error collecting compose email data', error);
      return null;
    }
  }

  async function handleEmailSent(emailData) {
    try {
      // Check if we should track based on labels
      if (!shouldTrackBasedOnLabels()) {
        return;
      }

      lastSentEmailData = emailData;
      const sentAt = emailData.sentAt || new Date().toISOString();
      const subject = emailData.subject || '';
      const threadId = getCurrentThreadId();

      // Update contacts: mark awaiting reply, store outbound metadata, schedule follow-up
      if (emailData.recipients && emailData.recipients.length > 0) {
        // Determine follow-up days (first value is the soonest)
        const followUpDays = Array.isArray(settings.noReplyAfterDays) && settings.noReplyAfterDays.length
          ? settings.noReplyAfterDays
          : [3, 7, 14];

        emailData.recipients.forEach(async (recipient) => {
          if (!recipient || isUserEmail(recipient)) return;
          try {
            // Compute follow-up date from sent time
            const nextFollowUpDate = new Date(sentAt);
            nextFollowUpDate.setDate(nextFollowUpDate.getDate() + followUpDays[0]);

            await chrome.runtime.sendMessage({
              action: 'updateContactMetadata',
              contact: {
                email: recipient.toLowerCase(),
                lastOutboundAt: sentAt,
                lastOutboundSubject: subject,
                lastOutboundThreadId: threadId || null,
                awaitingReply: true,
                followUpDue: false,
                followUpDate: nextFollowUpDate.toISOString(),
                outboundMessage: {
                  direction: 'outbound',
                  subject,
                  timestamp: sentAt,
                  threadId: threadId || null
                }
              }
            });
            // Optional: lightweight notification
            showNotification(`Follow-up scheduled in ${followUpDays[0]} days for ${recipient}`);
          } catch (err) {
            console.error('CRMSYNC: Error updating contact outbound metadata', err);
          }
        });
        // Refresh local state after updates
        await loadContacts();
        updateWidget();
        updateSidebar();
      }

      chrome.runtime.sendMessage({
        type: 'EMAIL_SENT',
        payload: {
          recipients: emailData.recipients,
          subject: emailData.subject,
          sentAt: emailData.sentAt,
          direction: emailData.direction
        }
      }).catch(error => {
        console.error('CRMSYNC: Error sending EMAIL_SENT message', error);
      });
      showInlineEmailApprovalUI(emailData);
    } catch (error) {
      console.error('CRMSYNC: Error handling email sent event', error);
    }
  }

  function showInlineEmailApprovalUI(emailData) {
    try {
      // If auto-approve is enabled, automatically save without showing UI
      if (settings.autoApprove) {
        chrome.runtime.sendMessage({
          type: 'CONFIRM_ADD',
          payload: {
            recipients: emailData.recipients,
            subject: emailData.subject,
            sentAt: emailData.sentAt,
            direction: emailData.direction,
            source: 'gmail'
          }
        }).catch(error => {
          console.error('CRMSYNC: Error sending CONFIRM_ADD message', error);
        });
        return;
      }

      // Show approval UI only if auto-approve is disabled
      if (inlineEmailApprovalElement && inlineEmailApprovalElement.parentNode) {
        inlineEmailApprovalElement.remove();
      }

      const container = document.createElement('div');
      container.id = 'crmsync-email-approval';
      container.style.position = 'fixed';
      container.style.bottom = '16px';
      container.style.right = '24px';
      container.style.zIndex = '10005';
      container.style.background = '#202124';
      container.style.color = '#fff';
      container.style.padding = '10px 14px';
      container.style.borderRadius = '8px';
      container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.gap = '8px';
      container.style.fontSize = '13px';
      container.style.fontFamily = 'Roboto, Arial, sans-serif';

      const label = document.createElement('span');
      label.textContent = 'Add this conversation to CRM?';

      const addButton = document.createElement('button');
      addButton.textContent = 'Add';
      addButton.style.background = '#1a73e8';
      addButton.style.color = '#fff';
      addButton.style.border = 'none';
      addButton.style.borderRadius = '4px';
      addButton.style.padding = '4px 10px';
      addButton.style.cursor = 'pointer';

      const dismissButton = document.createElement('button');
      dismissButton.textContent = 'Dismiss';
      dismissButton.style.background = 'transparent';
      dismissButton.style.color = '#e8eaed';
      dismissButton.style.border = 'none';
      dismissButton.style.padding = '4px 6px';
      dismissButton.style.cursor = 'pointer';

      addButton.addEventListener('click', () => {
        try {
          chrome.runtime.sendMessage({
            type: 'CONFIRM_ADD',
            payload: {
              recipients: emailData.recipients,
              subject: emailData.subject,
              sentAt: emailData.sentAt,
              direction: emailData.direction,
              source: 'gmail'
            }
          }).catch(error => {
            console.error('CRMSYNC: Error sending CONFIRM_ADD message', error);
          });
        } finally {
          container.remove();
        }
      });

      dismissButton.addEventListener('click', () => {
        container.remove();
      });

      container.appendChild(label);
      container.appendChild(addButton);
      container.appendChild(dismissButton);

      document.body.appendChild(container);
      inlineEmailApprovalElement = container;

      // Auto-hide after 15s
      setTimeout(() => {
        if (container.parentNode) {
          container.remove();
        }
      }, 15000);
    } catch (error) {
      console.error('CRMSYNC: Error showing inline email approval UI', error);
    }
  }

  // Reminder system
  function setupReminderSystem() {
    const observer = new MutationObserver(() => {
      const sendButtons = document.querySelectorAll('[role="button"][aria-label*="Send"], [role="button"][aria-label*="send"], [data-tooltip*="Send"]');
      sendButtons.forEach(button => {
        if (!button.dataset.reminderListener) {
          button.dataset.reminderListener = 'true';
          button.addEventListener('click', async () => {
            setTimeout(async () => {
              const composeWindow = document.querySelector('[role="dialog"]');
              if (composeWindow) {
                const toField = composeWindow.querySelector('[name="to"], [aria-label*="To"]')?.value || 
                              composeWindow.querySelector('[role="textbox"][aria-label*="To"]')?.textContent;
                if (toField) {
                  const emails = toField.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
                  if (emails) {
                    for (const email of emails) {
                      const contact = contacts.find(c => c.email === email.toLowerCase());
                      if (contact) {
                        const followUpDate = new Date();
                        followUpDate.setDate(followUpDate.getDate() + (settings.reminderDays || 3));
                        contact.followUpDate = followUpDate.toISOString();
                        contact.status = 'Follow-up Scheduled';
                        await chrome.runtime.sendMessage({ action: 'updateContact', contact });
                      }
                    }
                    await loadContacts();
                  }
                }
              }
            }, 500);
          });
        }
      });
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } else {
      console.warn('CRMSYNC: document.body not ready for reminder observer');
    }
  }

  /**
   * Detect the latest inbound email in the current thread
   */
  function detectLatestInboundEmailInThread() {
    try {
      const threadMain = document.querySelector('[role="main"]');
      if (!threadMain) return null;

      // Gmail messages are typically in role="listitem" or role="article"
      // Also check for newer Gmail structures
      const messageNodes = threadMain.querySelectorAll(
        '[role="listitem"], [role="article"], .nH.if, .aDP .nH, .nH[role="listitem"]'
      );
      if (!messageNodes.length) return null;

      // Get the latest message (last in list, or most recent timestamp)
      let latestMessage = messageNodes[messageNodes.length - 1];
      
      // First, try to detect the user's email from the page (fallback to stored aliases)
      let detectedUserEmail = userEmails && userEmails.length > 0 ? userEmails[0] : window.gmailUserEmail;
      if (!detectedUserEmail) {
        const userEmailEl = document.querySelector('[data-email]') || 
                            document.querySelector('[email]') ||
                            document.querySelector('a[href*="mailto:"]');
        if (userEmailEl) {
          detectedUserEmail = (userEmailEl.getAttribute('data-email') || 
                       userEmailEl.getAttribute('email') ||
                       userEmailEl.getAttribute('href')?.replace('mailto:', '') || '').toLowerCase();
        }
      }
      
      // Try to find the most recent INBOUND message (skip our own sent messages)
      for (let i = messageNodes.length - 1; i >= 0; i--) {
        const msg = messageNodes[i];
        
        // Check if this is our own sent message using multiple methods
        let isSent = false;
        
        // Method 1: Check for sent indicators in DOM
        if (msg.querySelector('[data-sent="true"], .a3s[data-sent="true"]')) {
          isSent = true;
        }
        
        // Method 2: Check for "You wrote" / "Du skrev" (Danish) / other sent indicators
        const msgText = msg.textContent || '';
        if (msgText.includes('You wrote') || 
            msgText.includes('Du skrev') ||  // Danish
            msgText.includes('til dig') ||    // Danish "to you" (when viewing sent)
            msgText.match(/^From: .+Sent: .+To:/i)) {  // Email header pattern
          isSent = true;
        }
        
        // Method 3: Check if sender email matches user email
        if (detectedUserEmail) {
          const senderEl = msg.querySelector('[email], [data-email], [data-hovercard-id]');
          if (senderEl) {
            const senderEmail = extractEmailFromElement(senderEl);
            if (senderEmail && senderEmail.toLowerCase() === detectedUserEmail) {
              isSent = true;
            }
          }
        }
        
        // Method 4: Check for "til mig" (to me) in Danish Gmail - this means it's FROM us
        const headerText = msg.querySelector('.gD, .bog, [role="heading"]')?.textContent || '';
        if (headerText.includes('til mig') || headerText.includes('to me')) {
          isSent = true;
        }
        
        // If this message is NOT from us, it's inbound - use it
        if (!isSent) {
          latestMessage = msg;
          break;
        }
      }

      // Sender header: try multiple Gmail selectors (updated for 2024 Gmail)
      const headerSelectors = [
        '.gD[email]',
        '.gD[data-hovercard-id]',
        '[email]',
        '[data-email]',
        '[data-hovercard-id]',
        'span[title*="@"]',
        '.bog span[email]',
        '.bA4[email]',
        '.g2[email]'
      ];

      let headerEl = null;
      for (const selector of headerSelectors) {
        headerEl = latestMessage.querySelector(selector);
        if (headerEl) break;
      }

      // If no header found, try parent traversal
      if (!headerEl) {
        const allSpans = latestMessage.querySelectorAll('span');
        for (const span of allSpans) {
          const email = extractEmailFromElement(span);
          if (email) {
            headerEl = span;
            break;
          }
        }
      }
      // Extract email with improved function, preferring explicit From/Sent headers
      let email = headerEl ? extractEmailFromElement(headerEl) : null;
      if (!email) {
        const headerTextSample = (latestMessage.textContent || '').split('\n').slice(0, 25).join('\n');
        email = extractEmailFromHeaderText(headerTextSample);
      }
      if (!email) return null;

      // Skip if it's our own email (use the detected aliases)
      if (isUserEmail(email) || (detectedUserEmail && email.toLowerCase() === detectedUserEmail.toLowerCase())) {
        return null; // This is our sent email, not inbound
      }

      // Extract name with improved function
      const name = extractNameFromElement(headerEl, latestMessage) || null;

      // Message body: used for signature heuristics
      const bodySelectors = [
        '.a3s', // Gmail message body
        '[data-message-id]',
        '.ii.gt',
        '.a3s.a3s',
        '.adn.ads'
      ];

      let bodyEl = null;
      for (const selector of bodySelectors) {
        bodyEl = latestMessage.querySelector(selector);
        if (bodyEl) break;
      }

      if (!bodyEl) {
        bodyEl = latestMessage;
      }

      const bodyText = (bodyEl && bodyEl.textContent) ? bodyEl.textContent : '';
      
      // CRITICAL: Try to strip quoted history so we only look at this inbound reply,
      // not your own older messages that are quoted below.
      let currentMessageText = bodyText;
      
      // First, try to find where the actual message ends by looking for quote markers
      // Common quote patterns (English and Danish) - be more aggressive
      const quotePatterns = [
        /On .+ wrote:/i,
        /Skrev .+:/i,  // Danish "Skrev NAME:"
        /-----Original Message-----/i,
        /From: .+Sent: .+To: .+Subject:/i,
        /Den .+ skrev .+:/i,  // Danish "Den [date] skrev [name]:"
        /> On .+ wrote:/i,
        /> From: .+Sent: .+To:/i,
        /^>+/m,  // Lines starting with > (quoted text)
        /^Fra: .+Sendt: .+Til:/i,  // Danish "From: ... Sent: ... To:"
        /^From: .+Date: .+To:/i,
        /^Date: .+From: .+To:/i
      ];
      
      let earliestQuoteIndex = -1;
      for (const pattern of quotePatterns) {
        const match = currentMessageText.search(pattern);
        if (match > 0 && (earliestQuoteIndex === -1 || match < earliestQuoteIndex)) {
          earliestQuoteIndex = match;
        }
      }
      
      // Also check for user's own signature patterns that indicate quoted content
      // If we find "Mvh\nSebastian" or similar, that's definitely quoted content
      if (detectedUserEmail || (userEmails && userEmails.length > 0)) {
        // Try to detect user's name from email or common signature patterns
        const userSignaturePatterns = [
          /Mvh\s+Sebastian/i,
          /Best regards\s+Sebastian/i,
          /Med venlig hilsen\s+Sebastian/i,
          /Sebastian\s+Staal/i  // User's actual name if we can detect it
        ];
        
        for (const pattern of userSignaturePatterns) {
          const match = currentMessageText.search(pattern);
          if (match > 0 && (earliestQuoteIndex === -1 || match < earliestQuoteIndex)) {
            earliestQuoteIndex = match;
          }
        }
      }
      
      // If we found a quote marker, cut everything after it
      if (earliestQuoteIndex > 0) {
        currentMessageText = currentMessageText.substring(0, earliestQuoteIndex).trim();
      }
      
      // Additional safety: if the text is very long (>1000 chars), it probably contains body text
      // But we want the SIGNATURE which is at the END, so take the last portion
      // However, we need to be careful - if we've already stripped quotes, the signature should be at the end
      if (currentMessageText.length > 1000) {
        // Take last 400 chars (signatures are usually 100-300 chars)
        currentMessageText = currentMessageText.substring(Math.max(0, currentMessageText.length - 400));
      }
      
      // Extract signature data (usually at the end of the *current* email)
      let signatureText = extractSignatureBlock(currentMessageText);
      
      // CRITICAL: If signature contains user's email, it's quoted content, not sender's signature
      if (signatureText && textContainsUserEmail(signatureText)) {
        signatureText = null; // This is quoted content, not the sender's signature
      }
      
      // STEP 1: Extract domain from email to use as a hint
      let emailDomainHint = null;
      if (email) {
        const emailLower = email.toLowerCase();
        const domainMatch = emailLower.match(/@([^.]+)/);
        if (domainMatch) {
          emailDomainHint = domainMatch[1].toLowerCase();
          // Skip common email providers
          const skipDomains = ['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'mail', 'email', 'com', 'dk', 'se', 'co', 'uk', 'net', 'org', 'io', 'me', 'info'];
          if (skipDomains.includes(emailDomainHint)) {
            emailDomainHint = null;
          }
        }
      }
      
      // PRIORITY: Extract from signature block first (more reliable)
      // Fallback to full message text only if signature extraction fails
      // Note: 'name' was already declared earlier from extractNameFromElement
      let company = null;
      let title = null;
      let phone = null;
      let linkedin = null;
      
      // STEP 2: Try to extract NAME from signature first (most reliable) - override header name if found
      if (signatureText) {
        const signatureName = extractNameFromText(signatureText, email);
        if (signatureName) {
          name = signatureName; // Override the header name with signature name (more reliable)
          console.log('CRMSYNC: Extracted name from signature (overriding header):', name);
        }
      }
      
      // STEP 3: Try to extract company using email domain as hint
      if (emailDomainHint) {
        // Search signature text for company name containing the domain
        const searchText = signatureText || currentMessageText;
        company = extractCompanyByDomainHint(searchText, emailDomainHint);
      }
      
      // STEP 4: Extract other fields (title, phone, linkedin) from signature
      if (signatureText) {
        if (!title) title = extractJobTitle(signatureText);
        if (!phone) phone = extractPhone(signatureText, email, userEmails);
        if (!linkedin) linkedin = extractLinkedIn(signatureText);
        // If company wasn't found via domain hint, try standard extraction
        if (!company) company = extractCompany(signatureText);
      }
      
      // If signature extraction didn't find everything, try full text
      if (!name || !company || !title || !phone) {
        const fullText = signatureText || currentMessageText;
        if (!name) name = extractNameFromText(fullText, email);
        if (!company) company = extractCompany(fullText);
        if (!title) title = extractJobTitle(fullText);
        if (!phone) phone = extractPhone(fullText, email, userEmails);
        if (!linkedin) linkedin = extractLinkedIn(fullText);
      }
      
      // STEP 4: Final fallback - use domain as company name if nothing else worked
      if (!company && emailDomainHint) {
        // Capitalize first letter
        company = emailDomainHint.charAt(0).toUpperCase() + emailDomainHint.slice(1);
      }
      
      // Validate extracted data to filter out gibberish
      if (company) {
        // Filter out gibberish: if company has too many words or looks like a sentence, it's probably wrong
        const wordCount = company.split(/\s+/).length;
        if (wordCount > 5 || company.length > 50) {
          company = null; // Too long, probably gibberish
        }
        // Filter out common false positives
        const gibberishPatterns = ['modtage', 'late-sale', 'nye placeringer', 'til dig', 'til mig', 'wrote', 'skrev', 'on .+ wrote', 'skrev .+:'];
        if (gibberishPatterns.some(pattern => company.toLowerCase().includes(pattern))) {
          company = null;
        }
      }
      
      if (title) {
        // Filter out gibberish titles
        const wordCount = title.split(/\s+/).length;
        if (wordCount > 8 || title.length > 60) {
          title = null;
        }
      }

      const receivedAt = new Date().toISOString();

      lastInboundEmailSignature = {
        email,
        name,
        company,
        title,
        phone,
        receivedAt
      };

      return {
        email,
        name,
        company,
        title,
        phone,
        receivedAt
      };
    } catch (error) {
      console.error('CRMSYNC: Error detecting inbound email in thread', error);
      return null;
    }
  }

  // Expose detector globally for debugging from the Gmail console
  window.detectLatestInboundEmailInThread = detectLatestInboundEmailInThread;

  /**
   * Observe Gmail conversation views to detect inbound emails and enrich contact data.
   */
  // Debounce inbound email detection to avoid processing same email multiple times
  let lastProcessedInboundEmail = null;
  let inboundEmailDebounceTimer = null;

  function setupInboundEmailObserver() {
    try {
      const observer = new MutationObserver(() => {
        // Debounce: wait 2 seconds after DOM changes before processing
        if (inboundEmailDebounceTimer) {
          clearTimeout(inboundEmailDebounceTimer);
        }

        inboundEmailDebounceTimer = setTimeout(() => {
          // Check if we should track based on labels
          if (!shouldTrackBasedOnLabels()) {
            return;
          }

          const inbound = detectLatestInboundEmailInThread();
          if (inbound && inbound.email) {
            // Avoid processing the same email multiple times
            const emailKey = `${inbound.email}_${inbound.receivedAt}`;
            if (lastProcessedInboundEmail === emailKey) {
              return;
            }
            lastProcessedInboundEmail = emailKey;

            chrome.runtime.sendMessage({
              type: 'INBOUND_EMAIL',
              payload: inbound
            }).catch(error => {
              console.error('CRMSYNC: Error sending INBOUND_EMAIL message', error);
            });
          }
        }, 2000); // 2 second debounce
      });

      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      } else {
        console.warn('CRMSYNC: document.body not ready for inbound observer');
      }
    } catch (error) {
      console.error('CRMSYNC: Error setting up inbound email observer', error);
    }
  }

  /**
   * Extract signature block from email body (usually at the end, after common separators)
   */
  function extractSignatureBlock(bodyText) {
    if (!bodyText) return null;

    // Common signature separators (English and Danish)
    const separators = [
      /^--\s*$/m,
      /^---\s*$/m,
      /^___\s*$/m,
      /^Best regards?/i,
      /^Sincerely?/i,
      /^Thanks?/i,
      /^Regards?/i,
      /^Sent from/i,
      // Danish signature separators
      /^Med venlig hilsen/i,  // Danish "Best regards"
      /^Venlig hilsen/i,      // Danish "Kind regards"
      /^mvh/i,                // Danish "mvh" (med venlig hilsen)
      /^Med venlige hilsner/i // Danish "With kind regards"
    ];

    let signatureStart = -1;
    for (const sep of separators) {
      const match = bodyText.search(sep);
      if (match > 0 && (signatureStart === -1 || match < signatureStart)) {
        signatureStart = match;
      }
    }

    if (signatureStart > 0) {
      const signature = bodyText.substring(signatureStart);
      // Limit signature to last 300 characters (signatures are usually shorter)
      // This prevents including too much body text
      let finalSignature = signature.length > 300 ? signature.substring(signature.length - 300) : signature;
      
      // CRITICAL: Validate that this signature doesn't belong to the user
      // Check for user's own signature patterns (these indicate quoted content)
      const userSignaturePatterns = [
        /Mvh\s+Sebastian/i,
        /Best regards\s+Sebastian/i,
        /Med venlig hilsen\s+Sebastian/i,
        /Sebastian\s+Staal/i,
        /Nordr/i  // User's company name if we can detect it
      ];
      
      for (const pattern of userSignaturePatterns) {
        if (pattern.test(finalSignature)) {
          console.log('CRMSYNC: Rejected signature block (contains user signature):', finalSignature.substring(0, 100));
          // This is the user's signature, not the sender's - return null to use domain fallback
          return null;
        }
      }
      
      return finalSignature;
    }

    // If no separator found, look for signature patterns in the last portion
    // Typical signatures contain: phone numbers, email, job title, company
    const lastPortion = bodyText.substring(Math.max(0, bodyText.length - 400));
    
    // Look for signature indicators (phone, email, title patterns)
    const signatureIndicators = [
      /(?:phone|tel|mobile|m|tlf):\s*\d+/i,
      /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
      /(?:director|manager|head|chief|ceo|cto|cfo|president)/i,
      /(?:inc|llc|ltd|corp|company|co\.)/i
    ];
    
    let hasSignaturePattern = false;
    for (const pattern of signatureIndicators) {
      if (pattern.test(lastPortion)) {
        hasSignaturePattern = true;
        break;
      }
    }
    
    if (hasSignaturePattern) {
      // Limit to 300 characters to avoid including body text
      return lastPortion.substring(Math.max(0, lastPortion.length - 300));
    }

    // Last resort: return last 200 characters (very conservative)
    return bodyText.substring(Math.max(0, bodyText.length - 200));
  }

  // Check for reminders (runs every minute)
  setInterval(() => {
    const now = new Date();
    contacts.forEach(contact => {
      if (contact.followUpDate && new Date(contact.followUpDate) <= now && contact.status !== 'Followed Up') {
        showReminder(contact);
      }
    });
  }, 60000);

  function showReminder(contact) {
    const reminder = document.createElement('div');
    reminder.className = 'reminder-notification';
    reminder.innerHTML = `
      <div class="reminder-content">
        <strong>⏰ Follow-up Reminder</strong>
        <p>Follow up with ${getFullName(contact.firstName, contact.lastName) || contact.email}</p>
        <button class="btn-dismiss" data-email="${contact.email}">Dismiss</button>
      </div>
    `;

    reminder.querySelector('.btn-dismiss').addEventListener('click', async () => {
      contact.status = 'Followed Up';
      await chrome.runtime.sendMessage({ action: 'updateContact', contact });
      reminder.remove();
    });

    document.body.appendChild(reminder);
    setTimeout(() => {
      if (reminder.parentNode) {
        reminder.classList.add('visible');
      }
    }, 10);
    setTimeout(() => reminder.remove(), 10000);
  }

})();
