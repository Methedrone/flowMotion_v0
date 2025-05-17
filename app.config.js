export default {
  expo: {
    name: "FlowMotion",
    slug: "flowmotion",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.flowmotion.app",
      infoPlist: {
        NSCameraUsageDescription: "FlowMotion needs access to your camera to capture photos for story creation.",
        NSPhotoLibraryUsageDescription:
          "FlowMotion needs access to your photo library to select photos for story creation.",
        NSMicrophoneUsageDescription: "FlowMotion needs access to your microphone to record audio for story creation.",
        UIBackgroundModes: ["remote-notification"],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.flowmotion.app",
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "RECORD_AUDIO",
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED",
      ],
      googleServicesFile: "./google-services.json",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#ffffff",
          sounds: ["./assets/notification-sound.wav"],
        },
      ],
      "sentry-expo",
    ],
    hooks: {
      postPublish: [
        {
          file: "sentry-expo/upload-sourcemaps",
          config: {
            organization: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
          },
        },
      ],
    },
    extra: {
      eas: {
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      },
      sentryDsn: process.env.SENTRY_DSN,
    },
  },
}
