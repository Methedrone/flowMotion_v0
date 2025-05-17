import * as Application from "expo-application"
import * as Device from "expo-device"
import { Platform } from "react-native"
import { supabase } from "../lib/supabase"

// Analytics event types
export enum AnalyticsEventType {
  // User events
  APP_OPEN = "app_open",
  SIGN_UP = "sign_up",
  SIGN_IN = "sign_in",
  SUBSCRIPTION_STARTED = "subscription_started",
  SUBSCRIPTION_RENEWED = "subscription_renewed",
  SUBSCRIPTION_CANCELED = "subscription_canceled",

  // Content events
  STORY_VIEW = "story_view",
  STORY_COMPLETE = "story_complete",
  STORY_CREATED = "story_created",
  KEY_POINT_VIEW = "key_point_view",
  QUOTE_SAVED = "quote_saved",
  FAVORITE_ADDED = "favorite_added",
  FAVORITE_REMOVED = "favorite_removed",

  // Session events
  SESSION_START = "session_start",
  SESSION_END = "session_end",
}

// Analytics properties interface
export interface AnalyticsProperties {
  [key: string]: string | number | boolean | null | undefined
}

// Device info cache
let deviceInfo: {
  deviceId: string
  deviceModel: string
  osName: string
  osVersion: string
  appVersion: string
} | null = null

// Initialize device info
async function initDeviceInfo() {
  if (deviceInfo) return deviceInfo

  const deviceId = (await Application.getIosIdForVendorAsync()) || Device.deviceName || "unknown"

  deviceInfo = {
    deviceId,
    deviceModel: Device.modelName || "unknown",
    osName: Platform.OS,
    osVersion: Platform.Version.toString(),
    appVersion: Application.nativeApplicationVersion || "1.0.0",
  }

  return deviceInfo
}

// Initialize analytics
export function initializeAnalytics() {
  // Initialize device info
  initDeviceInfo().then(() => {
    console.log("Analytics initialized with device info")
  })
}

// Log analytics event to Supabase
export async function logEvent(eventType: AnalyticsEventType, properties: AnalyticsProperties = {}) {
  try {
    const device = await initDeviceInfo()
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    // Prepare event data
    const eventData = {
      event_type: eventType,
      user_id: userId || null,
      device_id: device.deviceId,
      device_model: device.deviceModel,
      os_name: device.osName,
      os_version: device.osVersion,
      app_version: device.appVersion,
      properties: properties,
      timestamp: new Date().toISOString(),
    }

//
