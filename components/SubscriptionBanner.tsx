"use client"

import { StyleSheet, View, Text, TouchableOpacity, Alert } from "react-native"
import { supabase } from "../lib/supabase"
import { useState, useEffect } from "react"
import * as Linking from "expo-linking"
import { COLORS, SIZES } from "../constants/theme"
import { trackSubscription } from "../services/analytics"

type Subscription = {
  status: string
  trial_end: string
  current_period_end: string
}

export default function SubscriptionBanner() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscription()

    // Set up a real-time subscription to the subscriptions table
    const subscriptionChannel = supabase
      .channel("subscription-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
        },
        () => {
          fetchSubscription()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscriptionChannel)
    }
  }, [])

  async function fetchSubscription() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status, trial_end, current_period_end")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      setSubscription(data || null)
    } catch (error) {
      console.error("Error fetching subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleSubscribe() {
    Alert.alert("Subscribe", "This will take you to the subscription page", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Continue",
        onPress: async () => {
          try {
            const { data, error } = await supabase.functions.invoke("createCheckoutSession", {
              body: { planId: "monthly" },
            })

            if (error) throw error

            if (data?.url) {
              // Track subscription initiation
              trackSubscription("started", "monthly", { source: "banner" })

              Linking.openURL(data.url)
            }
          } catch (error: any) {
            Alert.alert("Error", error.message)
          }
        },
      },
    ])
  }

  if (loading) {
    return null
  }

  // If user has an active subscription, don't show the banner
  if (subscription?.status === "active") {
    const currentPeriodEnd = new Date(subscription.current_period_end)
    const now = new Date()
    if (currentPeriodEnd > now) {
      return null
    }
  }

  // If user is in trial period
  if (subscription?.status === "trialing") {
    const trialEnd = new Date(subscription.trial_end)
    const now = new Date()
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft > 0) {
      return (
        <View style={styles.trialBanner}>
          <Text style={styles.trialText}>
            {daysLeft} {daysLeft === 1 ? "day" : "days"} left in your free trial
          </Text>
          <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
          </TouchableOpacity>
        </View>
      )
    }
  }

  // Default banner for users without subscription
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>Unlock premium content and features</Text>
      <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
        <Text style={styles.subscribeButtonText}>Subscribe</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.backgroundMuted,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bannerText: {
    fontSize: SIZES.fontSM,
    color: COLORS.textMuted,
    flex: 1,
  },
  trialBanner: {
    backgroundColor: "#FEF3C7",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent,
  },
  trialText: {
    fontSize: SIZES.fontSM,
    color: "#92400E",
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radius.sm,
  },
  subscribeButtonText: {
    color: COLORS.textLight,
    fontWeight: "600",
    fontSize: SIZES.fontXS,
  },
})
