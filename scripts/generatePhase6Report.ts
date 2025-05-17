import { runAllPhase6Tests } from "../tests/phase6/runAllPhase6Tests"
import * as FileSystem from "expo-file-system"

// Generate Phase 6 report
export async function generatePhase6Report() {
  console.log("Generating Phase 6 report...")

  // Run all Phase 6 tests
  const testResults = await runAllPhase6Tests()

  // Create report object
  const report = {
    title: "FlowMotion Phase 6: Non-Functional Validation Report",
    date: new Date().toISOString(),
    summary: {
      performance: {
        appLaunchTime: testResults.performance.app_launch
          ? {
              average: testResults.performance.app_launch.averageDuration,
              pass: testResults.performance.app_launch.passRate >= 90,
              threshold: "3000ms",
            }
          : "N/A",
        feedScroll: testResults.performance.feed_scroll
          ? {
              averageFps: testResults.performance.feed_scroll.averageDuration,
              pass: testResults.performance.feed_scroll.passRate >= 90,
              threshold: "60 FPS",
            }
          : "N/A",
        uiResponsiveness: testResults.performance.interaction
          ? {
              average: testResults.performance.interaction.averageDuration,
              pass: testResults.performance.interaction.passRate >= 90,
              threshold: "100ms",
            }
          : "N/A",
      },
      security: {
        authentication: testResults.security.authentication
          ? {
              passRate: testResults.security.authentication.passRate,
              pass: testResults.security.authentication.passRate === 100,
            }
          : "N/A",
        authorization: testResults.security.authorization
          ? {
              passRate: testResults.security.authorization.passRate,
              pass: testResults.security.authorization.passRate === 100,
            }
          : "N/A",
        dataValidation: testResults.security.data_validation
          ? {
              passRate: testResults.security.data_validation.passRate,
              pass: testResults.security.data_validation.passRate === 100,
            }
          : "N/A",
        crossUser: testResults.security.cross_user
          ? {
              passRate: testResults.security.cross_user.passRate,
              pass: testResults.security.cross_user.passRate === 100,
            }
          : "N/A",
      },
      compatibility: {
        ios: testResults.compatibility.report.byOS
          ? Object.keys(testResults.compatibility.report.byOS)
              .filter((os) => os.toLowerCase().includes("ios"))
              .map((os) => ({
                version: os,
                passRate: testResults.compatibility.report.byOS[os].passRate,
                pass: testResults.compatibility.report.byOS[os].passRate >= 95,
              }))
          : [],
        android: testResults.compatibility.report.byOS
          ? Object.keys(testResults.compatibility.report.byOS)
              .filter((os) => os.toLowerCase().includes("android"))
              .map((os) => ({
                version: os,
                passRate: testResults.compatibility.report.byOS[os].passRate,
                pass: testResults.compatibility.report.byOS[os].passRate >= 95,
              }))
          : [],
        screenSizes: testResults.compatibility.report.byScreenSize
          ? Object.keys(testResults.compatibility.report.byScreenSize).map((size) => ({
              size,
              passRate: testResults.compatibility.report.byScreenSize[size].passRate,
              pass: testResults.compatibility.report.byScreenSize[size].passRate >= 95,
            }))
          : [],
      },
      usability: {
        userFlows: testResults.usability.user_flow
          ? {
              averageTapCount: testResults.usability.user_flow.avgTapCount,
              satisfactionScore: testResults.usability.user_flow.avgSatisfactionScore,
              pass: testResults.usability.user_flow.passRate >= 90,
            }
          : "N/A",
        taskCompletion: testResults.usability.task_completion
          ? {
              averageTapCount: testResults.usability.task_completion.avgTapCount,
              satisfactionScore: testResults.usability.task_completion.avgSatisfactionScore,
              pass: testResults.usability.task_completion.passRate >= 90,
            }
          : "N/A",
        errorHandling: testResults.usability.error_handling
          ? {
              satisfactionScore: testResults.usability.error_handling.avgSatisfactionScore,
              pass: testResults.usability.error_handling.passRate >= 90,
            }
          : "N/A",
      },
    },
    overallResult: {
      performance: testResults.performance.overall ? testResults.performance.overall.passRate >= 90 : false,
      security: testResults.security.overall ? testResults.security.overall.passRate === 100 : false,
      compatibility: testResults.compatibility.report.overall
        ? testResults.compatibility.report.overall.passRate >= 95
        : false,
      usability: testResults.usability.overall ? testResults.usability.overall.passRate >= 90 : false,
    },
    detailedResults: testResults,
  }

  // Calculate overall pass/fail
  const overallPass =
    report.overallResult.performance &&
    report.overallResult.security &&
    report.overallResult.compatibility &&
    report.overallResult.usability

  report.overallResult.pass = overallPass

  // Save report to file
  const reportJson = JSON.stringify(report, null, 2)
  const reportPath = `${FileSystem.documentDirectory}phase6_report.json`

  await FileSystem.writeAsStringAsync(reportPath, reportJson)

  console.log(`Phase 6 report saved to ${reportPath}`)
  console.log(`Overall result: ${overallPass ? "PASS" : "FAIL"}`)

  return report
}

// If this file is run directly
if (require.main === module) {
  generatePhase6Report()
    .then(() => console.log("Phase 6 report generated successfully"))
    .catch((error) => console.error("Error generating Phase 6 report:", error))
}
