// Follow Deno deploy pattern for Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import { Deno } from "https://deno.land/std@0.168.0/io/mod.ts" // Declare Deno variable

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface PushNotificationPayload {
  userId?: string
  userIds?: string[]
  title: string
  body: string
  data?: Record<string, unknown>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    )

    // Get the request body
    const payload: PushNotificationPayload = await req.json()

    // Validate payload
    if ((!payload.userId && !payload.userIds) || !payload.title || !payload.body) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get user tokens
    let userIds: string[] = []
    if (payload.userId) {
      userIds = [payload.userId]
    } else if (payload.userIds) {
      userIds = payload.userIds
    }

    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("user_push_tokens")
      .select("push_token")
      .in("user_id", userIds)

    if (tokenError) {
      throw tokenError
    }

    if (!tokenData || tokenData.length === 0) {
      return new Response(JSON.stringify({ message: "No push tokens found for the specified users" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Send push notifications using Expo push service
    const pushTokens = tokenData.map((item) => item.push_token)
    const messages = pushTokens.map((token) => ({
      to: token,
      sound: "default",
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
    }))

    // Call Expo push notification service
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    })

    const result = await response.json()

    // Log notification to database for analytics
    await supabaseClient.from("notification_logs").insert({
      user_ids: userIds,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sent_at: new Date().toISOString(),
      status: response.ok ? "success" : "failed",
      response: result,
    })

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error sending push notification:", error)

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
