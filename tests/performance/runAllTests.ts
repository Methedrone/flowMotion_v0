import { initializePerformanceTesting, generatePerformanceReport } from "../../utils/performanceTesting"
import { testAppLaunchTime, testWarmStartTime } from "./appLaunch.test"
import { testFeedScrollPerformance, testFeedItemRenderPerformance } from "./feedScroll.test"
import { testButtonTapResponseTime, testNavigationTransitionTime, testInputResponseTime } from "./uiResponsiveness.test"
import { testVideoPlaybackStartTime, testVideoSeekingPerformance } from "./videoPlayback.test"
import { testStoriesFeedApiPerformance, testKeyPointsApiPerformance } from "./apiPerformance.test"

// Run all performance tests
export async function runAllPerformanceTests() {
  console.log("=== Running All Performance Tests ===")

  // Initialize performance testing
  await initializePerformanceTesting()

  // App launch tests
  await testAppLaunchTime()
  await testWarmStartTime()

  // Feed scroll tests
  await testFeedScrollPerformance()
  await testFeedItemRenderPerformance()

  // UI responsiveness tests
  await testButtonTapResponseTime()
  await testNavigationTransitionTime()
  await testInputResponseTime()

  // Video playback tests
  await testVideoPlaybackStartTime()
  await testVideoSeekingPerformance()

  // API performance tests
  await testStoriesFeedApiPerformance()
  await testKeyPointsApiPerformance()

  // Generate and print report
  const report = await generatePerformanceReport()
  console.log("\n=== Performance Test Report ===")
  console.log(JSON.stringify(report, null, 2))

  return report
}

// If this file is run directly
if (require.main === module) {
  runAllPerformanceTests()
    .then(() => console.log("All performance tests completed"))
    .catch((error) => console.error("Error running performance tests:", error))
}
