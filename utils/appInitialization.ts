import { initializeSentry } from "../utils/sentry"
import { initializeAnalytics } from "../services/analytics"
import { initializeI18n } from "../i18n"
import { initializePerformanceTesting } from "../utils/performanceTesting"
import { __DEV__ } from "../config" // Declare the __DEV__ variable

export const initializeMonitoring = async () => {
  try {
    // Initialize Sentry for error tracking
    initializeSentry()

    // Initialize analytics
    initializeAnalytics()

    // Initialize internationalization
    initializeI18n()

    // Initialize performance testing in development
    if (__DEV__) {
      initializePerformanceTesting()
    }

    console.log("App monitoring initialized successfully")
    return true
  } catch (error) {
    console.error("Failed to initialize app monitoring:", error)
    return false
  }
}
