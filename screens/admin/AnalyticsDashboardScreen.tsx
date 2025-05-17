"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native"
import { supabase } from "../../lib/supabase"
import { SafeAreaView } from "react-native-safe-area-context"
import { COLORS, SIZES } from "../../constants/theme"
import { Ionicons } from "@expo/vector-icons"
import { LineChart } from "react-native-chart-kit"
import { captureException } from "../../utils/sentry"

const { width } = Dimensions.get("window")

type DateRange = "7d" | "30d" | "90d" | "all"

type DailyMetric = {
  date: string
  dau: number
  new_users: number
  story_views: number
  story_completions: number
  avg_session_duration_seconds: number
  subscription_conversions: number
  subscription_cancellations: number
}

export default function AnalyticsDashboardScreen() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [metrics, setMetrics] = useState<DailyMetric[]>([])
  const [activeTab, setActiveTab] = useState<"overview" | "engagement" | "subscription" | "retention">("overview")

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  async function fetchAnalytics() {
    try {
      setLoading(true)

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()

      switch (dateRange) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7)
          break
        case "30d":
          startDate.setDate(endDate.getDate() - 30)
          break
        case "90d":
          startDate.setDate(endDate.getDate() - 90)
          break
        case "all":
          startDate.setFullYear(startDate.getFullYear() - 10) // Arbitrary past date
          break
      }

      // Format dates for API
      const startDateStr = startDate.toISOString().split("T")[0]
      const endDateStr = endDate.toISOString().split("T")[0]

      // Fetch daily metrics
      const { data, error } = await supabase
        .from("analytics_daily_metrics")
        .select("*")
        .gte("date", startDateStr)
        .lte("date", endDateStr)
        .order("date", { ascending: true })

      if (error) throw error

      // Transform data for the charts
      const formattedMetrics = data.map((item) => ({
        date: item.date,
        dau: item.dau,
        new_users: item.new_users,
        story_views: item.story_views,
        story_completions: item.story_completions,
        avg_session_duration_seconds: item.avg_session_duration_seconds,
        subscription_conversions: item.subscription_conversions,
        subscription_cancellations: item.subscription_cancellations,
      }))

      setMetrics(formattedMetrics)
    } catch (error: any) {
      Alert.alert("Error", error.message)
      captureException(error, { context: "fetchAnalytics" })
    } finally {
      setLoading(false)
    }
  }

  // Generate report via Edge Function
  async function generateReport(reportType: string) {
    try {
      setLoading(true)

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()

      switch (dateRange) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7)
          break
        case "30d":
          startDate.setDate(endDate.getDate() - 30)
          break
        case "90d":
          startDate.setDate(endDate.getDate() - 90)
          break
        case "all":
          startDate.setFullYear(startDate.getFullYear() - 10) // Arbitrary past date
          break
      }

      // Format dates for API
      const startDateStr = startDate.toISOString().split("T")[0]
      const endDateStr = endDate.toISOString().split("T")[0]

      const { data, error } = await supabase.functions.invoke("generateAnalyticsReport", {
        body: {
          startDate: startDateStr,
          endDate: endDateStr,
          reportType,
        },
      })

      if (error) throw error

      // In a real app, you would display or download the report
      Alert.alert("Report Generated", "The report has been generated successfully.")
    } catch (error: any) {
      Alert.alert("Error", error.message)
      captureException(error, { context: "generateReport" })
    } finally {
      setLoading(false)
    }
  }

  const renderDateRangeSelector = () => (
    <View style={styles.dateRangeContainer}>
      <TouchableOpacity
        style={[styles.dateRangeButton, dateRange === "7d" && styles.dateRangeButtonActive]}
        onPress={() => setDateRange("7d")}
      >
        <Text style={[styles.dateRangeText, dateRange === "7d" && styles.dateRangeTextActive]}>7D</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.dateRangeButton, dateRange === "30d" && styles.dateRangeButtonActive]}
        onPress={() => setDateRange("30d")}
      >
        <Text style={[styles.dateRangeText, dateRange === "30d" && styles.dateRangeTextActive]}>30D</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.dateRangeButton, dateRange === "90d" && styles.dateRangeButtonActive]}
        onPress={() => setDateRange("90d")}
      >
        <Text style={[styles.dateRangeText, dateRange === "90d" && styles.dateRangeTextActive]}>90D</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.dateRangeButton, dateRange === "all" && styles.dateRangeButtonActive]}
        onPress={() => setDateRange("all")}
      >
        <Text style={[styles.dateRangeText, dateRange === "all" && styles.dateRangeTextActive]}>All</Text>
      </TouchableOpacity>
    </View>
  )

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "overview" && styles.activeTab]}
        onPress={() => setActiveTab("overview")}
      >
        <Text style={[styles.tabText, activeTab === "overview" && styles.activeTabText]}>Overview</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "engagement" && styles.activeTab]}
        onPress={() => setActiveTab("engagement")}
      >
        <Text style={[styles.tabText, activeTab === "engagement" && styles.activeTabText]}>Engagement</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "subscription" && styles.activeTab]}
        onPress={() => setActiveTab("subscription")}
      >
        <Text style={[styles.tabText, activeTab === "subscription" && styles.activeTabText]}>Subscription</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "retention" && styles.activeTab]}
        onPress={() => setActiveTab("retention")}
      >
        <Text style={[styles.tabText, activeTab === "retention" && styles.activeTabText]}>Retention</Text>
      </TouchableOpacity>
    </View>
  )

  const renderOverviewTab = () => {
    if (metrics.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data available for the selected period</Text>
        </View>
      )
    }

    // Calculate totals
    const totalNewUsers = metrics.reduce((sum, item) => sum + item.new_users, 0)
    const totalStoryViews = metrics.reduce((sum, item) => sum + item.story_views, 0)
    const totalSubscriptions = metrics.reduce((sum, item) => sum + item.subscription_conversions, 0)

    // Prepare data for DAU chart
    const dauData = {
      labels: metrics.slice(-7).map((item) => {
        const date = new Date(item.date)
        return `${date.getMonth() + 1}/${date.getDate()}`
      }),
      datasets: [
        {
          data: metrics.slice(-7).map((item) => item.dau),
          color: () => COLORS.primary,
          strokeWidth: 2,
        },
      ],
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{totalNewUsers}</Text>
            <Text style={styles.metricLabel}>New Users</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{totalStoryViews}</Text>
            <Text style={styles.metricLabel}>Story Views</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{totalSubscriptions}</Text>
            <Text style={styles.metricLabel}>New Subscriptions</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Daily Active Users (Last 7 Days)</Text>
          <LineChart
            data={dauData}
            width={width - 40}
            height={220}
            chartConfig={{
              backgroundColor: COLORS.backgroundLight,
              backgroundGradientFrom: COLORS.backgroundLight,
              backgroundGradientTo: COLORS.backgroundLight,
              decimalPlaces: 0,
              color: () => COLORS.primary,
              labelColor: () => COLORS.textMuted,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: COLORS.primary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <TouchableOpacity style={styles.reportButton} onPress={() => generateReport("user_activity")}>
          <Ionicons name="download-outline" size={20} color={COLORS.textLight} />
          <Text style={styles.reportButtonText}>Generate User Activity Report</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderEngagementTab = () => {
    if (metrics.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data available for the selected period</Text>
        </View>
      )
    }

    // Calculate totals and averages
    const totalStoryViews = metrics.reduce((sum, item) => sum + item.story_views, 0)
    const totalStoryCompletions = metrics.reduce((sum, item) => sum + item.story_completions, 0)
    const completionRate = totalStoryViews > 0 ? (totalStoryCompletions / totalStoryViews) * 100 : 0
    const avgSessionDuration =
      metrics.reduce((sum, item) => sum + item.avg_session_duration_seconds, 0) / metrics.length || 0

    // Prepare data for story views vs completions chart
    const engagementData = {
      labels: metrics.slice(-7).map((item) => {
        const date = new Date(item.date)
        return `${date.getMonth() + 1}/${date.getDate()}`
      }),
      datasets: [
        {
          data: metrics.slice(-7).map((item) => item.story_views),
          color: () => COLORS.primary,
          strokeWidth: 2,
        },
        {
          data: metrics.slice(-7).map((item) => item.story_completions),
          color: () => COLORS.secondary,
          strokeWidth: 2,
        },
      ],
      legend: ["Views", "Completions"],
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{totalStoryViews}</Text>
            <Text style={styles.metricLabel}>Total Views</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{completionRate.toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Completion Rate</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{Math.round(avgSessionDuration)}s</Text>
            <Text style={styles.metricLabel}>Avg. Session</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Story Views vs Completions (Last 7 Days)</Text>
          <LineChart
            data={engagementData}
            width={width - 40}
            height={220}
            chartConfig={{
              backgroundColor: COLORS.backgroundLight,
              backgroundGradientFrom: COLORS.backgroundLight,
              backgroundGradientTo: COLORS.backgroundLight,
              decimalPlaces: 0,
              color: () => COLORS.primary,
              labelColor: () => COLORS.textMuted,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: COLORS.primary,
              },
            }}
            bezier
            style={styles.chart}
            legend={engagementData.legend}
          />
        </View>

        <TouchableOpacity style={styles.reportButton} onPress={() => generateReport("content_engagement")}>
          <Ionicons name="download-outline" size={20} color={COLORS.textLight} />
          <Text style={styles.reportButtonText}>Generate Content Engagement Report</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderSubscriptionTab = () => {
    if (metrics.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data available for the selected period</Text>
        </View>
      )
    }

    // Calculate totals
    const totalConversions = metrics.reduce((sum, item) => sum + item.subscription_conversions, 0)
    const totalCancellations = metrics.reduce((sum, item) => sum + item.subscription_cancellations, 0)
    const netGrowth = totalConversions - totalCancellations

    // Prepare data for subscription chart
    const subscriptionData = {
      labels: metrics.slice(-7).map((item) => {
        const date = new Date(item.date)
        return `${date.getMonth() + 1}/${date.getDate()}`
      }),
      datasets: [
        {
          data: metrics.slice(-7).map((item) => item.subscription_conversions),
          color: () => COLORS.success,
          strokeWidth: 2,
        },
        {
          data: metrics.slice(-7).map((item) => item.subscription_cancellations),
          color: () => COLORS.error,
          strokeWidth: 2,
        },
      ],
      legend: ["New", "Canceled"],
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{totalConversions}</Text>
            <Text style={styles.metricLabel}>New Subscriptions</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{totalCancellations}</Text>
            <Text style={styles.metricLabel}>Cancellations</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, netGrowth >= 0 ? styles.positiveValue : styles.negativeValue]}>
              {netGrowth >= 0 ? "+" : ""}
              {netGrowth}
            </Text>
            <Text style={styles.metricLabel}>Net Growth</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Subscription Changes (Last 7 Days)</Text>
          <LineChart
            data={subscriptionData}
            width={width - 40}
            height={220}
            chartConfig={{
              backgroundColor: COLORS.backgroundLight,
              backgroundGradientFrom: COLORS.backgroundLight,
              backgroundGradientTo: COLORS.backgroundLight,
              decimalPlaces: 0,
              color: () => COLORS.primary,
              labelColor: () => COLORS.textMuted,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: COLORS.primary,
              },
            }}
            bezier
            style={styles.chart}
            legend={subscriptionData.legend}
          />
        </View>

        <TouchableOpacity style={styles.reportButton} onPress={() => generateReport("subscription_metrics")}>
          <Ionicons name="download-outline" size={20} color={COLORS.textLight} />
          <Text style={styles.reportButtonText}>Generate Subscription Report</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderRetentionTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.infoText}>
          Retention analysis requires more complex calculations that are performed in the backend.
        </Text>

        <TouchableOpacity style={styles.reportButton} onPress={() => generateReport("retention")}>
          <Ionicons name="download-outline" size={20} color={COLORS.textLight} />
          <Text style={styles.reportButtonText}>Generate Retention Report</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab()
      case "engagement":
        return renderEngagementTab()
      case "subscription":
        return renderSubscriptionTab()
      case "retention":
        return renderRetentionTab()
      default:
        return renderOverviewTab()
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
      </View>

      {renderDateRangeSelector()}
      {renderTabs()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          {renderActiveTab()}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: SIZES.fontXL,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  dateRangeContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: COLORS.backgroundMuted,
    borderRadius: SIZES.radius.md,
    margin: 10,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: SIZES.radius.sm,
  },
  dateRangeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  dateRangeText: {
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  dateRangeTextActive: {
    color: COLORS.textLight,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontSM,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  tabContent: {
    flex: 1,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundMuted,
    borderRadius: SIZES.radius.md,
    padding: 15,
    marginHorizontal: 5,
    alignItems: "center",
  },
  metricValue: {
    fontSize: SIZES.fontXL,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: SIZES.fontXS,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  positiveValue: {
    color: COLORS.success,
  },
  negativeValue: {
    color: COLORS.error,
  },
  chartContainer: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: SIZES.radius.md,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartTitle: {
    fontSize: SIZES.fontMD,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: SIZES.radius.md,
  },
  reportButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: SIZES.radius.md,
    marginTop: 10,
  },
  reportButtonText: {
    color: COLORS.textLight,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: SIZES.fontMD,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  infoText: {
    fontSize: SIZES.fontMD,
    color: COLORS.textMuted,
    textAlign: "center",
    marginVertical: 30,
    lineHeight: 24,
  },
})
