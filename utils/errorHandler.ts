"use client"

import type React from "react"

import { useToast } from "../components/providers/ToastProvider"
import * as Sentry from "@sentry/react-native"
import { captureException } from "./sentry"

// Error types
export enum ErrorType {
  NETWORK = "network",
  AUTH = "auth",
  VALIDATION = "validation",
  SERVER = "server",
  UNKNOWN = "unknown",
}

// Error interface
export interface AppError {
  type: ErrorType
  message: string
  originalError?: any
}

// Function to create an AppError
export function createError(type: ErrorType, message: string, originalError?: any): AppError {
  return {
    type,
    message,
    originalError,
  }
}

// Function to handle errors
export function handleError(error: any): AppError {
  let appError: AppError

  // Network error
  if (error.message === "Network request failed" || error.message?.includes("network")) {
    appError = createError(
      ErrorType.NETWORK,
      "Network connection error. Please check your internet connection and try again.",
      error,
    )
  }
  // Authentication error
  else if (
    error.status === 401 ||
    error.message?.includes("auth") ||
    error.message?.includes("unauthorized") ||
    error.message?.includes("not authenticated")
  ) {
    appError = createError(ErrorType.AUTH, "Authentication error. Please sign in again.", error)
  }
  // Validation error
  else if (error.status === 400 || error.message?.includes("validation")) {
    appError = createError(
      ErrorType.VALIDATION,
      error.message || "Validation error. Please check your input and try again.",
      error,
    )
  }
  // Server error
  else if (error.status >= 500 || error.message?.includes("server")) {
    appError = createError(ErrorType.SERVER, "Server error. Please try again later.", error)
  }
  // Unknown error
  else {
    appError = createError(ErrorType.UNKNOWN, error.message || "An unexpected error occurred. Please try again.", error)
  }

  // Send error to Sentry
  captureException(error, {
    errorType: appError.type,
    errorMessage: appError.message,
  })

  return appError
}

// Hook to handle errors with toast
export function useErrorHandler() {
  const { showToast } = useToast()

  const handleErrorWithToast = (error: any) => {
    const appError = handleError(error)

    // Show toast based on error type
    switch (appError.type) {
      case ErrorType.NETWORK:
        showToast(appError.message, "warning")
        break
      case ErrorType.AUTH:
        showToast(appError.message, "error")
        break
      case ErrorType.VALIDATION:
        showToast(appError.message, "info")
        break
      case ErrorType.SERVER:
        showToast(appError.message, "error")
        break
      default:
        showToast(appError.message, "error")
    }

    return appError
  }

  return { handleErrorWithToast }
}

// Higher-order component to wrap components with Sentry error boundary
export const withErrorBoundary = (Component: React.ComponentType<any>) => {
  return Sentry.withErrorBoundary(Component, {
    fallback: ({ error, resetError }) => {
      // You could render a custom error UI here
      return (
        <div>
          <h1>Something went wrong</h1>
          <p>{error?.message || "Unknown error"}</p>
          <button onClick={resetError}>Try again</button>
        </div>
      )
    },
  })
}
