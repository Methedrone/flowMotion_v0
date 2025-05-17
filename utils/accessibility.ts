import type React from "react"
import { AccessibilityInfo, Platform } from "react-native"

// Check if screen reader is enabled
export async function isScreenReaderEnabled(): Promise<boolean> {
  return await AccessibilityInfo.isScreenReaderEnabled()
}

// Announce a message to screen readers
export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message)
}

// Get recommended font size scale
export async function getFontScale(): Promise<number> {
  return await AccessibilityInfo.getRecommendedFontSizes().then((sizes) => sizes.large)
}

// Check if reduce motion is enabled
export async function isReduceMotionEnabled(): Promise<boolean> {
  return await AccessibilityInfo.isReduceMotionEnabled()
}

// Check if reduce transparency is enabled (iOS only)
export async function isReduceTransparencyEnabled(): Promise<boolean> {
  if (Platform.OS === "ios") {
    return await AccessibilityInfo.isReduceTransparencyEnabled()
  }
  return false
}

// Generate accessibility props for elements
export function getAccessibilityProps(options: {
  label?: string
  hint?: string
  role?: "none" | "button" | "link" | "search" | "image" | "text" | "adjustable" | "header" | "summary" | "imagebutton"
  state?: {
    disabled?: boolean
    selected?: boolean
    checked?: boolean | "mixed"
    busy?: boolean
    expanded?: boolean
  }
  isModal?: boolean
}) {
  const { label, hint, role, state, isModal } = options

  if (Platform.OS === "ios") {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityRole: role,
      accessibilityState: state,
      accessibilityViewIsModal: isModal,
    }
  } else {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityRole: role,
      accessibilityState: state,
      accessibilityModal: isModal,
    }
  }
}

// Add accessibility focus to an element
export function setAccessibilityFocus(viewRef: React.RefObject<any>): void {
  if (viewRef.current) {
    AccessibilityInfo.isScreenReaderEnabled().then((screenReaderEnabled) => {
      if (screenReaderEnabled) {
        if (Platform.OS === "ios") {
          AccessibilityInfo.setAccessibilityFocus(viewRef.current)
        } else {
          // For Android, we need to use the sendAccessibilityEvent method
          viewRef.current.sendAccessibilityEvent?.(8) // TYPE_VIEW_FOCUSED = 8
        }
      }
    })
  }
}

// Create accessible heading
export function getHeadingProps(level: 1 | 2 | 3 | 4 | 5 | 6) {
  if (Platform.OS === "ios") {
    return {
      accessibilityRole: "header",
      accessibilityTraits: "header",
    }
  } else {
    return {
      accessibilityRole: "heading",
      accessibilityLevel: level,
    }
  }
}
