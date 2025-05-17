"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { supabase } from "../../lib/supabase"
import { Button } from "../../components/ui/Button"
import { Card } from "../../components/ui/Card"
import Badge from "../../components/ui/Badge"
import Header from "../../components/ui/Header"
import { useToast } from "../../components/providers/ToastProvider"
import { useLoading } from "../../components/providers/LoadingProvider"
import SubscriptionBanner from "../../components/SubscriptionBanner"
import PushNotificationManager from "../../components/PushNotificationManager"
import LanguageSelector from "../../components/ui/LanguageSelector"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { captureException } from "../../utils/sentry"
import { sendLocalNotification } from "../../services/pushNotifications"

// Types
interface UserProfile {
  id: string
  email: string
  username: string
  created_at: string
}

interface Subscription {
  id: string
  status: string
  current_period_end: string
  trial_end: string | null
}

interface UserStats {
  total_stories: number
  total_views: number
}

// Fetch user subscription
const fetchSubscription = async (): Promise<Subscription | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single()

  if (error) {
    console.error("Error fetching subscription:", error)
    captureException(error)
    return null
  }

  return data
}

// Fetch user stats
const fetchUserStats = async (): Promise<UserStats> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { total_stories: 0, total_views: 0 }
  }

  const { data, error } = await supabase.from("user_stats").select("*").eq("user_id", user.id).single()

  if (error) {
    console.error("Error fetching user stats:", error)
    captureException(error)
    return { total_stories: 0, total_views: 0 }
  }

  return {
    total_stories: data.total_stories || 0,
    total_views: data.total_views || 0,
  }
}

export default function ProfileScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const { showToast } = useToast()
  const { showLoading, hideLoading } = useLoading()
  const navigation = useNavigation()
  const { t } = useTranslation()

  // Fetch user subscription with React Query
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: fetchSubscription,
  })

  // Fetch user stats with React Query
  const { data: userStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["userStats"],
    queryFn: fetchUserStats,
  })

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      showLoading()

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

          if (error) {
            throw error
          }

          setUserProfile({
            id: user.id,
            email: user.email || "",
            username: data?.username || "User",
            created_at: user.created_at || "",
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        captureException(error)
        showToast("Failed to fetch profile", "error")
      } finally {
        hideLoading()
      }
    }

    fetchUserProfile()
  }, [showLoading, hideLoading, showToast])

  // Sign out
  const handleSignOut = async () => {
    showLoading()

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      // Navigate to auth screen
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" as never }],
      })
    } catch (error) {
      console.error("Error signing out:", error)
      captureException(error)
      showToast("Error signing out", "error")
    } finally {
      hideLoading()
    }
  }

  // Test notification
  const handleTestNotification = async () => {
    try {
      await sendLocalNotification("Test Notification", "This is a test notification", { screen: "Profile" })

      showToast("Test notification sent", "success")
    } catch (error) {
      console.error("Error sending test notification:", error)
      captureException(error)
      showToast("Error sending test notification", "error")
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Get subscription status
  const getSubscriptionStatus = () => {
    if (!subscription) return "None"

    if (subscription.status === "trialing") {
      return "Trial"
    }

    if (subscription.status === "active") {
      return "Active"
    }

    return subscription.status
  }

  // Get subscription badge color
  const getSubscriptionBadgeColor = () => {
    if (!subscription) return "gray"

    if (subscription.status === "trialing") {
      return "blue"
    }

    if (subscription.status === "active") {
      return "green"
    }

    return "gray"
  }

  return (
    <View style={styles.container}>
      <Header title="Profile" />

      <ScrollView style={styles.scrollView}>
        {/* User Info */}
        {userProfile && (
          <Card style={styles.card}>
            <Text style={styles.username}>{userProfile.username}</Text>
            <Text style={styles.email}>{userProfile.email}</Text>
            <Text style={styles.joinDate}>Joined {formatDate(userProfile.created_at)}</Text>

            <View style={styles.subscriptionContainer}>
              <Text style={styles.subscriptionLabel}>Subscription Status:</Text>
              <Badge variant={getSubscriptionBadgeColor()} label={getSubscriptionStatus()} />
            </View>
          </Card>
        )}

        {/* User Stats */}
        {userStats && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Stats</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userStats.total_stories}</Text>
                <Text style={styles.statLabel}>Total Stories</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userStats.total_views}</Text>
                <Text style={styles.statLabel}>Total Views</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Subscription Banner */}
        {(!subscription || subscription.status !== "active") && <SubscriptionBanner />}

        {/* Push Notifications */}
        <PushNotificationManager />

        {/* Language Selector */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Language</Text>
          <LanguageSelector />
        </Card>

        {/* Test Notification Button */}
        <Button onPress={handleTestNotification} style={styles.button}>
          Test Notification
        </Button>

        {/* Sign Out Button */}
        <Button onPress={handleSignOut} variant="secondary" style={styles.button}>
          Sign Out
        </Button>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  joinDate: {
    fontSize: 14,
    color: "#888",
    marginBottom: 16,
  },
  subscriptionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  subscriptionLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  button: {
    marginBottom: 16,
  },
})
