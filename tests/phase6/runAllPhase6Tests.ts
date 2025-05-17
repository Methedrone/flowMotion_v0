import { runAllPerformanceTests } from "../performance/runAllTests"
import { runAllSecurityTests } from "../security/runAllTests"
import { runAllCompatibilityTests } from "../compatibility/runAllTests"
import { runAllUsabilityTests } from "../usability/runAllTests"

// Run all Phase 6 tests
export async function runAllPhase6Tests() {
  console.log("=== Running All Phase 6 Tests ===")

  // Performance tests
  console.log("\n=== Performance Tests ===")
  const performanceResults = await runAllPerformanceTests()

  // Security tests
  console.log("\n=== Security Tests ===")
  const securityResults = await runAllSecurityTests()

  // Compatibility tests
  console.log("\n=== Compatibility Tests ===")
  const compatibilityResults = await runAllCompatibilityTests()

  // Usability tests
  console.log("\n=== Usability Tests ===")
  const usabilityResults = await runAllUsabilityTests()

  // Generate comprehensive report
  const report = {
    performance: performanceResults,
    security: securityResults,
    compatibility: compatibilityResults,
    usability: usabilityResults,
    timestamp: new Date().toISOString(),
  }

  console.log("\n=== Phase 6 Test Summary ===")
  console.log(
    "Performance Tests:",
    performanceResults.overall ? `${performanceResults.overall.passRate.toFixed(2)}% pass rate` : "N/A",
  )
  console.log(
    "Security Tests:",
    securityResults.overall ? `${securityResults.overall.passRate.toFixed(2)}% pass rate` : "N/A",
  )
  console.log(
    "Compatibility Tests:",
    compatibilityResults.report.overall
      ? `${compatibilityResults.report.overall.passRate.toFixed(2)}% pass rate`
      : "N/A",
  )
  console.log(
    "Usability Tests:",
    usabilityResults.overall ? `${usabilityResults.overall.passRate.toFixed(2)}% pass rate` : "N/A",
  )

  return report
}

// If this file is run directly
if (require.main === module) {
  runAllPhase6Tests()
    .then(() => console.log("All Phase 6 tests completed"))
    .catch((error) => console.error("Error running Phase 6 tests:", error))
}
