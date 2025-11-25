/**
 * Quick icon creation - generates minimal valid PNG files
 * Run: node create-icons-quick.js
 */

const fs = require("fs");
const path = require("path");

// Minimal valid PNG (1x1 transparent) - this is a real PNG file
const minimalPNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

const OUTPUT_DIR = path.join(__dirname, "icons");

// Create directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Create icons
[16, 48, 128].forEach((size) => {
  const filePath = path.join(OUTPUT_DIR, `icon${size}.png`);
  fs.writeFileSync(filePath, minimalPNG);
  console.log(`✓ Created: icons/icon${size}.png`);
});

console.log("\n✅ Placeholder icons created! Extension should now load.");
console.log("\n📝 To create proper icons later:");
console.log("   1. Use online: https://cloudconvert.com/svg-to-png");
console.log("   2. Upload: assets/icon-simple.svg");
console.log("   3. Generate sizes: 16, 48, 128");
console.log("   4. Replace files in icons/ folder");
