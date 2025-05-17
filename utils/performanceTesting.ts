import { PerformanceObserver } from "perf_hooks"
import { Platform } from "react-native"
import * as FileSystem from "expo-file-system"
import * as Sentry from "@sentry/react-native"
import * as Device from "expo-device"

// Performance thresholds based on PRD requirements
export const PERFORMANCE_THRESHOLDS = {
  APP_LAUNCH_TIME_MS: 3000, // 3 seconds max
  FEED_SCROLL_FPS: 60, // Minimum 60 FPS
  UI_RESPONSE_TIME_MS: 100, // 100ms max
  API_RESPONSE_TIME_MS: 1000, // 1 second max
  RENDER_TIME_MS: 16, // ~60 FPS (16.67ms per frame)
}

// Performance test types
export enum PerformanceTestType {
  APP_LAUNCH = "app_launch",
  FEED_SCROLL = "feed_scroll",
  INTERACTION = "interaction",
  API_CALL = "api_call",
  RENDER = "render",
}

// Test result interface
export interface PerformanceTestResult {
  type: PerformanceTestType
  name: string
  duration: number
  threshold: number
  pass: boolean
  timestamp: string
  device: {
    os: string
    osVersion: string
    model: string
  }
  metadata?: Record<string, any>
}

// Performance metrics storage
type PerformanceMetric = {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  fps?: number
  device?: string
  osVersion?: string
  appVersion?: string
  networkType?: string
  passed?: boolean
  timestamp: Date
}

// In-memory storage for metrics
const metrics: PerformanceMetric[] = []

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  // Set up PerformanceObserver to track React Native performance
  const obs = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    entries.forEach((entry) => {
      Sentry.addBreadcrumb({
        category: "performance",
        message: `${entry.name}: ${entry.duration}ms`,
        level: "info",
      })
    })
  })

  obs.observe({ entryTypes: ["measure"] })

  // Initialize Sentry Performance
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    enableAutoPerformanceTracking: true,
  })

  console.log("Performance monitoring initialized")
}

// Start measuring a performance metric
export const startMeasure = (name: string): string => {
  const transaction = Sentry.startTransaction({
    name,
    op: "performance.test",
  })

  return transaction.traceId
}

// End measuring a performance metric
export const endMeasure = (traceId: string): { duration: number; passed: boolean } => {
  const transaction = Sentry.getTransaction(traceId)
  let duration = 0
  let threshold = 0

  if (transaction) {
    const startTime = transaction.startTimestamp * 1000 // Convert to ms
    const endTime = Date.now()
    duration = endTime - startTime

    // Determine threshold based on transaction name
    if (transaction.name.includes("appLaunch")) {
      threshold = PERFORMANCE_THRESHOLDS.APP_LAUNCH_TIME_MS
    } else if (transaction.name.includes("uiResponse")) {
      threshold = PERFORMANCE_THRESHOLDS.UI_RESPONSE_TIME_MS
    } else if (transaction.name.includes("apiCall")) {
      threshold = PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME_MS
    } else if (transaction.name.includes("render")) {
      threshold = PERFORMANCE_THRESHOLDS.RENDER_TIME_MS
    }

    // Add measurements to transaction
    transaction.setMeasurement("duration", duration, "millisecond")
    transaction.setMeasurement("threshold", threshold, "millisecond")
    transaction.setMeasurement("passed", duration <= threshold ? 1 : 0, "none")

    // Finish transaction
    transaction.finish()
  }

  return {
    duration,
    passed: duration <= threshold,
  }
}

// Run a performance test
export async function runPerformanceTest(
  type: PerformanceTestType,
  name: string,
  testFn: () => Promise<void>,
  metadata: Record<string, any> = {},
  customThreshold?: number,
): Promise<PerformanceTestResult> {
  // Determine threshold
  let threshold: number
  switch (type) {
    case PerformanceTestType.APP_LAUNCH:
      threshold = PERFORMANCE_THRESHOLDS.APP_LAUNCH_TIME_MS
      break
    case PerformanceTestType.FEED_SCROLL:
      threshold = 1000 / PERFORMANCE_THRESHOLDS.FEED_SCROLL_FPS // Convert FPS to ms per frame
      break
    case PerformanceTestType.INTERACTION:
      threshold = PERFORMANCE_THRESHOLDS.UI_RESPONSE_TIME_MS
      break
    case PerformanceTestType.API_CALL:
      threshold = PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME_MS
      break
    case PerformanceTestType.RENDER:
      threshold = PERFORMANCE_THRESHOLDS.RENDER_TIME_MS
      break
  }

  // Use custom threshold if provided
  if (customThreshold !== undefined) {
    threshold = customThreshold
  }

  // Create transaction
  const transaction = Sentry.startTransaction({
    name: `${type}.${name}`,
    op: "performance.test",
  })

  // Add metadata to transaction
  Object.entries(metadata).forEach(([key, value]) => {
    transaction.setData(key, value)
  })

  const startTime = Date.now()
  let error: Error | null = null

  try {
    // Run the test function
    await testFn()
  } catch (e) {
    error = e as Error
    transaction.setData("error", error.message)
  }

  const endTime = Date.now()
  const duration = endTime - startTime
  const pass = !error && duration <= threshold

  // Add measurements to transaction
  transaction.setMeasurement("duration", duration, "millisecond")
  transaction.setMeasurement("threshold", threshold, "millisecond")
  transaction.setMeasurement("passed", pass ? 1 : 0, "none")

  // Finish transaction
  transaction.setStatus(pass ? "ok" : "failed")
  transaction.finish()

  // Create result object
  const result: PerformanceTestResult = {
    type,
    name,
    duration,
    threshold,
    pass,
    timestamp: new Date().toISOString(),
    device: {
      os: Platform.OS,
      osVersion: Platform.Version.toString(),
      model: Device.modelName || "unknown",
    },
    metadata,
  }

  // Save result
  await saveTestResult(result)

  return result
}

// Save test result
async function saveTestResult(result: PerformanceTestResult): Promise<void> {
  try {
    // Create directory if it doesn't exist
    const dirPath = `${FileSystem.documentDirectory}performance_tests/`
    const dirInfo = await FileSystem.getInfoAsync(dirPath)

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true })
    }

    // Save result to file
    const filePath = `${dirPath}${result.type}_${Date.now()}.json`
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(result, null, 2))

    console.log(`Test result saved to ${filePath}`)
  } catch (error) {
    console.error("Failed to save test result:", error)
  }
}

// Save multiple test results
export async function saveTestResults(testType: string, results: any): Promise<void> {
  try {
    // Create directory if it doesn't exist
    const dirPath = `${FileSystem.documentDirectory}performance_tests/`
    const dirInfo = await FileSystem.getInfoAsync(dirPath)

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true })
    }

    // Save results to file
    const filePath = `${dirPath}${testType}_${Date.now()}.json`
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(results, null, 2))

    // Send results to Sentry
    Sentry.addBreadcrumb({
      category: "performance",
      message: `Performance test results for ${testType}`,
      data: {
        testType,
        summary: results.summary,
      },
      level: Sentry.Severity.Info,
    })

    console.log(`Test results saved to ${filePath}`)
  } catch (error) {
    console.error("Failed to save test results:", error)
  }
}

// Measure frame rate
export async function measureFrameRate(durationMs: number): Promise<number> {
  return new Promise((resolve) => {
    let frameCount = 0
    const startTime = Date.now()

    const countFrame = () => {
      const now = Date.now()
      const elapsed = now - startTime

      if (elapsed < durationMs) {
        frameCount++
        requestAnimationFrame(countFrame)
      } else {
        const fps = (frameCount / elapsed) * 1000
        resolve(fps)
      }
    }

    requestAnimationFrame(countFrame)
  })
}

// Measure FPS with callback
export function measureFPS(callback: (fps: number) => void, intervalMs = 1000): () => void {
  let frameCount = 0
  let lastTime = Date.now()
  let animFrameId: number

  const countFrame = () => {
    frameCount++
    const now = Date.now()
    const elapsed = now - lastTime

    if (elapsed >= intervalMs) {
      const fps = (frameCount / elapsed) * 1000
      callback(fps)
      frameCount = 0
      lastTime = now
    }

    animFrameId = requestAnimationFrame(countFrame)
  }

  animFrameId = requestAnimationFrame(countFrame)

  // Return function to stop measuring
  return () => {
    cancelAnimationFrame(animFrameId)
  }
}

// Get all performance metrics
export const getAllMetrics = () => {
  return [...metrics]
}

// Generate performance report
export const generatePerformanceReport = () => {
  const report = {
    summary: {
      totalTests: metrics.length,
      passedTests: metrics.filter((m) => m.passed).length,
      failedTests: metrics.filter((m) => m.passed === false).length,
      averages: {
        appLaunch: calculateAverage("appLaunch"),
        feedScroll: calculateAverage("feedScroll"),
        uiResponse: calculateAverage("uiResponse"),
        videoPlayback: calculateAverage("videoPlayback"),
        apiResponse: calculateAverage("apiResponse"),
      },
    },
    details: metrics,
    timestamp: new Date(),
  }

  return report
}

// Calculate average for a specific metric
const calculateAverage = (metricName: string): number => {
  const relevantMetrics = metrics.filter((m) => m.name === metricName && m.duration !== undefined)

  if (relevantMetrics.length === 0) return 0

  const sum = relevantMetrics.reduce((acc, curr) => acc + (curr.duration || 0), 0)
  return sum / relevantMetrics.length
}
