import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?dts"
import { Deno } from "https://deno.land/std@0.131.0/io/mod.ts" // Declare Deno variable

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY") || ""
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || ""
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
})

serve(async (req) => {
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret)

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }
})

async function handleSubscriptionChange(subscription) {
  // Find the user by the Stripe customer ID
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", subscription.customer)
    .single()

  if (userError) {
    throw new Error(`Error finding user: ${userError.message}`)
  }

  // Determine the plan type from the subscription
  let plan = "monthly" // Default
  if (subscription.items.data[0].price.metadata.type) {
    plan = subscription.items.data[0].price.metadata.type
  }

  // Check if the subscription already exists
  const { data: existingSubscription, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .single()

  if (fetchError && fetchError.code !== "PGRST116") {
    throw new Error(`Error checking subscription: ${fetchError.message}`)
  }

  if (existingSubscription) {
    // Update existing subscription
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: subscription.status,
        plan,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id)

    if (updateError) {
      throw new Error(`Error updating subscription: ${updateError.message}`)
    }
  } else {
    // Create new subscription record
    const { error: insertError } = await supabase.from("subscriptions").insert({
      user_id: userData.id,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })

    if (insertError) {
      throw new Error(`Error creating subscription: ${insertError.message}`)
    }
  }
}
