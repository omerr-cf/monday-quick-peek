/**
 * Build Validation Script
 * Validates that all required files are present in the build
 */

const fs = require("fs");
const path = require("path");

const DIST_DIR = path.join(__dirname, "..", "dist");

const REQUIRED_FILES = [
  "manifest.json",
  "popup.html",
  "src/background/service-worker.js",
  "src/content/main.js",
  "src/popup/main.js",
  "src/config/config.js",
  "src/shared/services/errorHandler.js",
  "src/shared/services/gumroadAPI.js",
  "src/shared/services/storage.js",
  "src/shared/services/usageTracker.js",
  "src/styles/content/content.css",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
];

const REQUIRED_DIRS = ["src", "icons"];

function validateBuild() {
  console.log("🔍 Validating build...\n");

  let hasErrors = false;

  // Check dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error("❌ Error: dist/ directory does not exist");
    console.error("   Run 'npm run build' first");
    return false;
  }

  // Check required directories
  for (const dir of REQUIRED_DIRS) {
    const dirPath = path.join(DIST_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      console.error(`❌ Error: Required directory missing: ${dir}/`);
      hasErrors = true;
    } else {
      console.log(`✅ Found directory: ${dir}/`);
    }
  }

  // Check required files
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(DIST_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Error: Required file missing: ${file}`);
      hasErrors = true;
    } else {
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024).toFixed(2);
      console.log(`✅ Found file: ${file} (${size} KB)`);
    }
  }

  // Validate manifest.json
  try {
    const manifestPath = path.join(DIST_DIR, "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    console.log(`\n✅ Manifest.json is valid`);
    console.log(`   Name: ${manifest.name}`);
    console.log(`   Version: ${manifest.version}`);
    console.log(`   Manifest Version: ${manifest.manifest_version}`);
  } catch (error) {
    console.error(`❌ Error: manifest.json is invalid: ${error.message}`);
    hasErrors = true;
  }

  // Check for common issues
  console.log("\n🔍 Checking for common issues...");

  // Check for console.logs (informational, not blocking)
  const contentScript = path.join(DIST_DIR, "src", "content", "main.js");
  if (fs.existsSync(contentScript)) {
    const content = fs.readFileSync(contentScript, "utf8");
    const logCount = (content.match(/console\.log/g) || []).length;
    if (logCount > 0) {
      console.log(
        `⚠️  Warning: Found ${logCount} console.log statements (OK for extensions)`
      );
    }
  }

  // Check file sizes
  console.log("\n📊 File sizes:");
  const files = [
    "src/content/main.js",
    "src/background/service-worker.js",
    "src/popup/main.js",
    "src/styles/content/content.css",
  ];
  for (const file of files) {
    const filePath = path.join(DIST_DIR, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024).toFixed(2);
      console.log(`   ${file}: ${size} KB`);
    }
  }

  if (hasErrors) {
    console.error("\n❌ Build validation failed!");
    process.exit(1);
  } else {
    console.log("\n✅ Build validation passed!");
    return true;
  }
}

// Run validation
validateBuild();
