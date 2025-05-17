import { registerForPushNotifications, sendLocalNotification } from "../services/pushNotifications"
import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import { Platform } from "react-native"
import { supabase } from "../lib/supabase"
import jest from "jest" // Declare the jest variable

// Mock dependencies
jest.mock("expo-notifications")
jest.mock("expo-device")
jest.mock("../lib/supabase")
jest.mock("../utils/sentry", () => ({
  captureException: jest.fn(),
}))

describe("Push Notifications Service", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Device.isDevice
    ;(Device.isDevice as jest.Mock) = jest.fn().mockReturnValue(true)

    // Mock Notifications.getPermissionsAsync
    ;(Notifications.getPermissionsAsync as jest.Mock) = jest.fn().mockResolvedValue({
      status: "granted",
    })

    // Mock Notifications.getExpoPushTokenAsync
    ;(Notifications.getExpoPushTokenAsync as jest.Mock) = jest.fn().mockResolvedValue({
      data: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    })

    // Mock supabase.auth.getUser
    ;(supabase.auth.getUser as jest.Mock) = jest.fn().mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    })

    // Mock supabase.from().upsert()
    const mockUpsert = jest.fn().mockResolvedValue({ error: null })
    ;(supabase.from as jest.Mock) = jest.fn().mockReturnValue({
      upsert: mockUpsert,
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { push_token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" },
            error: null,
          }),
        }),
      }),
    })

    // Mock Platform.OS
    Platform.OS = "ios"
  })

  describe("registerForPushNotifications", () => {
    it("should register for push notifications and return token", async () => {
      const token = await registerForPushNotifications()

      expect(Device.isDevice).toHaveBeenCalled()
      expect(Notifications.getPermissionsAsync).toHaveBeenCalled()
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled()
      expect(supabase.from).toHaveBeenCalledWith("user_push_tokens")
      expect(token).toBe("ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]")
    })

    it("should request permissions if not granted", async () => {
      // Mock permissions not granted
      ;(Notifications.getPermissionsAsync as jest.Mock) = jest.fn().mockResolvedValue({
        status: "undetermined",
      })

      // Mock request permissions
      ;(Notifications.requestPermissionsAsync as jest.Mock) = jest.fn().mockResolvedValue({
        status: "granted",
      })

      const token = await registerForPushNotifications()

      expect(Notifications.getPermissionsAsync).toHaveBeenCalled()
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled()
      expect(token).toBe("ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]")
    })

    it("should return null if device is not physical", async () => {
      // Mock device is not physical
      ;(Device.isDevice as jest.Mock) = jest.fn().mockReturnValue(false)

      const token = await registerForPushNotifications()

      expect(Device.isDevice).toHaveBeenCalled()
      expect(token).toBeNull()
    })

    it("should return null if permissions are denied", async () => {
      // Mock permissions denied
      ;(Notifications.getPermissionsAsync as jest.Mock) = jest.fn().mockResolvedValue({
        status: "denied",
      })

      // Mock request permissions
      ;(Notifications.requestPermissionsAsync as jest.Mock) = jest.fn().mockResolvedValue({
        status: "denied",
      })

      const token = await registerForPushNotifications()

      expect(Notifications.getPermissionsAsync).toHaveBeenCalled()
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled()
      expect(token).toBeNull()
    })

    it("should configure Android channel if platform is Android", async () => {
      // Mock Platform.OS
      Platform.OS = "android"

      // Mock setNotificationChannelAsync
      ;(Notifications.setNotificationChannelAsync as jest.Mock) = jest.fn().mockResolvedValue({})

      await registerForPushNotifications()

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith("default", expect.any(Object))
    })
  })

  describe("sendLocalNotification", () => {
    it("should send a local notification", async () => {
      // Mock scheduleNotificationAsync
      ;(Notifications.scheduleNotificationAsync as jest.Mock) = jest.fn().mockResolvedValue("notification-id")

      await sendLocalNotification("Test Title", "Test Body", { test: "data" })

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: "Test Title",
          body: "Test Body",
          data: { test: "data" },
        },
        trigger: null,
      })
    })
  })
})
