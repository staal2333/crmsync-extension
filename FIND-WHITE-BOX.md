# 🔍 White Box Overlay - Diagnostic Script

## Run This in Popup Console

Right-click popup → Inspect → Console → Paste this:

```javascript
// Find all elements that might be covering the content
const allElements = document.querySelectorAll('*');
const potentialCulprits = [];

allElements.forEach(el => {
  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  
  // Check for elements that:
  // 1. Are positioned absolutely/fixed
  // 2. Have high z-index
  // 3. Cover a large area
  // 4. Have white/light background
  
  if (
    (style.position === 'fixed' || style.position === 'absolute') &&
    rect.width > 300 &&
    rect.height > 300 &&
    (style.backgroundColor.includes('255') || style.backgroundColor.includes('white'))
  ) {
    potentialCulprits.push({
      element: el,
      tagName: el.tagName,
      className: el.className,
      id: el.id,
      position: style.position,
      zIndex: style.zIndex,
      width: rect.width,
      height: rect.height,
      background: style.backgroundColor,
      display: style.display
    });
  }
});

console.log('🎯 Found potential overlay elements:', potentialCulprits);

// Highlight them with red border
potentialCulprits.forEach(item => {
  item.element.style.border = '3px solid red';
});

// Try hiding them one by one
potentialCulprits.forEach((item, index) => {
  console.log(`Element ${index + 1}:`, item);
});

// Quick fix: Try hiding all modals/overlays
document.querySelectorAll('[id*="modal"], [id*="Modal"], [class*="modal"], [class*="overlay"]').forEach(el => {
  console.log('Found modal/overlay:', el.id || el.className);
  el.style.display = 'none';
});

console.log('✅ Hidden all modals - Check if popup is visible now');
```

---

## Quick Fix to Test

Paste this in console to remove ALL overlays:

```javascript
// Nuclear option: Remove all fixed/absolute positioned white boxes
document.querySelectorAll('*').forEach(el => {
  const style = window.getComputedStyle(el);
  if ((style.position === 'fixed' || style.position === 'absolute') && 
      style.backgroundColor.includes('255')) {
    console.log('Removing:', el.className || el.id || el.tagName);
    el.remove();
  }
});
```

---

## What to Look For

After running the script, tell me:
1. **What elements were found** in `potentialCulprits`?
2. **Did hiding modals reveal the content**?
3. **Can you now see contacts/empty state**?

---

This will identify exactly what's blocking the view!
