import * as Sentry from "@sentry/react-native"
import { Platform } from "react-native"
import * as Device from "expo-device"
import Constants from "expo-constants"
import { __DEV__ } from "react-native"

// Initialize Sentry
export function initSentry() {
  try {
    const dsn = process.env.SENTRY_DSN || Constants.expoConfig?.extra?.sentryDsn
    const appVersion = process.env.APP_VERSION || Constants.expoConfig?.version || "1.0.0"

    if (!dsn) {
      console.warn("Sentry DSN not provided. Error tracking will be disabled.")
      return
    }

    Sentry.init({
      dsn,
      debug: __DEV__,
      environment: __DEV__ ? "development" : "production",
      release: appVersion,
      dist: Platform.OS === "ios" ? "ios" : "android",
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,
      tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
      enableNativeCrashHandling: true,
      attachStacktrace: true,
      beforeSend(event) {
        // You can modify or filter events before they are sent to Sentry
        return event
      },
    })

    // Set tags that will be sent with every event
    Sentry.setTag("platform", Platform.OS)
    Sentry.setTag("device_model", Device.modelName || "unknown")
    Sentry.setTag("os_version", Platform.Version.toString())
    Sentry.setTag("app_version", appVersion)

    console.log("Sentry initialized successfully")
  } catch (error) {
    console.error("Failed to initialize Sentry:", error)
  }
}

// Capture exception with additional context
export function captureException(error: any, context?: Record<string, any>) {
  try {
    if (context) {
      Sentry.withScope((scope) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value)
        })
        Sentry.captureException(error)
      })
    } else {
      Sentry.captureException(error)
    }
  } catch (e) {
    console.error("Failed to capture exception in Sentry:", e)
  }
}

// Start performance transaction
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  })
}

// Set breadcrumb
export function addBreadcrumb(category: string, message: string, level: Sentry.Severity = Sentry.Severity.Info) {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
  })
}

// Track screen view
export function trackScreenView(screenName: string) {
  Sentry.addBreadcrumb({
    category: "navigation",
    message: `Viewed ${screenName} screen`,
    level: Sentry.Severity.Info,
  })
}

// Track user action
export function trackUserAction(action: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    category: "user",
    message: action,
    data,
    level: Sentry.Severity.Info,
  })
}

// Track API call
export function trackApiCall(endpoint: string, method: string, status: number, duration: number) {
  Sentry.addBreadcrumb({
    category: "api",
    message: `${method} ${endpoint} - ${status}`,
    data: { duration },
    level: status >= 400 ? Sentry.Severity.Error : Sentry.Severity.Info,
  })

  // If it's an error, capture as a separate event
  if (status >= 400) {
    Sentry.captureMessage(`API Error: ${method} ${endpoint} - ${status}`, Sentry.Severity.Error)
  }
}

// Get Sentry release information
export function getSentryReleaseInfo() {
  return {
    release: Sentry.getCurrentHub().getClient()?.getOptions()?.release,
    environment: Sentry.getCurrentHub().getClient()?.getOptions()?.environment,
  }
}
