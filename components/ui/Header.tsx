import type React from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  type ViewProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native"
import { COLORS, SIZES } from "../../constants/theme"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"

interface HeaderProps extends ViewProps {
  title: string
  showBackButton?: boolean
  rightAction?: React.ReactNode
  style?: StyleProp<ViewStyle>
  titleStyle?: StyleProp<TextStyle>
  transparent?: boolean
  onBackPress?: () => void
}

export default function Header({
  title,
  showBackButton = false,
  rightAction,
  style,
  titleStyle,
  transparent = false,
  onBackPress,
  ...props
}: HeaderProps) {
  const navigation = useNavigation()

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress()
    } else {
      navigation.goBack()
    }
  }

  return (
    <View style={[styles.header, transparent ? styles.transparentHeader : styles.solidHeader, style]} {...props}>
      <View style={styles.leftContainer}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="chevron-back" size={24} color={transparent ? COLORS.textLight : COLORS.textDark} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.title, transparent ? styles.lightTitle : styles.darkTitle, titleStyle]} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.rightContainer}>{rightAction || <View style={styles.placeholder} />}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: SIZES.spacing.md,
  },
  solidHeader: {
    backgroundColor: COLORS.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  transparentHeader: {
    backgroundColor: "transparent",
  },
  leftContainer: {
    width: 40,
    alignItems: "flex-start",
  },
  rightContainer: {
    width: 40,
    alignItems: "flex-end",
  },
  title: {
    flex: 1,
    fontSize: SIZES.fontLG,
    fontWeight: "600",
    textAlign: "center",
  },
  lightTitle: {
    color: COLORS.textLight,
  },
  darkTitle: {
    color: COLORS.textDark,
  },
  backButton: {
    padding: 4,
  },
  placeholder: {
    width: 24,
    height: 24,
  },
})
