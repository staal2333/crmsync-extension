# Icon Setup Guide

## Required Icon Files

You need to create 3 PNG files from your CRM SYNC logo:

1. **icon16.png** - 16x16 pixels
2. **icon48.png** - 48x48 pixels  
3. **icon128.png** - 128x128 pixels

## Quick Methods to Create Icons

### Method 1: Online Icon Generator (Easiest)
1. Go to: https://www.favicon-generator.org/ or https://realfavicongenerator.net/
2. Upload your logo image
3. Download the generated icon files
4. Rename and place them in the `icons/` folder

### Method 2: Image Editor (GIMP, Photoshop, Canva)
1. Open your logo in the image editor
2. For each size (16x16, 48x48, 128x128):
   - Create new image with exact dimensions
   - Copy/paste your logo
   - Resize to fit (maintain aspect ratio, center it)
   - Export as PNG
3. Save as `icon16.png`, `icon48.png`, `icon128.png` in the `icons/` folder

### Method 3: Command Line (ImageMagick)
If you have ImageMagick installed:
```bash
# Resize to 16x16
magick your-logo.png -resize 16x16 icons/icon16.png

# Resize to 48x48
magick your-logo.png -resize 48x48 icons/icon48.png

# Resize to 128x128
magick your-logo.png -resize 128x128 icons/icon128.png
```

## Icon Design Tips

Based on your CRM SYNC logo (blue/teal arrows with smiley face):
- ✅ The logo should be clearly visible at 16x16 (may need to simplify)
- ✅ Use high contrast colors (your blue/teal works well)
- ✅ Center the logo in the square
- ✅ Consider adding a subtle background if needed for visibility
- ✅ Test each size to ensure it's recognizable

## File Structure

After creating the icons, your `icons/` folder should look like:
```
icons/
├── icon16.png
├── icon48.png
├── icon128.png
└── README.md
```

## Verification

Once you've added the icon files:
1. Go to `chrome://extensions/`
2. Load your extension (or reload if already loaded)
3. Check that the extension icon appears correctly in:
   - The extensions toolbar
   - The extensions management page
   - The extension popup

If icons don't appear, check:
- File names are exactly: `icon16.png`, `icon48.png`, `icon128.png`
- Files are in the `icons/` folder (not root directory)
- Files are valid PNG format
- Manifest.json paths are correct (`icons/icon16.png`, etc.)

