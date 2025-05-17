import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Deno } from "https://deno.land/std@0.131.0/runtime/mod.ts"

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY") || ""

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "")

    // Verify the JWT token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check if user has admin role (you would need to implement this check)
    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError) {
      return new Response(JSON.stringify({ error: "Error fetching user data" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (userData.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized. Admin role required." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get report parameters
    const { startDate, endDate, reportType } = await req.json()

    if (!startDate || !endDate || !reportType) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Generate the requested report
    let reportData
    switch (reportType) {
      case "user_activity":
        reportData = await generateUserActivityReport(startDate, endDate)
        break
      case "content_engagement":
        reportData = await generateContentEngagementReport(startDate, endDate)
        break
      case "subscription_metrics":
        reportData = await generateSubscriptionReport(startDate, endDate)
        break
      case "retention":
        reportData = await generateRetentionReport(startDate, endDate)
        break
      default:
        return new Response(JSON.stringify({ error: "Invalid report type" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
    }

    return new Response(JSON.stringify({ success: true, data: reportData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

async function generateUserActivityReport(startDate: string, endDate: string) {
  // Get daily metrics for the date range
  const { data: dailyMetrics, error: metricsError } = await supabase
    .from("analytics_daily_metrics")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })

  if (metricsError) {
    throw new Error(`Error fetching daily metrics: ${metricsError.message}`)
  }

  // Get total users
  const { count: totalUsers, error: userCountError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })

  if (userCountError) {
    throw new Error(`Error fetching user count: ${userCountError.message}`)
  }

  // Calculate MAU (Monthly Active Users)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { count: mau, error: mauError } = await supabase
    .from("analytics_events")
    .select("user_id", { count: "exact", head: true })
    .gte("timestamp", thirtyDaysAgo.toISOString())
    .not("user_id", "is", null)
    .is("user_id", "distinct")

  if (mauError) {
    throw new Error(`Error calculating MAU: ${mauError.message}`)
  }

  // Calculate average session duration
  const { data: sessionData, error: sessionError } = await supabase
    .from("analytics_events")
    .select("properties")
    .eq("event_type", "session_end")
    .gte("timestamp", startDate)
    .lte("timestamp", endDate)

  if (sessionError) {
    throw new Error(`Error fetching session data: ${sessionError.message}`)
  }

  let totalSessionDuration = 0
  let sessionCount = 0

  sessionData.forEach((event) => {
    if (event.properties && event.properties.session_duration_seconds) {
      totalSessionDuration += Number(event.properties.session_duration_seconds)
      sessionCount++
    }
  })

  const avgSessionDuration = sessionCount > 0 ? totalSessionDuration / sessionCount : 0

  return {
    dailyMetrics,
    totalUsers,
    mau,
    avgSessionDuration,
    dateRange: {
      start: startDate,
      end: endDate,
    },
  }
}

async function generateContentEngagementReport(startDate: string, endDate: string) {
  // Get story view counts
  const { data: storyViews, error: viewsError } = await supabase
    .from("analytics_events")
    .select("properties")
    .eq("event_type", "story_view")
    .gte("timestamp", startDate)
    .lte("timestamp", endDate)

  if (viewsError) {
    throw new Error(`Error fetching story views: ${viewsError.message}`)
  }

  // Get story completion counts
  const { data: storyCompletions, error: completionsError } = await supabase
    .from("analytics_events")
    .select("properties")
    .eq("event_type", "story_complete")
    .gte("timestamp", startDate)
    .lte("timestamp", endDate)

  if (completionsError) {
    throw new Error(`Error fetching story completions: ${completionsError.message}`)
  }

  // Get favorite counts
  const { data: favorites, error: favoritesError } = await supabase
    .from("analytics_events")
    .select("properties")
    .eq("event_type", "favorite_added")
    .gte("timestamp", startDate)
    .lte("timestamp", endDate)

  if (favoritesError) {
    throw new Error(`Error fetching favorites: ${favoritesError.message}`)
  }

  // Get quote counts
  const { data: quotes, error: quotesError } = await supabase
    .from("analytics_events")
    .select("properties")
    .eq("event_type", "quote_saved")
    .gte("timestamp", startDate)
    .lte("timestamp", endDate)

  if (quotesError) {
    throw new Error(`Error fetching quotes: ${quotesError.message}`)
  }

  // Calculate completion rate
  const storyViewCount = storyViews.length
  const storyCompletionCount = storyCompletions.length
  const completionRate = storyViewCount > 0 ? (storyCompletionCount / storyViewCount) * 100 : 0

  // Aggregate story engagement by ID
  const storyEngagement: Record<string, { views: number; completions: number; favorites: number }> = {}

  storyViews.forEach((event) => {
    if (event.properties && event.properties.story_id) {
      const storyId = event.properties.story_id as string
      if (!storyEngagement[storyId]) {
        storyEngagement[storyId] = { views: 0, completions: 0, favorites: 0 }
      }
      storyEngagement[storyId].views++
    }
  })

  storyCompletions.forEach((event) => {
    if (event.properties && event.properties.story_id) {
      const storyId = event.properties.story_id as string
      if (!storyEngagement[storyId]) {
        storyEngagement[storyId] = { views: 0, completions: 0, favorites: 0 }
      }
      storyEngagement[storyId].completions++
    }
  })

  favorites.forEach((event) => {
    if (event.properties && event.properties.story_id) {
      const storyId = event.properties.story_id as string
      if (!storyEngagement[storyId]) {
        storyEngagement[storyId] = { views: 0, completions: 0, favorites: 0 }
      }
      storyEngagement[storyId].favorites++
    }
  })

  // Get story details for the engagement data
  const storyIds = Object.keys(storyEngagement)
  let topStories = []

  if (storyIds.length > 0) {
    const { data: stories, error: storiesError } = await supabase
      .from("stories")
      .select("id, title, premium")
      .in("id", storyIds)

    if (storiesError) {
      throw new Error(`Error fetching story details: ${storiesError.message}`)
    }

    // Combine story details with engagement metrics
    topStories = stories.map((story) => ({
      id: story.id,
      title: story.title,
      premium: story.premium,
      views: storyEngagement[story.id]?.views || 0,
      completions: storyEngagement[story.id]?.completions || 0,
      favorites: storyEngagement[story.id]?.favorites || 0,
      completionRate:
        storyEngagement[story.id]?.views > 0
          ? (storyEngagement[story.id].completions / storyEngagement[story.id].views) * 100
          : 0,
    }))

    // Sort by views (descending)
    topStories.sort((a, b) => b.views - a.views)
  }

  return {
    totalViews: storyViewCount,
    totalCompletions: storyCompletionCount,
    totalFavorites: favorites.length,
    totalQuotes: quotes.length,
    overallCompletionRate: completionRate,
    topStories: topStories.slice(0, 10), // Top 10 stories
    dateRange: {
      start: startDate,
      end: endDate,
    },
  }
}

async function generateSubscriptionReport(startDate: string, endDate: string) {
  // Get subscription events
  const { data: subscriptionStarts, error: startsError } = await supabase
    .from("analytics_events")
    .select("timestamp, properties")
    .eq("event_type", "subscription_started")
    .gte("timestamp", startDate)
    .lte("timestamp", endDate)

  if (startsError) {
    throw new Error(`Error fetching subscription starts: ${startsError.message}`)
  }

  const { data: subscriptionRenewals, error: renewalsError } = await supabase
    .from("analytics_events")
    .select("timestamp, properties")
    .eq("event_type", "subscription_renewed")
    .gte("timestamp", startDate)
    .lte("timestamp", endDate)

  if (renewalsError) {
    throw new Error(`Error fetching subscription renewals: ${renewalsError.message}`)
  }

  const { data: subscriptionCancellations, error: cancellationsError } = await supabase
    .from("analytics_events")
    .select("timestamp, properties")
    .eq("event_type", "subscription_canceled")
    .gte("timestamp", startDate)
    .lte("timestamp", endDate)

  if (cancellationsError) {
    throw new Error(`Error fetching subscription cancellations: ${cancellationsError.message}`)
  }

  // Get current active subscriptions
  const { data: activeSubscriptions, error: activeError } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("status", "active")
    .gt("current_period_end", new Date().toISOString())

  if (activeError) {
    throw new Error(`Error fetching active subscriptions: ${activeError.message}`)
  }

  // Get trial conversions
  const { data: trialUsers, error: trialError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("status", "trialing")
    .lt("trial_end", new Date().toISOString())

  if (trialError) {
    throw new Error(`Error fetching trial users: ${trialError.message}`)
  }

  const { data: convertedUsers, error: convertedError } = await supabase
    .from("subscriptions")
    .select("id")
    .in(
      "id",
      trialUsers.map((u) => u.id),
    )
    .eq("status", "active")

  if (convertedError) {
    throw new Error(`Error fetching converted users: ${convertedError.message}`)
  }

  // Calculate trial conversion rate
  const trialConversionRate = trialUsers.length > 0 ? (convertedUsers.length / trialUsers.length) * 100 : 0

  // Group subscriptions by plan
  const planDistribution: Record<string, number> = {}
  activeSubscriptions.forEach((sub) => {
    const plan = sub.plan
    planDistribution[plan] = (planDistribution[plan] || 0) + 1
  })

  // Calculate MRR (Monthly Recurring Revenue)
  // Note: In a real app, you would get actual prices from your database or Stripe
  const planPrices: Record<string, number> = {
    monthly: 9.99,
    annual: 7.99 * 12, // Annual price per month * 12
    family: 14.99,
  }

  let mrr = 0
  Object.entries(planDistribution).forEach(([plan, count]) => {
    if (plan === "annual") {
      // Convert annual to monthly equivalent
      mrr += (planPrices[plan] / 12) * count
    } else {
      mrr += planPrices[plan] * count
    }
  })

  return {
    newSubscriptions: subscriptionStarts.length,
    renewals: subscriptionRenewals.length,
    cancellations: subscriptionCancellations.length,
    activeSubscriptions: activeSubscriptions.length,
    trialConversionRate,
    planDistribution,
    mrr,
    dateRange: {
      start: startDate,
      end: endDate,
    },
  }
}

async function generateRetentionReport(startDate: string, endDate: string) {
  // This is a simplified retention calculation
  // In a production app, you would use more sophisticated cohort analysis

  // Get all users who signed up in the date range
  const { data: newUsers, error: newUsersError } = await supabase
    .from("analytics_events")
    .select("user_id, timestamp")
    .eq("event_type", "sign_up")
    .gte("timestamp", startDate)
    .lte("timestamp", endDate)
    .order("timestamp", { ascending: true })

  if (newUsersError) {
    throw new Error(`Error fetching new users: ${newUsersError.message}`)
  }

  // Calculate retention for different periods
  const retentionPeriods = [1, 7, 30, 90] // days
  const retentionRates: Record<number, number> = {}

  for (const days of retentionPeriods) {
    let retainedCount = 0

    for (const user of newUsers) {
      if (!user.user_id) continue

      const signupDate = new Date(user.timestamp)
      const retentionDate = new Date(signupDate)
      retentionDate.setDate(retentionDate.getDate() + days)

      // Skip if the retention date is in the future
      if (retentionDate > new Date()) continue

      // Check if user had any activity after the retention period
      const { count, error: activityError } = await supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.user_id)
        .gte("timestamp", retentionDate.toISOString())

      if (activityError) {
        throw new Error(`Error checking user activity: ${activityError.message}`)
      }

      if (count && count > 0) {
        retainedCount++
      }
    }

    // Calculate retention rate
    const eligibleUsers = newUsers.filter((user) => {
      const signupDate = new Date(user.timestamp)
      const retentionDate = new Date(signupDate)
      retentionDate.setDate(retentionDate.getDate() + days)
      return retentionDate <= new Date() // Only count users whose retention period has passed
    }).length

    retentionRates[days] = eligibleUsers > 0 ? (retainedCount / eligibleUsers) * 100 : 0
  }

  return {
    totalNewUsers: newUsers.length,
    retentionRates,
    dateRange: {
      start: startDate,
      end: endDate,
    },
  }
}
