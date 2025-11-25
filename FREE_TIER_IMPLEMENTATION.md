# Free Tier Implementation

## ✅ What Was Implemented

### 1. Usage Tracker (`scripts/usageTracker.js`)
- Tracks daily tooltip views
- Resets automatically at midnight (by date)
- Stores usage in `chrome.storage.local`
- Free tier limit: **10 tooltip views per day**
- Cleans up old usage data (keeps last 7 days)

### 2. Usage Checking
- Checks usage limits before showing tooltip
- Blocks tooltip if daily limit reached
- Shows upgrade prompt when limit hit
- Increments counter only after successful tooltip display

### 3. Free Tier Watermark
- Shows remaining views: "⚡ X free views left today"
- Appears at bottom of tooltip
- Includes "Upgrade to Pro" link
- Updates in real-time as views are used

### 4. Upgrade Prompt
- Beautiful gradient design
- Shows when daily limit is reached
- Lists Pro features
- Direct link to Gumroad purchase page

## 🎯 How It Works

### Flow:
1. User hovers over task row
2. Extension checks: `UsageTracker.canShowTooltip()`
3. **If limit reached**: Shows upgrade prompt
4. **If under limit**: Shows tooltip with watermark
5. After tooltip displays: Increments usage counter
6. Watermark updates with new remaining count

### Storage:
- Usage data stored in `chrome.storage.local`
- Format: `{ "2024-11-25": 5, "2024-11-24": 10 }`
- Automatically cleans up data older than 7 days

## 📊 Usage Limits

- **Free Tier**: 10 tooltip views per day
- **Pro Tier**: Unlimited (when license is active)
- **Reset**: Automatically at midnight (by date)

## 🧪 Testing

### Test Free Tier Limits:
1. Load extension
2. Hover over 10 different tasks
3. On 11th hover, should see upgrade prompt
4. Check watermark shows correct remaining count

### Test Counter Reset:
1. Use all 10 views
2. Wait until next day (or manually change date in storage)
3. Counter should reset to 10

### Test Pro User:
1. Set `licenseStatus: 'active'` in `chrome.storage.local`
2. Hover over tasks - should work unlimited
3. No watermark should appear

## 🔧 Configuration

### Change Free Tier Limit:
Edit `scripts/usageTracker.js`:
```javascript
static FREE_TIER_LIMIT = 10; // Change this number
```

### Gumroad Link:
Update in `scripts/content.js`:
```javascript
window.open('https://gumroad.com/l/monday-quick-peek-pro', '_blank')
```

## 📝 Next Steps (Prompt 18)

- Implement Gumroad license validation
- Add license key input in settings
- Validate license with Gumroad API
- Store license status

## 🎨 UI Elements

### Upgrade Prompt:
- Purple gradient background
- Large rocket emoji
- Clear call-to-action button
- Feature list

### Free Watermark:
- Subtle background at bottom of tooltip
- Shows remaining views
- Upgrade link on right
- Non-intrusive design

---

**Status**: ✅ Complete and ready for testing

