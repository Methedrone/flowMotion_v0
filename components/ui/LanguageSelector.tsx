"use client"

import { useState } from "react"
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList } from "react-native"
import { useTranslation } from "react-i18next"
import { COLORS, SIZES } from "../../constants/theme"
import { AVAILABLE_LANGUAGES } from "../../i18n"
import { Ionicons } from "@expo/vector-icons"
import { getAccessibilityProps } from "../../utils/accessibility"

interface LanguageSelectorProps {
  style?: any
}

export default function LanguageSelector({ style }: LanguageSelectorProps) {
  const { i18n } = useTranslation()
  const [modalVisible, setModalVisible] = useState(false)

  const currentLanguage =
    AVAILABLE_LANGUAGES[i18n.language as keyof typeof AVAILABLE_LANGUAGES] || AVAILABLE_LANGUAGES.en

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
    setModalVisible(false)
  }

  const renderLanguageItem = ({ item }: { item: [string, string] }) => {
    const [code, name] = item
    const isSelected = i18n.language === code

    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.selectedLanguageItem]}
        onPress={() => changeLanguage(code)}
        {...getAccessibilityProps({
          label: `${name} language`,
          role: "button",
          state: { selected: isSelected },
        })}
      >
        <Text style={[styles.languageName, isSelected && styles.selectedLanguageName]}>{name}</Text>
        {isSelected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
        {...getAccessibilityProps({
          label: `Change language. Current language is ${currentLanguage}`,
          role: "button",
        })}
      >
        <Ionicons name="language" size={20} color={COLORS.textDark} style={styles.icon} />
        <Text style={styles.buttonText}>{currentLanguage}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                {...getAccessibilityProps({
                  label: "Close language selector",
                  role: "button",
                })}
              >
                <Ionicons name="close" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={Object.entries(AVAILABLE_LANGUAGES)}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item[0]}
              contentContainerStyle={styles.languageList}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {},
  button: {
    flexDirection: "row",
    alignItems: "center",
    padding: SIZES.spacing.sm,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.backgroundMuted,
  },
  icon: {
    marginRight: SIZES.spacing.xs,
  },
  buttonText: {
    fontSize: SIZES.fontSM,
    color: COLORS.textDark,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    maxHeight: "70%",
    backgroundColor: COLORS.backgroundLight,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.spacing.md,
  },
  modalTitle: {
    fontSize: SIZES.fontLG,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  languageList: {
    paddingVertical: SIZES.spacing.sm,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SIZES.spacing.md,
    paddingHorizontal: SIZES.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedLanguageItem: {
    backgroundColor: `${COLORS.primary}10`,
  },
  languageName: {
    fontSize: SIZES.fontMD,
    color: COLORS.textDark,
  },
  selectedLanguageName: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
})
