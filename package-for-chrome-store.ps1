# CRMSYNC - Chrome Web Store Packaging Script
# Run this in PowerShell from the project root

Write-Host "🚀 CRMSYNC Chrome Web Store Package Creator" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Set paths
$projectRoot = "C:\Users\sebas\Downloads\Saas Tool-20251202T124049Z-3-001"
$extensionFolder = Join-Path $projectRoot "Saas Tool"
$outputZip = Join-Path $projectRoot "crmsync-v1.0.0.zip"

# Step 1: Clean up extension folder
Write-Host "STEP 1: Cleaning extension folder..." -ForegroundColor Yellow
cd $extensionFolder

# Remove documentation files
$mdFiles = Get-ChildItem -Path . -Filter *.md
if ($mdFiles.Count -gt 0) {
    Write-Host "  Removing $($mdFiles.Count) .md files..." -ForegroundColor Gray
    $mdFiles | Remove-Item -Force
} else {
    Write-Host "  No .md files to remove" -ForegroundColor Gray
}

# Remove test files
$testFiles = @(
    "debug-signin.html",
    "test-backend.html",
    "sample-data.js",
    "auth-callback.html",
    "auth-callback.js"
)

foreach ($file in $testFiles) {
    if (Test-Path $file) {
        Write-Host "  Removing $file..." -ForegroundColor Gray
        Remove-Item $file -Force
    }
}

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""

# Step 2: Verify required files exist
Write-Host "STEP 2: Verifying required files..." -ForegroundColor Yellow

$requiredFiles = @(
    "manifest.json",
    "background.js",
    "content.js",
    "popup.html",
    "popup.js",
    "icons/icon16.png",
    "icons/icon48.png",
    "icons/icon128.png"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file MISSING!" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "❌ ERROR: Some required files are missing!" -ForegroundColor Red
    Write-Host "Please fix the issues above before packaging." -ForegroundColor Red
    exit 1
}

Write-Host "✅ All required files present!" -ForegroundColor Green
Write-Host ""

# Step 3: Count remaining files
$fileCount = (Get-ChildItem -Path . -Recurse -File).Count
$folderSize = ((Get-ChildItem -Path . -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB)

Write-Host "📊 Extension Stats:" -ForegroundColor Cyan
Write-Host "  Total files: $fileCount" -ForegroundColor Gray
Write-Host "  Total size: $($folderSize.ToString('0.00')) MB" -ForegroundColor Gray
Write-Host ""

# Step 4: Create ZIP package
Write-Host "STEP 3: Creating ZIP package..." -ForegroundColor Yellow

cd $projectRoot

# Remove old ZIP if exists
if (Test-Path $outputZip) {
    Write-Host "  Removing old ZIP..." -ForegroundColor Gray
    Remove-Item $outputZip -Force
}

# Create new ZIP
Write-Host "  Compressing files..." -ForegroundColor Gray
Compress-Archive -Path "$extensionFolder\*" -DestinationPath $outputZip -CompressionLevel Optimal -Force

$zipSize = ((Get-Item $outputZip).Length / 1MB)
Write-Host "✅ ZIP created: crmsync-v1.0.0.zip ($($zipSize.ToString('0.00')) MB)" -ForegroundColor Green
Write-Host ""

# Step 5: Final checks
Write-Host "STEP 4: Final checks..." -ForegroundColor Yellow

if ($zipSize -gt 50) {
    Write-Host "  ⚠️  WARNING: ZIP is over 50MB limit! ($($zipSize.ToString('0.00')) MB)" -ForegroundColor Red
} else {
    Write-Host "  ✓ ZIP size OK ($($zipSize.ToString('0.00')) MB < 50 MB)" -ForegroundColor Green
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ PACKAGE READY FOR SUBMISSION!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Your ZIP file is here:" -ForegroundColor Cyan
Write-Host "   $outputZip" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Take 5 screenshots (see SCREENSHOT-GUIDE.md)" -ForegroundColor Gray
Write-Host "   2. Go to https://chrome.google.com/webstore/devconsole" -ForegroundColor Gray
Write-Host "   3. Upload the ZIP file" -ForegroundColor Gray
Write-Host "   4. Fill out the form (see FINAL-SUBMISSION-CHECKLIST.md)" -ForegroundColor Gray
Write-Host "   5. Submit for review!" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Good luck with your submission!" -ForegroundColor Cyan
