"use client"

import { useEffect, useState } from "react"
import { View, Text, Switch, StyleSheet } from "react-native"
import { registerForPushNotifications } from "../services/pushNotifications"
import { useToast } from "../components/providers/ToastProvider"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabase"
import { captureException } from "../utils/sentry"

export function PushNotificationManager() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()
  const { t } = useTranslation()

  // Check if user has push notifications enabled
  useEffect(() => {
    const checkPushStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data, error } = await supabase
            .from("user_push_tokens")
            .select("push_token")
            .eq("user_id", user.id)
            .single()

          if (data && data.push_token) {
            setIsEnabled(true)
          }
        }
      } catch (error) {
        console.error("Error checking push notification status:", error)
        captureException(error)
      }
    }

    checkPushStatus()
  }, [])

  const togglePushNotifications = async () => {
    setIsLoading(true)

    try {
      if (!isEnabled) {
        // Enable push notifications
        const token = await registerForPushNotifications()

        if (token) {
          setIsEnabled(true)
          showToast({
            type: "success",
            message: t("notifications.enabled_success"),
          })
        } else {
          showToast({
            type: "error",
            message: t("notifications.permission_denied"),
          })
        }
      } else {
        // Disable push notifications
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { error } = await supabase.from("user_push_tokens").delete().eq("user_id", user.id)

          if (!error) {
            setIsEnabled(false)
            showToast({
              type: "success",
              message: t("notifications.disabled_success"),
            })
          }
        }
      }
    } catch (error) {
      console.error("Error toggling push notifications:", error)
      captureException(error)
      showToast({
        type: "error",
        message: t("notifications.toggle_error"),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("notifications.title")}</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={togglePushNotifications}
          value={isEnabled}
          disabled={isLoading}
        />
      </View>

      <Text style={styles.description}>{t("notifications.description")}</Text>

      <Button onPress={togglePushNotifications} loading={isLoading} disabled={isLoading} style={styles.button}>
        {isEnabled ? t("notifications.disable_button") : t("notifications.enable_button")}
      </Button>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  description: {
    marginBottom: 16,
    color: "#666",
  },
  button: {
    marginTop: 8,
  },
})
