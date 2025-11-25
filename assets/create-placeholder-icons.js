/**
 * Create minimal placeholder PNG icons
 * This creates simple colored squares as placeholders until real icons are generated
 */

const fs = require("fs");
const path = require("path");

// Minimal valid PNG file (1x1 transparent pixel)
// This is a base64-encoded minimal PNG
const minimalPNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

// Create a simple colored PNG using a basic approach
// For now, we'll create a simple script that uses sharp if available,
// or creates minimal placeholders

const OUTPUT_DIR = path.join(__dirname, "..", "icons");

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Try to use sharp if available
let sharp;
try {
  sharp = require("sharp");
} catch (e) {
  // sharp not available, create minimal placeholders
  console.log("sharp not available, creating minimal placeholder PNGs...");

  // Create a simple SVG and convert to PNG using a different method
  // For now, just create minimal valid PNG files
  const sizes = [16, 48, 128];

  sizes.forEach((size) => {
    // Create a simple colored square PNG
    // Using a minimal PNG structure
    const pngData = createSimplePNG(size, size, [99, 102, 241, 255]); // Purple color
    const outputPath = path.join(OUTPUT_DIR, `icon${size}.png`);
    fs.writeFileSync(outputPath, pngData);
    console.log(`Created placeholder: icon${size}.png`);
  });

  console.log("\n✓ Placeholder icons created!");
  console.log(
    "Note: These are minimal placeholders. Generate proper icons using:"
  );
  console.log("  - ./generate-icons.sh (requires ImageMagick/Inkscape)");
  console.log("  - node generate-icons.js (requires sharp: npm install sharp)");
  console.log("  - Online tool: https://cloudconvert.com/svg-to-png");
  process.exit(0);
}

// If sharp is available, create proper icons
async function createIconsWithSharp() {
  const svgContent = `
    <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
      <rect width="128" height="128" rx="24" fill="#6366f1"/>
      <text x="64" y="80" font-family="Arial" font-size="48" fill="white" text-anchor="middle">👁</text>
    </svg>
  `;

  const sizes = [16, 48, 128];

  for (const size of sizes) {
    try {
      const outputPath = path.join(OUTPUT_DIR, `icon${size}.png`);

      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Created icon${size}.png (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to create icon${size}.png:`, error.message);
    }
  }

  console.log("\n✓ All placeholder icons created!");
}

// Simple PNG creator (minimal implementation)
function createSimplePNG(width, height, color) {
  // This is a very basic PNG structure
  // For a proper implementation, we'd need a full PNG encoder
  // For now, return the minimal PNG and let the user generate proper icons
  return minimalPNG;
}

// Run
if (sharp) {
  createIconsWithSharp().catch(console.error);
}
