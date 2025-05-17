import { generateUsabilityTestReport } from "../../utils/usabilityTesting"
import { testSignUpFlow, testFeedBrowsingFlow, testVideoPlaybackFlow } from "./userFlowTests"
import { testSaveQuoteTask, testSubscribeTask, testCreateStoryTask } from "./taskCompletionTests"
import {
  testNetworkErrorHandling,
  testFormValidationErrorHandling,
  testVideoPlaybackErrorHandling,
} from "./errorHandlingTests"

// Run all usability tests
export async function runAllUsabilityTests() {
  console.log("=== Running All Usability Tests ===")

  // User flow tests
  await testSignUpFlow()
  await testFeedBrowsingFlow()
  await testVideoPlaybackFlow()

  // Task completion tests
  await testSaveQuoteTask()
  await testSubscribeTask()
  await testCreateStoryTask()

  // Error handling tests
  await testNetworkErrorHandling()
  await testFormValidationErrorHandling()
  await testVideoPlaybackErrorHandling()

  // Generate and print report
  const report = await generateUsabilityTestReport()
  console.log("\n=== Usability Test Report ===")
  console.log(JSON.stringify(report, null, 2))

  return report
}

// If this file is run directly
if (require.main === module) {
  runAllUsabilityTests()
    .then(() => console.log("All usability tests completed"))
    .catch((error) => console.error("Error running usability tests:", error))
}
