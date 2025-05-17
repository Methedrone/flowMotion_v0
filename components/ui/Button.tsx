import type React from "react"
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  type TouchableOpacityProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native"
import { COLORS, SIZES } from "../../constants/theme"
import { LinearGradient } from "expo-linear-gradient"

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "gradient"
export type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  gradientColors?: string[]
  gradientStart?: { x: number; y: number }
  gradientEnd?: { x: number; y: number }
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  gradientColors,
  gradientStart,
  gradientEnd,
  disabled,
  ...props
}: ButtonProps) {
  // Determine if we should use a gradient background
  const useGradient = variant === "gradient"

  // Default gradient colors if not provided
  const defaultGradientColors = gradientColors || [COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd]
  const defaultGradientStart = gradientStart || { x: 0, y: 0 }
  const defaultGradientEnd = gradientEnd || { x: 1, y: 1 }

  // Get styles based on variant and size
  const buttonStyle = [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabledButton,
    disabled && styles[`${variant}DisabledButton`],
    style,
  ]

  const textStyleArray = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ]

  // Render button content
  const renderContent = () => (
    <>
      {leftIcon && !loading && <View style={styles.leftIcon}>{leftIcon}</View>}
      {loading ? (
        <ActivityIndicator
          size={size === "sm" ? "small" : "small"}
          color={variant === "outline" || variant === "ghost" ? COLORS.primary : COLORS.textLight}
        />
      ) : (
        <Text style={textStyleArray}>{children}</Text>
      )}
      {rightIcon && !loading && <View style={styles.rightIcon}>{rightIcon}</View>}
    </>
  )

  // Render button with or without gradient
  if (useGradient) {
    return (
      <TouchableOpacity
        style={[styles.button, styles[`${size}Button`], fullWidth && styles.fullWidth, style]}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        <LinearGradient
          colors={defaultGradientColors}
          start={defaultGradientStart}
          end={defaultGradientEnd}
          style={[styles.gradient, disabled && styles.disabledGradient]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity style={buttonStyle} disabled={disabled || loading} activeOpacity={0.8} {...props}>
      {renderContent()}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: SIZES.radius.md,
  },
  fullWidth: {
    width: "100%",
  },
  gradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.spacing.lg,
    width: "100%",
    height: "100%",
  },
  // Variant styles
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  ghostButton: {
    backgroundColor: "transparent",
  },
  gradientButton: {
    backgroundColor: "transparent",
  },
  // Size styles
  smButton: {
    height: 36,
    paddingHorizontal: SIZES.spacing.md,
  },
  mdButton: {
    height: 44,
    paddingHorizontal: SIZES.spacing.lg,
  },
  lgButton: {
    height: 52,
    paddingHorizontal: SIZES.spacing.xl,
  },
  // Text styles
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  primaryText: {
    color: COLORS.textLight,
  },
  secondaryText: {
    color: COLORS.textLight,
  },
  outlineText: {
    color: COLORS.primary,
  },
  ghostText: {
    color: COLORS.primary,
  },
  gradientText: {
    color: COLORS.textLight,
  },
  // Text size styles
  smText: {
    fontSize: SIZES.fontSM,
  },
  mdText: {
    fontSize: SIZES.fontMD,
  },
  lgText: {
    fontSize: SIZES.fontLG,
  },
  // Icon styles
  leftIcon: {
    marginRight: SIZES.spacing.sm,
  },
  rightIcon: {
    marginLeft: SIZES.spacing.sm,
  },
  // Disabled styles
  disabledButton: {
    opacity: 0.6,
  },
  primaryDisabledButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryDisabledButton: {
    backgroundColor: COLORS.secondary,
  },
  outlineDisabledButton: {
    borderColor: COLORS.textMuted,
  },
  ghostDisabledButton: {},
  gradientDisabledButton: {},
  disabledGradient: {
    opacity: 0.6,
  },
  disabledText: {
    color: COLORS.textMuted,
  },
})
