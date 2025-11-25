# Extension Icons

This directory contains the source SVG icons and scripts to generate PNG icons for the Chrome Extension.

## Icon Design

The icon represents the "quick peek" concept with:

- **Eye symbol**: Represents viewing/peeking
- **Document preview**: Shows the preview functionality
- **Purple gradient**: Matches Monday.com design language (#6366f1 to #8b5cf6)
- **Simple design**: Optimized for small sizes (16x16px)

## Files

- `icon.svg` - Full detail version (best for large sizes)
- `icon-simple.svg` - Simplified version (optimized for small sizes, recommended)
- `generate-icons.sh` - Bash script to generate PNGs (requires ImageMagick or Inkscape)
- `generate-icons.js` - Node.js script to generate PNGs (requires sharp package)

## Generating PNG Icons

### Option 1: Using ImageMagick (Recommended)

**macOS:**

```bash
brew install imagemagick
cd assets
chmod +x generate-icons.sh
./generate-icons.sh
```

**Linux:**

```bash
sudo apt-get install imagemagick
cd assets
chmod +x generate-icons.sh
./generate-icons.sh
```

**Windows (with ImageMagick installed):**

```cmd
cd assets
generate-icons.bat
```

### Option 2: Using Inkscape

**macOS:**

```bash
brew install inkscape
cd assets
chmod +x generate-icons.sh
./generate-icons.sh
```

**Linux:**

```bash
sudo apt-get install inkscape
cd assets
chmod +x generate-icons.sh
./generate-icons.sh
```

### Option 3: Using Node.js (sharp)

```bash
npm install sharp
cd assets
node generate-icons.js
```

### Option 4: Online Tools

If you don't have command-line tools, you can use online SVG to PNG converters:

1. **CloudConvert**: https://cloudconvert.com/svg-to-png

   - Upload `icon-simple.svg`
   - Set sizes: 16x16, 48x48, 128x128
   - Download PNGs

2. **Convertio**: https://convertio.co/svg-png/

   - Upload SVG
   - Set custom dimensions
   - Download

3. **SVG to PNG**: https://svgtopng.com/
   - Upload SVG
   - Set width/height
   - Download

## Required Icon Sizes

The extension requires three PNG icon sizes:

- **16x16px** (`icons/icon16.png`) - Toolbar icon
- **48x48px** (`icons/icon48.png`) - Extension management page
- **128x128px** (`icons/icon128.png`) - Chrome Web Store

## Icon Specifications

- **Format**: PNG with transparency
- **Background**: Transparent
- **Colors**: Purple gradient (#6366f1 to #8b5cf6)
- **Design**: Simple, recognizable at small sizes
- **Style**: Flat design with subtle gradients

## Alternative Icon Designs

If you want to create your own icon:

1. Keep it simple - details get lost at 16x16px
2. Use high contrast - icon should be visible on light and dark backgrounds
3. Test at small sizes - make sure it's recognizable at 16x16px
4. Use the purple color scheme to match the extension
5. Consider the "peek" or "preview" concept

## Icon Ideas

- Eye with document preview (current design)
- Magnifying glass over document
- Lightning bolt with preview window
- Simplified Monday.com logo + peek indicator
- Eye with sparkle/glint effect

## Verification

After generating icons, verify they:

- [ ] Are properly sized (16x16, 48x48, 128x128)
- [ ] Have transparent backgrounds
- [ ] Are recognizable at small sizes
- [ ] Match the extension's color scheme
- [ ] Look good in Chrome toolbar

## Troubleshooting

**Icons look blurry:**

- Make sure you're using the SVG source, not a raster image
- Use vector graphics tools (Inkscape, Illustrator) for best results
- Ensure proper anti-aliasing settings

**Icons don't appear in Chrome:**

- Check file paths in `manifest.json`
- Verify file names match exactly (case-sensitive)
- Clear browser cache and reload extension
- Check file permissions

**Script fails:**

- Ensure ImageMagick/Inkscape/Node.js is installed
- Check file paths are correct
- Verify SVG file is valid
- Check write permissions for output directory
