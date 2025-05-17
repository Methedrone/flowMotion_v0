import { generateCompatibilityTestReport } from "../../utils/compatibilityTesting"
import { runUiCompatibilityTests } from "./uiTests"
import { runMediaCompatibilityTests } from "./mediaTests"
import { runOfflineFunctionalityTests } from "./offlineTests"

// Run all compatibility tests
export async function runAllCompatibilityTests() {
  console.log("=== Running All Compatibility Tests ===")

  // Run UI tests
  const uiResults = await runUiCompatibilityTests()
  console.log(`UI Tests: ${uiResults.testResults.filter((t) => t.pass).length}/${uiResults.testResults.length} passed`)

  // Run media tests
  const mediaResults = await runMediaCompatibilityTests()
  console.log(
    `Media Tests: ${mediaResults.testResults.filter((t) => t.pass).length}/${mediaResults.testResults.length} passed`,
  )

  // Run offline functionality tests
  const offlineResults = await runOfflineFunctionalityTests()
  console.log(
    `Offline Tests: ${offlineResults.testResults.filter((t) => t.pass).length}/${offlineResults.testResults.length} passed`,
  )

  // Generate and print report
  const report = await generateCompatibilityTestReport()
  console.log("\n=== Compatibility Test Report ===")
  console.log(JSON.stringify(report, null, 2))

  return {
    uiResults,
    mediaResults,
    offlineResults,
    report,
  }
}

// If this file is run directly
if (require.main === module) {
  runAllCompatibilityTests()
    .then(() => console.log("All compatibility tests completed"))
    .catch((error) => console.error("Error running compatibility tests:", error))
}
