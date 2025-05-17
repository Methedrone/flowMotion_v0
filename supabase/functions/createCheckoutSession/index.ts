import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?dts"
import { Deno } from "https://deno.land/std@0.131.0/io/mod.ts" // Declare Deno variable

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY") || ""
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || ""

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
})

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }

  try {
    // Get the authorization header
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

    // Get the plan ID from the request
    const { planId } = await req.json()

    if (!planId) {
      return new Response(JSON.stringify({ error: "planId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Determine the price ID based on the plan
    let priceId: string
    switch (planId) {
      case "monthly":
        priceId = "price_monthly" // This should be a real price ID from your Stripe account
        break
      case "annual":
        priceId = "price_annual" // This should be a real price ID from your Stripe account
        break
      case "family":
        priceId = "price_family" // This should be a real price ID from your Stripe account
        break
      default:
        return new Response(JSON.stringify({ error: "Invalid plan ID" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
    }

    // Get the user's Stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single()

    if (userError) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Create a new checkout session
    const session = await stripe.checkout.sessions.create({
      customer: userData.stripe_customer_id,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: "flowmotion://subscription-success",
      cancel_url: "flowmotion://subscription-canceled",
      metadata: {
        supabase_user_id: user.id,
      },
    })

    return new Response(JSON.stringify({ url: session.url }), {
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
