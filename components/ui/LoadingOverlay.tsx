import { StyleSheet, View, ActivityIndicator, Text, Modal } from "react-native"
import { COLORS, SIZES } from "../../constants/theme"

interface LoadingOverlayProps {
  visible: boolean
  message?: string
  transparent?: boolean
}

export default function LoadingOverlay({ visible, message = "Loading...", transparent = true }: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.container, transparent && styles.transparentContainer]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  transparentContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.lg,
    alignItems: "center",
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  message: {
    marginTop: SIZES.spacing.md,
    fontSize: SIZES.fontMD,
    color: COLORS.textDark,
    textAlign: "center",
  },
})
