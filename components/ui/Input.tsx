"use client"

import type React from "react"
import { useState } from "react"
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native"
import { COLORS, SIZES } from "../../constants/theme"
import { Ionicons } from "@expo/vector-icons"

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerStyle?: StyleProp<ViewStyle>
  inputStyle?: StyleProp<TextStyle>
  labelStyle?: StyleProp<TextStyle>
  errorStyle?: StyleProp<TextStyle>
  hintStyle?: StyleProp<TextStyle>
  isPassword?: boolean
}

export default function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  hintStyle,
  isPassword = false,
  secureTextEntry,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry)

  const handleFocus = () => setIsFocused(true)
  const handleBlur = () => setIsFocused(false)

  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible)

  // Determine if we should show the password toggle
  const showPasswordToggle = isPassword || secureTextEntry

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      <View
        style={[styles.inputContainer, isFocused && styles.inputContainerFocused, error && styles.inputContainerError]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || showPasswordToggle) && styles.inputWithRightIcon,
            inputStyle,
          ]}
          placeholderTextColor={COLORS.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={showPasswordToggle && !isPasswordVisible}
          {...props}
        />

        {showPasswordToggle ? (
          <TouchableOpacity style={styles.rightIcon} onPress={togglePasswordVisibility}>
            <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : (
          rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>

      {error && <Text style={[styles.error, errorStyle]}>{error}</Text>}
      {hint && !error && <Text style={[styles.hint, hintStyle]}>{hint}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.spacing.md,
  },
  label: {
    fontSize: SIZES.fontSM,
    fontWeight: "500",
    color: COLORS.textDark,
    marginBottom: SIZES.spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.backgroundMuted,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundLight,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: SIZES.spacing.md,
    fontSize: SIZES.fontMD,
    color: COLORS.textDark,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  leftIcon: {
    paddingLeft: SIZES.spacing.md,
  },
  rightIcon: {
    paddingRight: SIZES.spacing.md,
  },
  error: {
    fontSize: SIZES.fontXS,
    color: COLORS.error,
    marginTop: SIZES.spacing.xs,
  },
  hint: {
    fontSize: SIZES.fontXS,
    color: COLORS.textMuted,
    marginTop: SIZES.spacing.xs,
  },
})
