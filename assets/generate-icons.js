/**
 * Generate PNG icons from SVG using Node.js
 *
 * Requires: sharp or svg2png
 *
 * Install dependencies:
 *   npm install sharp
 *   OR
 *   npm install svg2png
 */

const fs = require("fs");
const path = require("path");

// Check if sharp is available
let sharp;
try {
  sharp = require("sharp");
} catch (e) {
  console.error("Error: sharp package not found!");
  console.error("Install it with: npm install sharp");
  process.exit(1);
}

const SVG_FILE = path.join(__dirname, "icon-simple.svg");
const OUTPUT_DIR = path.join(__dirname, "..", "icons");

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Icon sizes
const sizes = [16, 48, 128];

async function generateIcons() {
  console.log("Generating Chrome Extension Icons...\n");

  // Read SVG file
  const svgBuffer = fs.readFileSync(SVG_FILE);

  for (const size of sizes) {
    try {
      const outputPath = path.join(OUTPUT_DIR, `icon${size}.png`);

      await sharp(svgBuffer)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated icon${size}.png (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate icon${size}.png:`, error.message);
    }
  }

  console.log("\n✓ All icons generated successfully!");
  console.log(`Icons saved to: ${OUTPUT_DIR}/`);
}

generateIcons().catch(console.error);
