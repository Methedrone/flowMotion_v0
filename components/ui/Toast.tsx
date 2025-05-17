"use client"

import { useEffect, useRef } from "react"
import { StyleSheet, View, Text, Animated, TouchableOpacity, type StyleProp, type ViewStyle } from "react-native"
import { COLORS, SIZES } from "../../constants/theme"
import { Ionicons } from "@expo/vector-icons"
import * as Animations from "../../utils/animations"

type ToastType = "success" | "error" | "warning" | "info"

interface ToastProps {
  visible: boolean
  type?: ToastType
  message: string
  duration?: number
  onClose: () => void
  style?: StyleProp<ViewStyle>
}

export default function Toast({ visible, type = "info", message, duration = 3000, onClose, style }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      // Show toast
      Animations.parallel([
        Animations.translate(translateY, 0, 300, Animations.EASINGS.elastic),
        Animations.fadeIn(opacity, 300),
      ]).start()

      // Hide toast after duration
      const timer = setTimeout(() => {
        hideToast()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [visible])

  const hideToast = () => {
    Animations.parallel([Animations.translate(translateY, -100, 200), Animations.fadeOut(opacity, 200)]).start(() => {
      onClose()
    })
  }

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case "success":
        return "checkmark-circle-outline"
      case "error":
        return "alert-circle-outline"
      case "warning":
        return "warning-outline"
      case "info":
        return "information-circle-outline"
      default:
        return "information-circle-outline"
    }
  }

  if (!visible) return null

  return (
    <Animated.View
      style={[styles.container, styles[`${type}Container`], { transform: [{ translateY }], opacity }, style]}
    >
      <View style={styles.content}>
        <Ionicons name={getIcon()} size={24} color={styles[`${type}Icon`].color} style={styles.icon} />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={hideToast}>
        <Ionicons name="close" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    margin: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SIZES.spacing.md,
    paddingHorizontal: SIZES.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  successContainer: {
    backgroundColor: "#E6F4EA",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  errorContainer: {
    backgroundColor: "#FDEDED",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  warningContainer: {
    backgroundColor: "#FEF7E6",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  infoContainer: {
    backgroundColor: "#E8F4FD",
    borderLeftWidth: 4,
    borderLeftColor: "#0288D1",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: SIZES.spacing.sm,
  },
  successIcon: {
    color: COLORS.success,
  },
  errorIcon: {
    color: COLORS.error,
  },
  warningIcon: {
    color: COLORS.warning,
  },
  infoIcon: {
    color: "#0288D1",
  },
  message: {
    flex: 1,
    fontSize: SIZES.fontSM,
    color: COLORS.textDark,
  },
  closeButton: {
    padding: 4,
  },
})
