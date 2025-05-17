import * as Sentry from "@sentry/react-native"
import * as FileSystem from "expo-file-system"
import { Platform } from "react-native"
import Constants from "expo-constants"

type PerformanceMetrics = {
  coldStart?: number
  scrollFPS?: number
  UIResponse?: number
  apiLatency?: number
  memoryUsage?: number
  batteryImpact?: number
  renderTime?: number
  [key: string]: number | undefined
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics = {}
  private startTimes: Record<string, number> = {}
  private logFile: string
  private thresholds: Record<string, number> = {
    coldStart: 3000, // 3 seconds
    scrollFPS: 55, // Minimum acceptable FPS
    UIResponse: 100, // 100ms
    apiLatency: 500, // 500ms
    renderTime: 16, // 16ms (60fps)
  }

  private constructor() {
    this.logFile = `${FileSystem.documentDirectory}performance_logs.json`
    this.initializeLogFile()
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private async initializeLogFile() {
    try {
      const fileExists = await FileSystem.getInfoAsync(this.logFile)
      if (!fileExists.exists) {
        await FileSystem.writeAsStringAsync(this.logFile, JSON.stringify({}))
      }
    } catch (error) {
      Sentry.captureException(error)
    }
  }

  public startMeasurement(name: string): void {
    this.startTimes[name] = Date.now()
  }

  public endMeasurement(name: string): number {
    if (!this.startTimes[name]) {
      console.warn(`No start time found for measurement: ${name}`)
      return 0
    }

    const duration = Date.now() - this.startTimes[name]
    this.metrics[name] = duration

    // Check if the metric exceeds the threshold
    if (this.thresholds[name] && duration > this.thresholds[name]) {
      console.warn(`Performance warning: ${name} took ${duration}ms, exceeding threshold of ${this.thresholds[name]}ms`)

      // Report to Sentry if significantly over threshold
      if (duration > this.thresholds[name] * 1.5) {
        Sentry.captureMessage(`Performance degradation: ${name} took ${duration}ms`, Sentry.Severity.Warning)
      }
    }

    return duration
  }

  public setMetric(name: string, value: number): void {
    this.metrics[name] = value

    // Check if the metric exceeds the threshold
    if (this.thresholds[name] && name !== "scrollFPS") {
      if (value > this.thresholds[name]) {
        console.warn(`Performance warning: ${name} is ${value}, exceeding threshold of ${this.thresholds[name]}`)
      }
    } else if (name === "scrollFPS" && this.thresholds[name]) {
      // For FPS, lower is worse
      if (value < this.thresholds[name]) {
        console.warn(`Performance warning: ${name} is ${value}, below threshold of ${this.thresholds[name]}`)
      }
    }
  }

  public getMetric(name: string): number | undefined {
    return this.metrics[name]
  }

  public getAllMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  public async logMetrics(sessionId?: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString()
      const session = sessionId || `session_${Date.now()}`

      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version,
        model: Platform.OS === "ios" ? "iOS Device" : "Android Device",
        appVersion: Constants.expoConfig?.version || "1.0.0",
      }

      const logEntry = {
        timestamp,
        session,
        metrics: this.metrics,
        device: deviceInfo,
      }

      // Read existing logs
      const fileExists = await FileSystem.getInfoAsync(this.logFile)
      let logs = {}

      if (fileExists.exists) {
        const content = await FileSystem.readAsStringAsync(this.logFile)
        logs = JSON.parse(content)
      }

      // Add new log entry
      logs[timestamp] = logEntry

      // Write back to file
      await FileSystem.writeAsStringAsync(this.logFile, JSON.stringify(logs))

      // Send to Sentry as a breadcrumb
      Sentry.addBreadcrumb({
        category: "performance",
        message: "Performance metrics logged",
        data: this.metrics,
        level: Sentry.Severity.Info,
      })

      console.log("Performance metrics logged:", this.metrics)

      // Reset metrics after logging
      this.metrics = {}
      this.startTimes = {}
    } catch (error) {
      console.error("Error logging performance metrics:", error)
      Sentry.captureException(error)
    }
  }

  public reportPerf(metrics: PerformanceMetrics): void {
    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== undefined) {
        this.setMetric(key, value)
      }
    })

    this.logMetrics()
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// Helper functions
export function startMeasurement(name: string): void {
  performanceMonitor.startMeasurement(name)
}

export function endMeasurement(name: string): number {
  return performanceMonitor.endMeasurement(name)
}

export function reportPerf(metrics: PerformanceMetrics): void {
  performanceMonitor.reportPerf(metrics)
}
