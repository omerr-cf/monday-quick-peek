#!/bin/bash

# Build script for Monday Quick Peek Chrome Extension
# Creates production-ready package for Chrome Web Store submission

set -e  # Exit on error

echo "🔨 Building Monday Quick Peek extension..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Clean previous build
echo -e "${YELLOW}Cleaning previous build...${NC}"
rm -rf dist
rm -f monday-quick-peek.zip

# Create dist directory
echo -e "${YELLOW}Creating dist directory...${NC}"
mkdir -p dist

# Copy required files
echo -e "${YELLOW}Copying files...${NC}"
cp manifest.json dist/
cp popup.html dist/
cp -r src dist/
cp -r icons dist/

# Validate build
echo -e "${YELLOW}Validating build...${NC}"
if [ ! -f "dist/manifest.json" ]; then
  echo -e "${RED}❌ Error: manifest.json not found in dist${NC}"
  exit 1
fi

if [ ! -d "dist/src" ]; then
  echo -e "${RED}❌ Error: src directory not found in dist${NC}"
  exit 1
fi

if [ ! -d "dist/icons" ]; then
  echo -e "${RED}❌ Error: icons directory not found in dist${NC}"
  exit 1
fi

# Create ZIP package
echo -e "${YELLOW}Creating ZIP package...${NC}"
cd dist
zip -r ../monday-quick-peek.zip . -x '*.DS_Store' > /dev/null
cd ..

# Check ZIP was created
if [ -f "monday-quick-peek.zip" ]; then
  SIZE=$(du -h monday-quick-peek.zip | cut -f1)
  echo -e "${GREEN}✅ Build complete!${NC}"
  echo -e "${GREEN}📦 Package: monday-quick-peek.zip (${SIZE})${NC}"
  echo -e "${GREEN}📁 Build directory: dist/${NC}"
else
  echo -e "${RED}❌ Error: Failed to create ZIP package${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Test the extension from dist/ folder"
echo "2. Review PRE_SUBMISSION_CHECKLIST.md"
echo "3. Upload monday-quick-peek.zip to Chrome Web Store"

