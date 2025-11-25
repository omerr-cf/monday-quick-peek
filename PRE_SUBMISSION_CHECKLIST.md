# Pre-Submission Checklist

Use this checklist before submitting Monday Quick Peek to the Chrome Web Store.

## 📋 Build & Package

- [ ] Run `npm run build:package` or `./build.sh` successfully
- [ ] Verify `dist/` folder contains all required files
- [ ] Verify `monday-quick-peek.zip` was created
- [ ] Test extension by loading `dist/` folder in Chrome
- [ ] Verify all icons are present and correct sizes (16x16, 48x48, 128x128)

## 🔍 Code Quality

- [ ] All console.logs are appropriate (extensions can have logs for debugging)
- [ ] No hardcoded API keys or sensitive data
- [ ] All TODO comments addressed or documented
- [ ] Error handling is comprehensive
- [ ] No syntax errors or linting issues
- [ ] Code is properly commented

## 📝 Documentation

- [ ] README.md is up to date
- [ ] CHANGELOG.md is complete
- [ ] All features are documented
- [ ] Installation instructions are clear
- [ ] Troubleshooting section is included

## 🎨 Assets

- [ ] Icons are optimized and correct sizes
- [ ] Icons have transparent backgrounds
- [ ] Icons are recognizable at small sizes
- [ ] Screenshots are prepared (if needed for store listing)

## 🧪 Testing

- [ ] Tested on multiple Monday.com boards
- [ ] Tested on different board views (table, kanban, etc.)
- [ ] Tested with tasks that have no notes
- [ ] Tested with tasks that have many notes
- [ ] Tested search functionality
- [ ] Tested error handling (invalid API key, network errors)
- [ ] Tested tooltip positioning on different screen sizes
- [ ] Tested extension reload/reload scenarios
- [ ] Tested on different Chrome versions (if possible)

## 🔐 Security & Privacy

- [ ] No personal data is collected
- [ ] API key is stored securely (Chrome sync storage)
- [ ] No external analytics or tracking
- [ ] Permissions are minimal and justified
- [ ] Privacy policy is prepared (if needed)

## ⚙️ Configuration

- [ ] Version number is correct in `manifest.json`
- [ ] Description is clear and accurate
- [ ] Permissions are correctly declared
- [ ] Host permissions are correct
- [ ] Extension name matches store listing

## 🚀 Performance

- [ ] Extension loads quickly
- [ ] Tooltip appears within 500ms of hover
- [ ] No memory leaks (check with Chrome DevTools)
- [ ] Cache is working correctly
- [ ] Request cancellation is working

## 🐛 Bug Fixes

- [ ] All known bugs are fixed
- [ ] No console errors in normal operation
- [ ] Extension works after Chrome restart
- [ ] Extension works after page reload
- [ ] Extension handles Monday.com updates gracefully

## 📦 Store Listing (Chrome Web Store)

- [ ] Extension name: "Monday Quick Peek"
- [ ] Short description: "Instantly preview Monday.com task notes and comments on hover"
- [ ] Detailed description prepared
- [ ] Category selected
- [ ] Screenshots prepared (1280x800 or 640x400)
- [ ] Promotional images prepared (if needed)
- [ ] Support email/website configured
- [ ] Privacy policy URL (if needed)

## ✅ Final Checks

- [ ] Extension ID is noted (if updating existing extension)
- [ ] All files are included in ZIP
- [ ] ZIP file size is reasonable (< 5MB recommended)
- [ ] No unnecessary files in ZIP
- [ ] Build script works on both Mac and Windows
- [ ] All team members have reviewed

## 📋 Submission Steps

1. **Prepare Store Listing**

   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Create new item or update existing
   - Fill in all required fields

2. **Upload Package**

   - Upload `monday-quick-peek.zip`
   - Wait for review (usually 1-3 business days)

3. **Monitor Submission**
   - Check email for review status
   - Address any reviewer feedback
   - Respond to user reviews

## 🎯 Post-Submission

- [ ] Monitor for user reviews
- [ ] Track error reports
- [ ] Plan for updates based on feedback
- [ ] Update documentation based on user questions

---

## Quick Build Commands

```bash
# Build and package
npm run build:package

# Just build (no package)
npm run build

# Clean build directory
npm run clean

# Validate build
npm run validate
```

## Testing Commands

```bash
# Load extension in Chrome
1. Open chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder
```

---

**Last Updated**: 2024-11-25
**Version**: 1.0.0
