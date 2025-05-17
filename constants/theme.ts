// FlowMotion theme configuration based on PRD specifications

export const COLORS = {
  // Gradient colors (from PRD section 5.3)
  gradientStart: "#7C3AED", // Violet/Purple
  gradientMiddle: "#EC4899", // Pink
  gradientEnd: "#F59E0B", // Orange

  // UI colors
  primary: "#EC4899", // Pink as primary action color
  secondary: "#7C3AED", // Purple as secondary color
  accent: "#F59E0B", // Orange as accent color

  // Text colors
  textDark: "#1F2937", // Dark gray for text on light background
  textLight: "#FFFFFF", // White for text on dark/gradient background
  textMuted: "#6B7280", // Muted gray for secondary text

  // Background colors
  backgroundLight: "#FFFFFF", // White background
  backgroundDark: "#000000", // Black background (for video player)
  backgroundMuted: "#F9FAFB", // Light gray for cards, inputs, etc.

  // Status colors
  success: "#059669", // Green for success states
  error: "#EF4444", // Red for error states
  warning: "#F59E0B", // Orange for warning states

  // Border colors
  border: "#E5E7EB", // Light gray for borders
}

export const FONTS = {
  // Main application font (Interface, Story Titles) - PRD section 5.4
  primary: {
    light: "Gilroy-Light", // Will fallback to system font if not available
    regular: "Gilroy-Regular",
    medium: "Gilroy-Medium",
    bold: "Gilroy-Bold",
  },

  // Font for Key Points - PRD section 5.4
  secondary: {
    regular: "serif", // Using system serif font as fallback
    italic: "serif-italic",
  },
}

export const SIZES = {
  // Font sizes
  fontXS: 12,
  fontSM: 14,
  fontMD: 16,
  fontLG: 18,
  fontXL: 20,
  font2XL: 24,
  font3XL: 28,

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Border radius
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20,
    full: 9999,
  },
}

// Gradient configurations for consistent use throughout the app
export const GRADIENTS = {
  primary: {
    colors: [COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
}
