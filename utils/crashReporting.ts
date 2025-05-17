import { captureException } from "./sentry"
import { ErrorUtils, __DEV__ } from "react-native"

// Track unhandled JS exceptions
export function setupUnhandledExceptionTracking() {
  const originalErrorHandler = ErrorUtils.getGlobalHandler()

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Report to Sentry
    captureException(error, {
      level: isFatal ? "fatal" : "error",
    })

    // Call the original handler
    originalErrorHandler(error, isFatal)
  })
}

// Track unhandled promise rejections
export function setupUnhandledPromiseRejectionTracking() {
  const tracking = require("promise/setimmediate/rejection-tracking")

  tracking.enable({
    allRejections: true,
    onUnhandled: (id: string, error: Error) => {
      captureException(error, {
        level: "error",
        extra: {
          promiseId: id,
          unhandledPromiseRejection: true,
        },
      })
    },
    onHandled: () => {},
  })
}

// Test crash reporting (for development only)
export function testCrashReporting() {
  if (__DEV__) {
    // Test JS error
    setTimeout(() => {
      try {
        throw new Error("Test JS error for Sentry")
      } catch (error) {
        captureException(error, {
          extra: {
            testCase: "manual JS error",
          },
        })
      }
    }, 1000)

    // Test unhandled promise rejection
    setTimeout(() => {
      Promise.reject(new Error("Test unhandled promise rejection for Sentry"))
    }, 2000)
  }
}
