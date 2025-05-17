import { initSentry, captureException, startTransaction } from "../utils/sentry"
import { setupNetworkMonitoring } from "../utils/networkMonitoring"
import { setupUnhandledExceptionTracking, setupUnhandledPromiseRejectionTracking } from "../utils/crashReporting"

async function testSentryIntegration() {
  console.log("Testing Sentry integration...")

  // Initialize Sentry
  initSentry()

  // Set up monitoring
  setupNetworkMonitoring()
  setupUnhandledExceptionTracking()
  setupUnhandledPromiseRejectionTracking()

  // Test error capturing
  try {
    throw new Error("Test error for Sentry")
  } catch (error) {
    captureException(error, {
      extra: {
        testCase: "manual error",
      },
    })
    console.log("Captured test error")
  }

  // Test performance monitoring
  const transaction = startTransaction("test.transaction", "test")

  // Simulate some work
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Add some data and finish the transaction
  transaction.setData("test_key", "test_value")
  transaction.finish()
  console.log("Completed test transaction")

  // Test network monitoring
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/todos/1")
    const data = await response.json()
    console.log("Completed test API call:", data.title)
  } catch (error) {
    console.error("API call failed:", error)
  }

  console.log("Sentry integration tests completed")
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSentryIntegration()
    .then(() => console.log("All tests completed successfully"))
    .catch((error) => console.error("Tests failed:", error))
}
