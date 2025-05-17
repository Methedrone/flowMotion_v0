import * as Sentry from "@sentry/react-native"
import { trackApiCall } from "../utils/sentry"

// Intercept and monitor fetch requests
export function setupNetworkMonitoring() {
  const originalFetch = global.fetch

  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.url
    const method = init?.method || "GET"

    // Start timing
    const startTime = Date.now()

    // Create a transaction for this request
    const transaction = Sentry.startTransaction({
      name: `${method} ${url}`,
      op: "http.client",
    })

    try {
      // Make the actual request
      const response = await originalFetch(input, init)

      // Calculate duration
      const duration = Date.now() - startTime

      // Track the API call
      trackApiCall(url, method, response.status, duration)

      // Add response info to transaction
      transaction.setData("status_code", response.status)
      transaction.setData("duration", duration)

      // Finish transaction
      transaction.setStatus(response.ok ? "ok" : "failed")
      transaction.finish()

      return response
    } catch (error) {
      // Calculate duration
      const duration = Date.now() - startTime

      // Add error info to transaction
      transaction.setData("error", error)
      transaction.setData("duration", duration)

      // Finish transaction with error status
      transaction.setStatus("internal_error")
      transaction.finish()

      // Capture the error
      Sentry.captureException(error, {
        tags: {
          url,
          method,
        },
        extra: {
          duration,
        },
      })

      throw error
    }
  }
}

// Monitor XMLHttpRequest if needed
export function setupXHRMonitoring() {
  const originalOpen = XMLHttpRequest.prototype.open
  const originalSend = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.open = function (method: string, url: string) {
    this._sentryUrl = url
    this._sentryMethod = method
    this._sentryStartTime = Date.now()

    return originalOpen.apply(this, arguments as any)
  }

  XMLHttpRequest.prototype.send = function () {
    

    // Create a transaction for this request
    const transaction = Sentry.startTransaction({
      name: `${this._sentryMethod} ${this._sentryUrl}`,
      op: "http.client",
    })

    this.addEventListener("load", () => {
      const duration = Date.now() - this._sentryStartTime

      // Track the API call
      trackApiCall(this._sentryUrl, this._sentryMethod, this.status, duration)

      // Add response info to transaction
      transaction.setData("status_code", this.status)
      transaction.setData("duration", duration)

      // Finish transaction
      transaction.setStatus(this.status < 400 ? "ok" : "failed")
      transaction.finish()
    })

    this.addEventListener("error", () => {
      const duration = Date.now() - this._sentryStartTime

      // Add error info to transaction
      transaction.setData("error", "Network error")
      transaction.setData("duration", duration)

      // Finish transaction with error status
      transaction.setStatus("internal_error")
      transaction.finish()

      // Capture the error
      Sentry.captureMessage(`XHR Error: ${this._sentryMethod} ${this._sentryUrl}`, Sentry.Severity.Error)
    })

    return originalSend.apply(this, arguments as any)
  }
}
