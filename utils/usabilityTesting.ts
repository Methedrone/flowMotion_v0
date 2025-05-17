import { supabase } from "../lib/supabase"

// Usability test types
export enum UsabilityTestType {
  USER_FLOW = "user_flow",
  TASK_COMPLETION = "task_completion",
  ERROR_HANDLING = "error_handling",
  ONBOARDING = "onboarding",
}

// Usability test result interface
export interface UsabilityTestResult {
  testType: UsabilityTestType
  name: string
  pass: boolean
  details: string
  metrics: {
    timeToComplete?: number // in milliseconds
    errorCount?: number
    tapCount?: number
    satisfactionScore?: number // 1-5
  }
  timestamp: string
}

// Run a usability test
export async function runUsabilityTest(
  testType: UsabilityTestType,
  name: string,
  testFn: () => Promise<{
    pass: boolean
    details: string
    metrics: {
      timeToComplete?: number
      errorCount?: number
      tapCount?: number
      satisfactionScore?: number
    }
  }>,
): Promise<UsabilityTestResult> {
  console.log(`Running usability test: ${name}`)

  try {
    // Run the test function
    const testResult = await testFn()

    // Create result object
    const result: UsabilityTestResult = {
      testType,
      name,
      pass: testResult.pass,
      details: testResult.details,
      metrics: testResult.metrics,
      timestamp: new Date().toISOString(),
    }

    // Log result
    console.log(`${result.pass ? "✅" : "❌"} Usability test ${result.pass ? "passed" : "failed"}: ${name}`)
    console.log(`   Details: ${result.details}`)
    console.log(`   Metrics: ${JSON.stringify(result.metrics)}`)

    // Save result to database
    await saveUsabilityTestResult(result)

    return result
  } catch (error) {
    // If an error was thrown, the test failed
    const result: UsabilityTestResult = {
      testType,
      name,
      pass: false,
      details: error.message || "Unknown error",
      metrics: {},
      timestamp: new Date().toISOString(),
    }

    // Log result
    console.error(`❌ Usability test failed with error: ${name}`)
    console.error(`   Error: ${result.details}`)

    // Save result to database
    await saveUsabilityTestResult(result)

    return result
  }
}

// Save usability test result to database
async function saveUsabilityTestResult(result: UsabilityTestResult) {
  try {
    await supabase.from("usability_test_results").insert([
      {
        test_type: result.testType,
        test_name: result.name,
        passed: result.pass,
        details: result.details,
        metrics: result.metrics,
        timestamp: result.timestamp,
      },
    ])
  } catch (error) {
    console.error("Error saving usability test result:", error)
  }
}

// Get all usability test results
export async function getAllUsabilityTestResults(): Promise<UsabilityTestResult[]> {
  try {
    const { data, error } = await supabase
      .from("usability_test_results")
      .select("*")
      .order("timestamp", { ascending: false })

    if (error) throw error

    return (data || []).map((item) => ({
      testType: item.test_type as UsabilityTestType,
      name: item.test_name,
      pass: item.passed,
      details: item.details,
      metrics: item.metrics,
      timestamp: item.timestamp,
    }))
  } catch (error) {
    console.error("Error getting usability test results:", error)
    return []
  }
}

// Generate usability test report
export async function generateUsabilityTestReport(): Promise<Record<string, any>> {
  const allResults = await getAllUsabilityTestResults()

  // Group by test type
  const resultsByType: Record<string, UsabilityTestResult[]> = {}

  for (const result of allResults) {
    if (!resultsByType[result.testType]) {
      resultsByType[result.testType] = []
    }

    resultsByType[result.testType].push(result)
  }

  // Calculate statistics for each test type
  const report: Record<string, any> = {}

  for (const [type, results] of Object.entries(resultsByType)) {
    const passCount = results.filter((r) => r.pass).length
    const failCount = results.length - passCount

    // Calculate average metrics
    const avgTimeToComplete =
      results
        .filter((r) => r.metrics.timeToComplete !== undefined)
        .reduce((sum, r) => sum + (r.metrics.timeToComplete || 0), 0) /
        results.filter((r) => r.metrics.timeToComplete !== undefined).length || 0

    const avgErrorCount =
      results
        .filter((r) => r.metrics.errorCount !== undefined)
        .reduce((sum, r) => sum + (r.metrics.errorCount || 0), 0) /
        results.filter((r) => r.metrics.errorCount !== undefined).length || 0

    const avgTapCount =
      results.filter((r) => r.metrics.tapCount !== undefined).reduce((sum, r) => sum + (r.metrics.tapCount || 0), 0) /
        results.filter((r) => r.metrics.tapCount !== undefined).length || 0

    const avgSatisfactionScore =
      results
        .filter((r) => r.metrics.satisfactionScore !== undefined)
        .reduce((sum, r) => sum + (r.metrics.satisfactionScore || 0), 0) /
        results.filter((r) => r.metrics.satisfactionScore !== undefined).length || 0

    report[type] = {
      totalTests: results.length,
      passCount,
      failCount,
      passRate: results.length > 0 ? (passCount / results.length) * 100 : 0,
      avgTimeToComplete,
      avgErrorCount,
      avgTapCount,
      avgSatisfactionScore,
      latestResults: results.slice(0, 5),
    }
  }

  // Add overall statistics
  const totalTests = allResults.length
  const totalPassCount = allResults.filter((r) => r.pass).length
  const totalFailCount = totalTests - totalPassCount

  report.overall = {
    totalTests,
    passCount: totalPassCount,
    failCount: totalFailCount,
    passRate: totalTests > 0 ? (totalPassCount / totalTests) * 100 : 0,
  }

  return report
}
