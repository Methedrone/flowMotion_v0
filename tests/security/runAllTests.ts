import { generateSecurityTestReport } from "../../utils/securityTesting"
import { testInvalidCredentials, testPasswordStrength, testUnauthenticatedAccess } from "./authTests"
import { testSqlInjection, testXssInUserInput, testRequiredFieldValidation } from "./dataValidationTests"
import { testCrossUserFavoritesAccess, testCrossUserQuotesAccess, testPremiumContentAccess } from "./crossUserTests"

// Run all security tests
export async function runAllSecurityTests() {
  console.log("=== Running All Security Tests ===")

  // Authentication tests
  await testInvalidCredentials()
  await testPasswordStrength()
  await testUnauthenticatedAccess()

  // Data validation and injection tests
  await testSqlInjection()
  await testXssInUserInput()
  await testRequiredFieldValidation()

  // Cross-user tests
  await testCrossUserFavoritesAccess()
  await testCrossUserQuotesAccess()
  await testPremiumContentAccess()

  // Generate and print report
  const report = await generateSecurityTestReport()
  console.log("\n=== Security Test Report ===")
  console.log(JSON.stringify(report, null, 2))

  return report
}

// If this file is run directly
if (require.main === module) {
  runAllSecurityTests()
    .then(() => console.log("All security tests completed"))
    .catch((error) => console.error("Error running security tests:", error))
}
