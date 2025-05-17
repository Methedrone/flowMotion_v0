import { StyleSheet, View, type ViewProps, type StyleProp, type ViewStyle } from "react-native"
import { COLORS, SIZES } from "../../constants/theme"

interface CardProps extends ViewProps {
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  elevation?: 0 | 1 | 2 | 3
  bordered?: boolean
}

export default function Card({ children, style, contentStyle, elevation = 1, bordered = false, ...props }: CardProps) {
  return (
    <View style={[styles.card, styles[`elevation${elevation}`], bordered && styles.bordered, style]} {...props}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: SIZES.radius.md,
    overflow: "hidden",
  },
  content: {
    padding: SIZES.spacing.md,
  },
  bordered: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  elevation0: {
    // No shadow
  },
  elevation1: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  elevation2: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  elevation3: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
})
