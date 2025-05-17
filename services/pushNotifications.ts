import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import { Platform } from "react-native"
import { supabase } from "../lib/supabase"
import { captureException } from "../utils/sentry"

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

/**
 * Register for push notifications
 * @returns {Promise<string|null>} Push token or null if registration failed
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if device is physical (not simulator/emulator)
    if (!Device.isDevice) {
      console.log("Push Notifications are not available on simulator/emulator")
      return null
    }

    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    // If not granted, request permission
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    // If still not granted, return null
    if (finalStatus !== "granted") {
      console.log("Failed to get push token: permission not granted")
      return null
    }

    // Get push token
    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      })
    ).data

    // Store token in Supabase
    const { error } = await storeUserPushToken(token)
    if (error) {
      console.error("Error storing push token:", error)
      captureException(error)
    }

    // Configure for Android
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      })
    }

    return token
  } catch (error) {
    console.error("Error registering for push notifications:", error)
    captureException(error)
    return null
  }
}

/**
 * Store user push token in Supabase
 * @param {string} token Push token
 * @returns {Promise<{ error: any }>} Result of the operation
 */
async function storeUserPushToken(token: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: new Error("User not authenticated") }
  }

  return await supabase.from("user_push_tokens").upsert(
    {
      user_id: user.id,
      push_token: token,
      device_type: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  )
}

/**
 * Send local notification
 * @param {string} title Notification title
 * @param {string} body Notification body
 * @param {object} data Additional data to include
 */
export async function sendLocalNotification(title: string, body: string, data: Record<string, unknown> = {}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Send immediately
    })
  } catch (error) {
    console.error("Error sending local notification:", error)
    captureException(error)
  }
}

/**
 * Add notification listener
 * @param {Function} callback Function to call when notification is received
 * @returns {Subscription} Subscription to remove the listener
 */
export function addNotificationListener(callback: (notification: Notifications.Notification) => void) {
  return Notifications.addNotificationReceivedListener(callback)
}

/**
 * Add notification response listener
 * @param {Function} callback Function to call when user interacts with notification
 * @returns {Subscription} Subscription to remove the listener
 */
export function addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
  return Notifications.addNotificationResponseReceivedListener(callback)
}
