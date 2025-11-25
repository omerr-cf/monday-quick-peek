@echo off
REM Build script for Monday Quick Peek Chrome Extension (Windows)
REM Creates production-ready package for Chrome Web Store submission

echo 🔨 Building Monday Quick Peek extension...

REM Clean previous build
echo Cleaning previous build...
if exist dist rmdir /s /q dist
if exist monday-quick-peek.zip del monday-quick-peek.zip

REM Create dist directory
echo Creating dist directory...
mkdir dist

REM Copy required files
echo Copying files...
copy manifest.json dist\ >nul
copy popup.html dist\ >nul
xcopy /E /I /Y scripts dist\scripts >nul
xcopy /E /I /Y styles dist\styles >nul
xcopy /E /I /Y icons dist\icons >nul

REM Validate build
echo Validating build...
if not exist "dist\manifest.json" (
  echo ❌ Error: manifest.json not found in dist
  exit /b 1
)

if not exist "dist\scripts" (
  echo ❌ Error: scripts directory not found in dist
  exit /b 1
)

if not exist "dist\icons" (
  echo ❌ Error: icons directory not found in dist
  exit /b 1
)

REM Create ZIP package using PowerShell
echo Creating ZIP package...
powershell -Command "Compress-Archive -Path dist\* -DestinationPath monday-quick-peek.zip -Force" >nul

REM Check ZIP was created
if exist "monday-quick-peek.zip" (
  echo ✅ Build complete!
  echo 📦 Package: monday-quick-peek.zip
  echo 📁 Build directory: dist\
) else (
  echo ❌ Error: Failed to create ZIP package
  exit /b 1
)

echo.
echo 📋 Next steps:
echo 1. Test the extension from dist\ folder
echo 2. Review PRE_SUBMISSION_CHECKLIST.md
echo 3. Upload monday-quick-peek.zip to Chrome Web Store

