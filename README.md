# Monday Quick Peek

Instant hover preview for Monday.com notes and comments - shows notes and comments without clicking.

## Description

Monday Quick Peek is a Chrome extension that enhances your Monday.com experience by allowing you to quickly preview notes and comments by simply hovering over them. No more clicking to see what's inside - just hover and peek!

## Features

- 🚀 Instant hover preview for notes and comments
- ⚡ Fast and lightweight
- 🎨 Non-intrusive UI
- 🔒 Works only on Monday.com domains

## Setup Instructions

### Prerequisites

- Google Chrome browser
- Node.js (optional, for future development)

### Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the `monday-quick-peek` folder
6. The extension should now be installed and active

### Development

1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card to reload changes

### Building

```bash
npm run build
```

### Packaging

```bash
npm run package
```

This will create a `monday-quick-peek.zip` file ready for distribution.

## Project Structure

```
monday-quick-peek/
├── icons/          # Extension icons
├── styles/         # CSS files
├── scripts/        # JavaScript files
├── assets/         # Images and mockups
├── manifest.json   # Chrome Extension manifest
├── package.json    # Node.js package configuration
└── README.md       # This file
```

## License

MIT License - see LICENSE file for details
