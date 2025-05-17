import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import * as Localization from "expo-localization"

// Import language resources
import en from "./locales/en.json"

// Define available languages
export const AVAILABLE_LANGUAGES = {
  en: "English",
  // Future languages will be added here
  // es: 'Español',
  // fr: 'Français',
  // de: 'Deutsch',
  // ja: '日本語',
}

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    // Future language resources will be added here
  },
  lng: Localization.locale.split("-")[0], // Use device language if available
  fallbackLng: "en", // Fallback to English
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  compatibilityJSON: "v3",
})

export default i18n
