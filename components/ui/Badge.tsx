import { StyleSheet, View, Text, type ViewProps, type StyleProp, type ViewStyle, type TextStyle } from "react-native"
import { COLORS, SIZES } from "../../constants/theme"

type BadgeVariant = "primary" | "secondary" | "success" | "error" | "warning" | "info"
type BadgeSize = "sm" | "md" | "lg"

interface BadgeProps extends ViewProps {
  variant?: BadgeVariant
  size?: BadgeSize
  label: string
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export default function Badge({ variant = "primary", size = "md", label, style, textStyle, ...props }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[`${variant}Badge`], styles[`${size}Badge`], style]} {...props}>
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`], textStyle]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: SIZES.radius.full,
    paddingHorizontal: SIZES.spacing.md,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "600",
  },
  // Variant styles
  primaryBadge: {
    backgroundColor: COLORS.primary,
  },
  secondaryBadge: {
    backgroundColor: COLORS.secondary,
  },
  successBadge: {
    backgroundColor: COLORS.success,
  },
  errorBadge: {
    backgroundColor: COLORS.error,
  },
  warningBadge: {
    backgroundColor: COLORS.warning,
  },
  infoBadge: {
    backgroundColor: COLORS.backgroundMuted,
  },
  // Text colors
  primaryText: {
    color: COLORS.textLight,
  },
  secondaryText: {
    color: COLORS.textLight,
  },
  successText: {
    color: COLORS.textLight,
  },
  errorText: {
    color: COLORS.textLight,
  },
  warningText: {
    color: COLORS.textLight,
  },
  infoText: {
    color: COLORS.textDark,
  },
  // Size styles
  smBadge: {
    paddingVertical: 2,
  },
  mdBadge: {
    paddingVertical: 4,
  },
  lgBadge: {
    paddingVertical: 6,
  },
  // Text sizes
  smText: {
    fontSize: SIZES.fontXS,
  },
  mdText: {
    fontSize: SIZES.fontSM,
  },
  lgText: {
    fontSize: SIZES.fontMD,
  },
})
