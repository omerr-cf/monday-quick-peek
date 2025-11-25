@echo off
REM Generate PNG icons from SVG for Chrome Extension (Windows)
REM Requires: ImageMagick installed and in PATH

echo Generating Chrome Extension Icons...

REM Check if ImageMagick is installed
where magick >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set CONVERT_CMD=magick
    goto :generate
)

where convert >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set CONVERT_CMD=convert
    goto :generate
)

echo Error: ImageMagick not found!
echo Please install ImageMagick from: https://imagemagick.org/script/download.php
echo Make sure to add it to your PATH during installation.
pause
exit /b 1

:generate
set SVG_FILE=icon-simple.svg
set OUTPUT_DIR=..\icons

REM Create output directory if it doesn't exist
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

echo Using %CONVERT_CMD%...
echo.

echo Generating 16x16 icon...
%CONVERT_CMD% -background none -resize 16x16 "%SVG_FILE%" "%OUTPUT_DIR%\icon16.png"
if %ERRORLEVEL% NEQ 0 (
    echo Error generating icon16.png
    pause
    exit /b 1
)

echo Generating 48x48 icon...
%CONVERT_CMD% -background none -resize 48x48 "%SVG_FILE%" "%OUTPUT_DIR%\icon48.png"
if %ERRORLEVEL% NEQ 0 (
    echo Error generating icon48.png
    pause
    exit /b 1
)

echo Generating 128x128 icon...
%CONVERT_CMD% -background none -resize 128x128 "%SVG_FILE%" "%OUTPUT_DIR%\icon128.png"
if %ERRORLEVEL% NEQ 0 (
    echo Error generating icon128.png
    pause
    exit /b 1
)

echo.
echo Icons generated successfully!
echo Icons saved to: %OUTPUT_DIR%\
dir "%OUTPUT_DIR%\icon*.png"
pause

