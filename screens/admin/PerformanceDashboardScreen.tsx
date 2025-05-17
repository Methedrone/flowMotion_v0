"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { supabase } from "../../lib/supabase"
import { COLORS, SIZES } from "../../constants/theme"
import { getCurrentPerformanceMetrics } from "../../services/performance"
import { useTranslation } from "react-i18next"
import Header from "../../components/ui/Header"
import Card from "../../components/ui/Card"
import { RefreshCw, Clock, Zap, Memory, Smartphone, Server } from "lucide-react-native"

const { width } = Dimensions.get("window")

export default function PerformanceDashboardScreen() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [currentMetrics, setCurrentMetrics] = useState<any>({})
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week")

  useEffect(() => {
    fetchPerformanceData()
    const metrics = getCurrentPerformanceMetrics()
    setCurrentMetrics(metrics)
  }, [timeRange])

  const fetchPerformanceData = async () => {
    setLoading(true)
    try {
      // Calculate date range
      const now = new Date()
      const startDate = new Date()

      if (timeRange === "day") {
        startDate.setDate(now.getDate() - 1)
      } else if (timeRange === "week") {
        startDate.setDate(now.getDate() - 7)
      } else {
        startDate.setMonth(now.getMonth() - 1)
      }

      // Fetch performance data from Supabase
      const { data, error } = await supabase
        .from("performance_metrics")
        .select("*")
        .gte("timestamp", startDate.toISOString())
        .order("timestamp", { ascending: true })

      if (error) throw error

      setPerformanceData(data || [])
    } catch (error) {
      console.error("Error fetching performance data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getChartData = (metricKey: string) => {
    // Process data for charts
    const labels: string[] = []
    const datasets: number[] = []

    if (performanceData.length > 0) {
      // Group data by day for week and month views
      if (timeRange !== "day") {
        const groupedData: Record<string, number[]> = {}

        performanceData.forEach((item) => {
          const date = new Date(item.timestamp)
          const dateKey = date.toISOString().split("T")[0]

          if (!groupedData[dateKey]) {
            groupedData[dateKey] = []
          }

          // Handle nested properties like apiResponseTime.stories
          let value = item
          metricKey.split(".").forEach((key) => {
            value = value?.[key]
          })

          if (typeof value === "number") {
            groupedData[dateKey].push(value)
          }
        })

        // Calculate averages for each day
        Object.keys(groupedData).forEach((date) => {
          const values = groupedData[date]
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length

          // Format date for display
          const displayDate = new Date(date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })

          labels.push(displayDate)
          datasets.push(avg)
        })
      } else {
        // For day view, use hourly data points
        performanceData.forEach((item) => {
          const date = new Date(item.timestamp)
          const hourKey = date.getHours().toString().padStart(2, "0") + ":00"

          // Handle nested properties
          let value = item
          metricKey.split(".").forEach((key) => {
            value = value?.[key]
          })

          if (typeof value === "number") {
            labels.push(hourKey)
            datasets.push(value)
          }
        })
      }
    }

    // Limit to a reasonable number of data points
    const maxDataPoints = 7
    if (labels.length > maxDataPoints) {
      const step = Math.ceil(labels.length / maxDataPoints)
      const filteredLabels = []
      const filteredDatasets = []

      for (let i = 0; i < labels.length; i += step) {
        filteredLabels.push(labels[i])
        filteredDatasets.push(datasets[i])
      }

      return {
        labels: filteredLabels,
        datasets: [{ data: filteredDatasets }],
      }
    }

    return {
      labels,
      datasets: [{ data: datasets }],
    }
  }

  const renderMetricCard = (title: string, value: string | number, icon: React.ReactNode) => (
    <Card style={styles.metricCard}>
      <View style={styles.metricIconContainer}>{icon}</View>
      <View style={styles.metricContent}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </Card>
  )

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={t("performance.title")}
        showBackButton
        rightAction={
          <TouchableOpacity onPress={fetchPerformanceData} style={styles.refreshButton}>
            <RefreshCw size={20} color={COLORS.textDark} />
          </TouchableOpacity>
        }
      />

      <View style={styles.timeRangeSelector}>
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === "day" && styles.activeTimeRange]}
          onPress={() => setTimeRange("day")}
        >
          <Text style={[styles.timeRangeText, timeRange === "day" && styles.activeTimeRangeText]}>
            {t("performance.period.today")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === "week" && styles.activeTimeRange]}
          onPress={() => setTimeRange("week")}
        >
          <Text style={[styles.timeRangeText, timeRange === "week" && styles.activeTimeRangeText]}>
            {t("performance.period.last7Days")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === "month" && styles.activeTimeRange]}
          onPress={() => setTimeRange("month")}
        >
          <Text style={[styles.timeRangeText, timeRange === "month" && styles.activeTimeRangeText]}>
            {t("performance.period.last30Days")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>{t("performance.currentMetrics")}</Text>

        <View style={styles.metricsGrid}>
          {renderMetricCard(
            t("performance.metrics.appStartTime"),
            currentMetrics.timeToInteractive ? `${(currentMetrics.timeToInteractive / 1000).toFixed(2)}s` : "N/A",
            <Clock size={24} color={COLORS.primary} />,
          )}

          {renderMetricCard(
            t("performance.metrics.frameRate"),
            currentMetrics.frameRate ? `${currentMetrics.frameRate} FPS` : "N/A",
            <Zap size={24} color={COLORS.secondary} />,
          )}

          {renderMetricCard(
            t("performance.metrics.memoryUsage"),
            currentMetrics.memoryUsage ? `${(currentMetrics.memoryUsage / (1024 * 1024)).toFixed(2)} MB` : "N/A",
            <Memory size={24} color={COLORS.accent} />,
          )}

          {renderMetricCard(
            t("performance.metrics.deviceInfo"),
            currentMetrics.deviceInfo?.modelName || "N/A",
            <Smartphone size={24} color={COLORS.success} />,
          )}
        </View>

        <Text style={styles.sectionTitle}>{t("performance.apiPerformance")}</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : performanceData.length === 0 ? (
          <Text style={styles.noDataText}>{t("performance.noData")}</Text>
        ) : (
          <>
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t("performance.metrics.apiResponseTime")}</Text>
              <LineChart
                data={getChartData("apiResponseTime.stories")}
                width={width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: COLORS.backgroundLight,
                  backgroundGradientFrom: COLORS.backgroundLight,
                  backgroundGradientTo: COLORS.backgroundLight,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
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
            </Card>

            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t("performance.metrics.renderTime")}</Text>
              <LineChart
                data={getChartData("renderTime.FeedScreen")}
                width={width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: COLORS.backgroundLight,
                  backgroundGradientFrom: COLORS.backgroundLight,
                  backgroundGradientTo: COLORS.backgroundLight,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(236, 72, 153, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
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
            </Card>
          </>
        )}

        <Text style={styles.sectionTitle}>{t("performance.serverMetrics")}</Text>

        <Card style={styles.serverMetricsCard}>
          <View style={styles.serverMetricRow}>
            <Server size={20} color={COLORS.textDark} />
            <Text style={styles.serverMetricLabel}>{t("performance.metrics.cpuUsage")}</Text>
            <Text style={styles.serverMetricValue}>23%</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.serverMetricRow}>
            <Server size={20} color={COLORS.textDark} />
            <Text style={styles.serverMetricLabel}>{t("performance.metrics.memoryUsage")}</Text>
            <Text style={styles.serverMetricValue}>512 MB</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.serverMetricRow}>
            <Server size={20} color={COLORS.textDark} />
            <Text style={styles.serverMetricLabel}>{t("performance.metrics.requestsPerMinute")}</Text>
            <Text style={styles.serverMetricValue}>42</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  refreshButton: {
    padding: 8,
  },
  timeRangeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.spacing.lg,
    marginVertical: SIZES.spacing.md,
  },
  timeRangeButton: {
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.backgroundMuted,
  },
  activeTimeRange: {
    backgroundColor: COLORS.primary,
  },
  timeRangeText: {
    fontSize: SIZES.fontSM,
    color: COLORS.textDark,
  },
  activeTimeRangeText: {
    color: COLORS.textLight,
    fontWeight: "600",
  },
  scrollContent: {
    padding: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.xl * 2,
  },
  sectionTitle: {
    fontSize: SIZES.fontLG,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: SIZES.spacing.md,
    marginTop: SIZES.spacing.lg,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricCard: {
    width: "48%",
    marginBottom: SIZES.spacing.md,
    padding: SIZES.spacing.md,
  },
  metricIconContainer: {
    marginBottom: SIZES.spacing.sm,
  },
  metricContent: {},
  metricTitle: {
    fontSize: SIZES.fontSM,
    color: COLORS.textMuted,
    marginBottom: SIZES.spacing.xs,
  },
  metricValue: {
    fontSize: SIZES.fontLG,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  loadingContainer: {
    padding: SIZES.spacing.xl,
    alignItems: "center",
  },
  noDataText: {
    textAlign: "center",
    color: COLORS.textMuted,
    padding: SIZES.spacing.lg,
  },
  chartCard: {
    marginBottom: SIZES.spacing.lg,
    padding: SIZES.spacing.md,
  },
  chartTitle: {
    fontSize: SIZES.fontMD,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: SIZES.spacing.md,
  },
  chart: {
    marginVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.md,
  },
  serverMetricsCard: {
    padding: SIZES.spacing.md,
  },
  serverMetricRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SIZES.spacing.md,
  },
  serverMetricLabel: {
    flex: 1,
    fontSize: SIZES.fontMD,
    color: COLORS.textDark,
    marginLeft: SIZES.spacing.md,
  },
  serverMetricValue: {
    fontSize: SIZES.fontMD,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
})
