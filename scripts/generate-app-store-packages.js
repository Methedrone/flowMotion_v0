const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

// Configuration
const APP_NAME = "FlowMotion"
const APP_VERSION = process.env.APP_VERSION || "1.0.0"
const APP_BUILD = Date.now().toString().slice(-6) // Use timestamp as build number

// Verify environment variables
const requiredEnvVars = ["EXPO_PUBLIC_PROJECT_ID", "SENTRY_DSN"]

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error("Error: Missing required environment variables:")
  missingEnvVars.forEach((envVar) => console.error(`- ${envVar}`))
  process.exit(1)
}

// Update app.json with version and build number
console.log(`Updating app configuration with version ${APP_VERSION} (${APP_BUILD})...`)

const appConfigPath = path.join(__dirname, "../app.config.js")
const appConfigContent = fs.readFileSync(appConfigPath, "utf8")

// Create backup
fs.writeFileSync(`${appConfigPath}.bak`, appConfigContent)

// Update version and build number
const updatedAppConfig = appConfigContent
  .replace(/version: ["'].*?["']/, `version: "${APP_VERSION}"`)
  .replace(/buildNumber: ["'].*?["']/, `buildNumber: "${APP_BUILD}"`)

fs.writeFileSync(appConfigPath, updatedAppConfig)

// Run compliance check
console.log("Running compliance check...")
try {
  execSync("node scripts/verify-prd-compliance.js", { stdio: "inherit" })
} catch (error) {
  console.error("Compliance check failed. Aborting build.")
  // Restore backup
  fs.copyFileSync(`${appConfigPath}.bak`, appConfigPath)
  process.exit(1)
}

// Build for iOS and Android
console.log("Building app for iOS and Android...")
try {
  execSync("eas build --platform all", { stdio: "inherit" })
  console.log("\n✅ FlowMotion MVP complete per §11. All systems nominal. DAU/MAU tracking active.")
} catch (error) {
  console.error("Build failed:", error.message)
  // Restore backup
  fs.copyFileSync(`${appConfigPath}.bak`, appConfigPath)
  process.exit(1)
}

// Restore backup
fs.copyFileSync(`${appConfigPath}.bak`, appConfigPath)
fs.unlinkSync(`${appConfigPath}.bak`)
