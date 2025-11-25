#!/bin/bash
# Generate PNG icons from SVG for Chrome Extension
# Requires: ImageMagick (convert) or Inkscape

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Generating Chrome Extension Icons...${NC}"

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "Using ImageMagick..."
    CONVERT_CMD="convert"
elif command -v magick &> /dev/null; then
    echo "Using ImageMagick (magick command)..."
    CONVERT_CMD="magick"
elif command -v inkscape &> /dev/null; then
    echo "Using Inkscape..."
    USE_INKSCAPE=true
else
    echo "Error: Neither ImageMagick nor Inkscape found!"
    echo "Please install one of them:"
    echo "  - ImageMagick: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)"
    echo "  - Inkscape: brew install inkscape (macOS) or apt-get install inkscape (Linux)"
    exit 1
fi

# Source SVG file (use simple version for better small-size rendering)
SVG_FILE="icon-simple.svg"
OUTPUT_DIR="../icons"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Generate icons
if [ "$USE_INKSCAPE" = true ]; then
    # Using Inkscape
    echo "Generating 16x16 icon..."
    inkscape --export-type=png --export-filename="$OUTPUT_DIR/icon16.png" --export-width=16 --export-height=16 "$SVG_FILE"
    
    echo "Generating 48x48 icon..."
    inkscape --export-type=png --export-filename="$OUTPUT_DIR/icon48.png" --export-width=48 --export-height=48 "$SVG_FILE"
    
    echo "Generating 128x128 icon..."
    inkscape --export-type=png --export-filename="$OUTPUT_DIR/icon128.png" --export-width=128 --export-height=128 "$SVG_FILE"
else
    # Using ImageMagick
    echo "Generating 16x16 icon..."
    $CONVERT_CMD -background none -resize 16x16 "$SVG_FILE" "$OUTPUT_DIR/icon16.png"
    
    echo "Generating 48x48 icon..."
    $CONVERT_CMD -background none -resize 48x48 "$SVG_FILE" "$OUTPUT_DIR/icon48.png"
    
    echo "Generating 128x128 icon..."
    $CONVERT_CMD -background none -resize 128x128 "$SVG_FILE" "$OUTPUT_DIR/icon128.png"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Icons generated successfully!${NC}"
    echo "Icons saved to: $OUTPUT_DIR/"
    ls -lh "$OUTPUT_DIR"/icon*.png
else
    echo "Error: Failed to generate icons"
    exit 1
fi

