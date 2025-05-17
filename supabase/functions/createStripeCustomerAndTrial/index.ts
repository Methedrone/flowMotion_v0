import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"
import { Deno } from "https://deno.land/std@0.131.0/runtime.ts" // Declare Deno variable

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY") || ""
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || ""

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
})

const TRIAL_PERIOD_DAYS = 7 // 7-day trial period

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

    // Check if user already has a Stripe customer ID
    const { data: existingCustomer, error: customerError } = await supabase
      .from("customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    if (customerError && customerError.code !== "PGRST116") {
      throw customerError
    }

    let customerId

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id
    } else {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })

      customerId = customer.id

      // Save the customer ID to the database
      await supabase.from("customers").insert({
        user_id: user.id,
        stripe_customer_id: customerId,
      })
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()

    if (existingSubscription) {
      return new Response(
        JSON.stringify({
          message: "User already has an active subscription",
          subscription: existingSubscription,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Create a trial subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: Deno.env.get("STRIPE_PRICE_ID"),
        },
      ],
      trial_period_days: TRIAL_PERIOD_DAYS,
      metadata: {
        user_id: user.id,
      },
    })

    // Save the subscription to the database
    await supabase.from("subscriptions").insert({
      user_id: user.id,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan: "monthly",
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    })

    return new Response(
      JSON.stringify({
        message: "Trial subscription created successfully",
        subscription_id: subscription.id,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
