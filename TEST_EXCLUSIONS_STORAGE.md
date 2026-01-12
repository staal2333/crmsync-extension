# Quick Test - Check if Exclusions Are Saved

## Run this in the WEBSITE console (F12 on crm-sync.net):

```javascript
// After saving exclusions, run this:
chrome.storage.local.get(['userExclusions'], (data) => {
  console.log('✅ User Exclusions in storage:', data.userExclusions);
});

chrome.storage.sync.get(['excludeNames', 'excludeDomains', 'excludePhones'], (data) => {
  console.log('✅ Legacy format:', data);
});
```

## Expected Output:
```
✅ User Exclusions in storage: {
  exclude_name: "Your Name",
  exclude_phone: "+45 12345678",
  exclude_domains: ["@company.com"],
  ...
}

✅ Legacy format: {
  excludeNames: ["Your Name"],
  excludeDomains: ["@company.com"],
  excludePhones: ["+45 12345678"]
}
```

## If you see `undefined`:

The problem is that `chrome.storage` API is not available on the **website**, only in the **extension context**.

### Solution:
The exclusions need to be synced when you open the extension popup AFTER completing onboarding.

Let me fix this properly by:
1. Having the Done page trigger the sync
2. Adding exclusion display to the popup
