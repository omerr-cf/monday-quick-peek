# Monday Quick Peek - Development Progress

**Last Updated:** January 11, 2026

---

## 📋 Current Status: ✅ Bug Fixed & Working

The extension is now working! API key validation and tooltip display are functional.

---

## ✅ Completed Tasks

### Session: January 11, 2026

#### 🐛 Critical Bug Fix - API 403 Forbidden Error

**Problem:** Monday.com's Cloudflare was blocking API requests from Chrome extensions because of the `Origin: chrome-extension://...` header.

**Solution:** Added `declarativeNetRequest` to remove the Origin header from API requests.

#### Changes Made

1. **Added declarativeNetRequest** (THE FIX!)

   - Added `declarativeNetRequest` and `declarativeNetRequestWithHostAccess` permissions to manifest
   - Created `rules.json` that removes `Origin` and `Sec-Fetch-*` headers from API requests
   - This makes extension requests look like curl requests, which Monday.com accepts

2. **Updated API Version**

   - Changed from `2023-10` to `2025-10` (old version deprecated Feb 15, 2026)
   - Updated in: `config.js`, `MondayAPI.js`, `service-worker.js`

3. **Centralized API Config**

   - Popup now uses `CONFIG.apiVersion` from `config.js`

4. **Minor Improvements**
   - Added `credentials: "omit"` to fetch calls

#### Files Modified

- `manifest.json` - Added declarativeNetRequest permissions and rule resources
- `rules.json` - **NEW FILE** - Header removal rules for API requests
- `src/config/config.js` - Updated `apiVersion` to `2025-10`
- `src/background/api/MondayAPI.js` - Updated API version, cleaned up code
- `src/background/service-worker.js` - Updated `apiVersion`
- `src/popup/main.js` - Centralized config usage, cleaned up code
- `src/content/api/ContentAPI.js` - Cleaned up (removed unused code)
- `src/content/main.js` - Cleaned up message listener
- `package.json` - Updated build script to copy `rules.json`

---

## 📝 TODO - Before Chrome Web Store Promotion

### Required for Store Listing

- [ ] **Screenshots** - `assets/screenshots/` folder is empty
  - Need 1280x800px main screenshot (required)
  - Should show: tooltip preview, search feature, settings popup
- [ ] Update version in `manifest.json` to `1.2.1` before republish

### Nice to Have

- [ ] Add `author` field in `package.json`
- [ ] Add `repository.url` in `package.json`
- [ ] Create `TESTING.md` (referenced in package.json but doesn't exist)

---

## 🔧 Technical Details

### The Fix Explained

Monday.com's Cloudflare security blocks requests with `Origin: chrome-extension://...` headers. The fix uses Chrome's `declarativeNetRequest` API to modify outgoing request headers:

```json
// rules.json
{
  "action": {
    "type": "modifyHeaders",
    "requestHeaders": [
      { "header": "Origin", "operation": "remove" },
      { "header": "Sec-Fetch-Site", "operation": "remove" },
      { "header": "Sec-Fetch-Mode", "operation": "remove" },
      { "header": "Sec-Fetch-Dest", "operation": "remove" }
    ]
  },
  "condition": {
    "urlFilter": "api.monday.com",
    "resourceTypes": ["xmlhttprequest"]
  }
}
```

This makes the extension's API requests look like regular API calls (similar to curl), which Monday.com accepts.

### Key Files

| File                              | Purpose                       |
| --------------------------------- | ----------------------------- |
| `manifest.json`                   | Extension config, permissions |
| `rules.json`                      | Header modification rules     |
| `src/background/api/MondayAPI.js` | API communication             |
| `src/popup/main.js`               | Settings popup UI             |
| `src/content/main.js`             | Content script for monday.com |

### Monday.com API

- **Endpoint:** `https://api.monday.com/v2`
- **Current Version:** `2025-10` (stable)
- **Auth Header:** `Authorization: <token>` (no "Bearer" prefix)

### Chrome Extension

- **Manifest Version:** 3
- **Current Version:** 1.2.0
- **Key Permissions:** `storage`, `activeTab`, `declarativeNetRequest`, `declarativeNetRequestWithHostAccess`

---

## 📁 Project Structure

```
monday-quick-peek/
├── src/
│   ├── background/       # Service worker & API logic
│   ├── content/          # Content scripts for Monday.com
│   ├── popup/            # Extension popup UI
│   ├── config/           # Centralized configuration
│   ├── shared/           # Shared utilities & services
│   └── styles/           # CSS files
├── dist/                 # Built extension (ready to load)
├── icons/                # Extension icons
├── assets/screenshots/   # Store listing screenshots (EMPTY - needs screenshots!)
├── manifest.json         # Extension manifest v3
├── rules.json            # declarativeNetRequest rules
└── popup.html            # Popup HTML
```

---

## 📞 Notes

- **Why did it break?** Monday.com likely added stricter Cloudflare security rules that block non-standard origins (like `chrome-extension://`).
- **Production impact:** Any published version without this fix will be broken. Must republish!

---

_This file tracks development progress. Update after each session._
