import * as Application from "expo-application"
import * as Device from "expo-device"
import { Platform } from "react-native"
import { supabase } from "../lib/supabase"
import * as Sentry from "@sentry/react-native"
import { startTransaction } from "../utils/sentry"

// Performance metrics types
export interface PerformanceMetrics {
  appStartTime?: number
  timeToInteractive?: number
  frameRate?: number
  memoryUsage?: number
  batteryLevel?: number
  networkLatency?: number
  apiResponseTime?: Record<string, number>
  renderTime?: Record<string, number>
  deviceInfo?: {
    brand?: string
    modelName?: string
    osName?: string
    osVersion?: string
    appVersion?: string
    memoryTotal?: number
  }
}

// Global performance metrics object
const performanceMetrics: PerformanceMetrics = {}

// Initialize performance monitoring
export function setupPerformanceMonitoring() {
  // Record app start time
  performanceMetrics.appStartTime = Date.now()

  // Start app load transaction
  const appLoadTransaction = startTransaction("app.load", "app.startup")

  // Collect device information
  collectDeviceInfo()

  // Set up frame rate monitoring
  // This would typically use a native module like react-native-performance
  // For this example, we'll just simulate it
  simulateFrameRateMonitoring()

  // Log initial metrics after app is fully loaded
  setTimeout(() => {
    performanceMetrics.timeToInteractive = Date.now() - (performanceMetrics.appStartTime || 0)

    // Finish app load transaction
    if (appLoadTransaction) {
      appLoadTransaction.setMeasurement("time_to_interactive", performanceMetrics.timeToInteractive, "millisecond")
      appLoadTransaction.finish()
    }

    logPerformanceMetrics()
  }, 3000)
}

// Collect device information
async function collectDeviceInfo() {
  try {
    const deviceInfo = {
      brand: Device.brand,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
      appVersion: Application.nativeApplicationVersion,
      memoryTotal: undefined as number | undefined,
    }

    // Additional platform-specific info could be collected here

    performanceMetrics.deviceInfo = deviceInfo
  } catch (error) {
    console.error("Error collecting device info:", error)
  }
}

// Simulate frame rate monitoring
// In a real app, you would use a native module to measure actual frame rates
function simulateFrameRateMonitoring() {
  // Simulate a frame rate between 45-60 FPS
  performanceMetrics.frameRate = Math.floor(Math.random() * 15) + 45

  // Update frame rate periodically
  setInterval(() => {
    performanceMetrics.frameRate = Math.floor(Math.random() * 15) + 45
  }, 5000)
}

// Track API response time
export function trackApiCall(endpoint: string, startTime: number) {
  const endTime = Date.now()
  const responseTime = endTime - startTime

  if (!performanceMetrics.apiResponseTime) {
    performanceMetrics.apiResponseTime = {}
  }

  performanceMetrics.apiResponseTime[endpoint] = responseTime

  // Create Sentry span for API call
  const transaction = Sentry.startTransaction({
    name: `API: ${endpoint}`,
    op: "http.client",
  })

  transaction.setData("endpoint", endpoint)
  transaction.setData("response_time", responseTime)
  transaction.finish()

  // If response time is too high, log it immediately
  if (responseTime > 1000) {
    logPerformanceMetrics({
      apiEndpoint: endpoint,
      responseTime,
    })
  }
}

// Track component render time
export function trackRenderTime(componentName: string, startTime: number) {
  const endTime = Date.now()
  const renderTime = endTime - startTime

  if (!performanceMetrics.renderTime) {
    performanceMetrics.renderTime = {}
  }

  performanceMetrics.renderTime[componentName] = renderTime

  // Create Sentry span for component render
  const transaction = Sentry.startTransaction({
    name: `Render: ${componentName}`,
    op: "ui.render",
  })

  transaction.setData("component", componentName)
  transaction.setData("render_time", renderTime)
  transaction.finish()

  // If render time is too high, log it immediately
  if (renderTime > 100) {
    logPerformanceMetrics({
      component: componentName,
      renderTime,
    })
  }
}

// Log performance metrics to Supabase and Sentry
export async function logPerformanceMetrics(additionalData: Record<string, any> = {}) {
  try {
    const metricsToLog = {
      ...performanceMetrics,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      ...additionalData,
    }

    // Log to Supabase
    await supabase.from("performance_metrics").insert([metricsToLog])

    // Log to Sentry
    Sentry.addBreadcrumb({
      category: "performance",
      message: "Performance metrics logged",
      data: metricsToLog,
      level: Sentry.Severity.Info,
    })

    // If there are any concerning metrics, send them as events
    if (performanceMetrics.frameRate && performanceMetrics.frameRate < 30) {
      Sentry.captureMessage("Low frame rate detected", Sentry.Severity.Warning)
    }

    console.log("Performance metrics logged:", metricsToLog)
  } catch (error) {
    console.error("Error logging performance metrics:", error)
  }
}

// Measure app launch time
export function measureAppLaunchTime() {
  if (performanceMetrics.appStartTime) {
    const launchTime = Date.now() - performanceMetrics.appStartTime
    return launchTime
  }
  return null
}

// Get current performance metrics
export function getCurrentPerformanceMetrics(): PerformanceMetrics {
  return { ...performanceMetrics }
}

// Start measuring a specific operation
export function startMeasuring(operationName: string): string {
  const transaction = Sentry.startTransaction({
    name: operationName,
    op: "measure",
  })

  return transaction.traceId
}

// End measuring a specific operation
export function endMeasuring(traceId: string, success = true): number {
  const transaction = Sentry.getTransaction(traceId)
  if (transaction) {
    transaction.setStatus(success ? "ok" : "internal_error")
    const startTime = transaction.startTimestamp
    transaction.finish()
    return Date.now() - startTime * 1000
  }
  return 0
}
