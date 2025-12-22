// =====================================================
// FRESH INSTALL TEST SCRIPT
// =====================================================
// Run this in the popup console to simulate a fresh install

(async function testFreshInstall() {
  console.log('🧪 SIMULATING FRESH INSTALL...');
  console.log('');
  
  // 1. Clear ALL storage
  console.log('1️⃣ Clearing all storage...');
  await chrome.storage.local.clear();
  await chrome.storage.sync.clear();
  console.log('✅ Storage cleared');
  console.log('');
  
  // 2. Verify storage is empty
  console.log('2️⃣ Verifying storage state...');
  const allData = await chrome.storage.local.get(null);
  console.log('📦 Current storage:', allData);
  console.log('Storage items:', Object.keys(allData).length);
  console.log('');
  
  // 3. Check what would happen
  const { isAuthenticated, isGuest, hasSeenWelcome } = allData;
  console.log('🔍 First-time check values:');
  console.log('  - isAuthenticated:', isAuthenticated, '(', typeof isAuthenticated, ')');
  console.log('  - isGuest:', isGuest, '(', typeof isGuest, ')');
  console.log('  - hasSeenWelcome:', hasSeenWelcome, '(', typeof hasSeenWelcome, ')');
  console.log('');
  
  // 4. Test the condition
  const isFirstTime = !isAuthenticated && !isGuest && !hasSeenWelcome;
  console.log('🎯 Would trigger onboarding?', isFirstTime);
  console.log('');
  
  if (isFirstTime) {
    console.log('✅ SUCCESS! Onboarding WILL open on next popup launch');
    console.log('');
    console.log('📋 Next steps:');
    console.log('  1. Close this popup');
    console.log('  2. Click the extension icon again');
    console.log('  3. Onboarding should open automatically');
  } else {
    console.log('❌ ERROR! Onboarding will NOT open');
    console.log('Check the values above - all should be undefined/falsy');
  }
  console.log('');
  console.log('🔄 To test again: Close popup and reopen');
})();
