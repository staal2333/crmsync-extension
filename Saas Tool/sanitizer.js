// Input Sanitization Utility
// Protects against XSS attacks by sanitizing user-generated content
// NOTE: Only works in contexts with DOM (popup, content scripts) - not in service worker

/**
 * Sanitize HTML content to prevent XSS attacks
 * Converts HTML to plain text
 * @param {string} str - The string to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeHTML(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  // Check if we have document (not in service worker)
  if (typeof document === 'undefined') {
    // Fallback for service worker: basic escaping
    return str.replace(/[<>"'&]/g, (char) => {
      const escapeMap = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
      return escapeMap[char];
    });
  }
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Sanitize and truncate text for display
 * @param {string} str - The string to sanitize
 * @param {number} maxLength - Maximum length (default: 100)
 * @returns {string} - Sanitized and truncated string
 */
function sanitizeAndTruncate(str, maxLength = 100) {
  const sanitized = sanitizeHTML(str);
  if (sanitized.length <= maxLength) {
    return sanitized;
  }
  return sanitized.substring(0, maxLength) + '...';
}

/**
 * Sanitize email address
 * Validates and returns only valid email format
 * @param {string} email - The email to sanitize
 * @returns {string|null} - Sanitized email or null if invalid
 */
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return null;
  }
  
  // Basic email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const trimmed = email.trim().toLowerCase();
  
  if (emailRegex.test(trimmed)) {
    return trimmed;
  }
  
  return null;
}

/**
 * Sanitize phone number
 * Removes all non-digit and non-plus characters
 * @param {string} phone - The phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
function sanitizePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  
  // Keep only digits, plus sign, spaces, hyphens, and parentheses
  return phone.replace(/[^\d\s\-+()\.]/g, '').trim();
}

/**
 * Sanitize URL
 * Ensures URL is safe and uses allowed protocols
 * @param {string} url - The URL to sanitize
 * @returns {string|null} - Sanitized URL or null if unsafe
 */
function sanitizeURL(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  try {
    const parsed = new URL(url);
    
    // Only allow http, https, and mailto protocols
    if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return parsed.href;
    }
    
    return null;
  } catch (error) {
    // Invalid URL
    return null;
  }
}

/**
 * Sanitize object for storage
 * Recursively sanitizes all string values in an object
 * @param {Object} obj - The object to sanitize
 * @returns {Object} - Sanitized object
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    const value = obj[key];
    
    if (typeof value === 'string') {
      // Don't sanitize emails and phone numbers, just validate them
      if (key.toLowerCase().includes('email')) {
        sanitized[key] = sanitizeEmail(value) || value;
      } else if (key.toLowerCase().includes('phone')) {
        sanitized[key] = sanitizePhone(value);
      } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
        sanitized[key] = sanitizeURL(value) || '';
      } else {
        sanitized[key] = sanitizeHTML(value);
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Create a safe text node for DOM insertion
 * @param {string} text - The text to create a node from
 * @returns {Text} - Safe text node
 */
function createSafeTextNode(text) {
  if (typeof document === 'undefined') {
    throw new Error('createSafeTextNode requires DOM (not available in service worker)');
  }
  return document.createTextNode(sanitizeHTML(text));
}

/**
 * Safely set element text content
 * @param {HTMLElement} element - The element to update
 * @param {string} text - The text to set
 */
function setSafeText(element, text) {
  if (!element || !text) return;
  if (typeof document === 'undefined') return;
  element.textContent = sanitizeHTML(text);
}

/**
 * Safely set element HTML content
 * Only allows specific safe tags
 * @param {HTMLElement} element - The element to update
 * @param {string} html - The HTML to set
 * @param {string[]} allowedTags - Array of allowed HTML tags (default: ['b', 'i', 'strong', 'em'])
 */
function setSafeHTML(element, html, allowedTags = ['b', 'i', 'strong', 'em', 'br']) {
  if (!element || !html) return;
  if (typeof document === 'undefined') return;
  
  // Create a temporary div
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Remove all tags except allowed ones
  const walker = document.createTreeWalker(
    temp,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );
  
  const nodesToRemove = [];
  let currentNode;
  
  while (currentNode = walker.nextNode()) {
    if (!allowedTags.includes(currentNode.tagName.toLowerCase())) {
      nodesToRemove.push(currentNode);
    }
  }
  
  // Replace disallowed tags with their text content
  nodesToRemove.forEach(node => {
    const textNode = document.createTextNode(node.textContent);
    node.parentNode.replaceChild(textNode, node);
  });
  
  element.innerHTML = temp.innerHTML;
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.sanitizeHTML = sanitizeHTML;
  window.sanitizeAndTruncate = sanitizeAndTruncate;
  window.sanitizeEmail = sanitizeEmail;
  window.sanitizePhone = sanitizePhone;
  window.sanitizeURL = sanitizeURL;
  window.sanitizeObject = sanitizeObject;
  window.createSafeTextNode = createSafeTextNode;
  window.setSafeText = setSafeText;
  window.setSafeHTML = setSafeHTML;
}
