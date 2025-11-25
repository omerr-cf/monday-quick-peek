# Build Guide

Complete guide for building and packaging Monday Quick Peek for Chrome Web Store submission.

## 🚀 Quick Start

```bash
# Build and package (recommended)
npm run build:package

# Or use the shell script
./build.sh

# Or use the batch file (Windows)
build.bat
```

## 📦 Build Process

The build process consists of three main steps:

1. **Clean** - Removes previous build artifacts
2. **Copy** - Copies required files to `dist/` directory
3. **Validate** - Validates that all required files are present

### Build Output

After building, you'll have:

- `dist/` - Directory containing all extension files
- `monday-quick-peek.zip` - ZIP package ready for Chrome Web Store

## 📁 Directory Structure

```
dist/
├── manifest.json
├── popup.html
├── scripts/
│   ├── content.js
│   ├── background.js
│   ├── popup.js
│   ├── errorHandler.js
│   └── storage.js
├── styles/
│   └── content.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🔧 Available Commands

### npm Scripts

```bash
# Build only (creates dist/ folder)
npm run build

# Build and package (creates dist/ and ZIP)
npm run build:package

# Clean build directory
npm run clean

# Copy files to dist/
npm run copy

# Validate build
npm run validate

# Package for Windows (PowerShell)
npm run package:win
```

### Shell Scripts

```bash
# Linux/Mac
./build.sh

# Windows
build.bat
```

## ✅ Validation

The build process includes automatic validation that checks:

- ✅ All required files are present
- ✅ Manifest.json is valid JSON
- ✅ Required directories exist
- ✅ File sizes are reasonable
- ⚠️ Warns about console.log statements (OK for extensions)

## 🧪 Testing the Build

1. **Load extension from dist/**

   ```
   1. Open chrome://extensions/
   2. Enable "Developer mode"
   3. Click "Load unpacked"
   4. Select the dist/ folder
   ```

2. **Test all functionality**

   - See `FINAL_TESTING.md` for complete test checklist

3. **Verify package**
   - Check `monday-quick-peek.zip` was created
   - Verify ZIP contains all required files
   - Check ZIP size is reasonable (< 5MB)

## 📋 Pre-Submission

Before submitting to Chrome Web Store:

1. ✅ Run `npm run build:package`
2. ✅ Test extension from `dist/` folder
3. ✅ Review `PRE_SUBMISSION_CHECKLIST.md`
4. ✅ Complete tests in `FINAL_TESTING.md`
5. ✅ Review `CHANGELOG.md`
6. ✅ Update version in `manifest.json` if needed

## 🚢 Submission

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Create new item or update existing
3. Upload `monday-quick-peek.zip`
4. Fill in store listing details
5. Submit for review

## 🔍 Troubleshooting

### Build fails with "dist/ directory not found"

- Run `npm run clean` first
- Check file permissions

### Validation fails

- Check that all required files exist in source
- Verify manifest.json is valid JSON
- Check file paths are correct

### ZIP not created

- Check disk space
- Verify write permissions
- On Windows, ensure PowerShell is available

### Extension doesn't load

- Check Chrome console for errors
- Verify all files are in dist/
- Check manifest.json is valid

## 📝 Notes

- **Console.logs**: Extensions can have console.logs for debugging. They're not removed in production builds.
- **Minification**: JavaScript and CSS are not minified by default (optional for extensions).
- **Source Maps**: Not included in production build (not needed for extensions).

## 🎯 Best Practices

1. **Always test** the build before submitting
2. **Version bump** in manifest.json for each release
3. **Update CHANGELOG.md** with each release
4. **Review PRE_SUBMISSION_CHECKLIST.md** before submitting
5. **Keep build scripts** simple and maintainable

---

**Last Updated**: 2024-11-25
