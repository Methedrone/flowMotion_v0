import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1"
import { Deno } from "https://deno.land/std@0.131.0/io/mod.ts" // Declare Deno variable

// Environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY") || ""
const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || ""

// Initialize clients
const supabase = createClient(supabaseUrl, supabaseServiceKey)
const configuration = new Configuration({ apiKey: openaiApiKey })
const openai = new OpenAIApi(configuration)

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Check if user has an active subscription for premium content
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("status, trial_end, current_period_end")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    const isPremiumUser =
      subscription &&
      (subscription.status === "active" ||
        (subscription.status === "trialing" && new Date(subscription.trial_end) > new Date()))

    // Get request body
    const { content, title, contentType = "text" } = await req.json()

    if (!content) {
      return new Response(JSON.stringify({ error: "Content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (!title) {
      return new Response(JSON.stringify({ error: "Title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Generate story script using OpenAI
    const prompt = `Create a 3-scene storyboard from the following ${contentType}:
    
${content}

Format the response as a JSON object with the following structure:
{
  "scenes": [
    {
      "description": "Detailed description of scene 1",
      "narration": "Narration text for scene 1",
      "visual_style": "Visual style description for scene 1"
    },
    {
      "description": "Detailed description of scene 2",
      "narration": "Narration text for scene 2",
      "visual_style": "Visual style description for scene 2"
    },
    {
      "description": "Detailed description of scene 3",
      "narration": "Narration text for scene 3",
      "visual_style": "Visual style description for scene 3"
    }
  ],
  "summary": "A brief summary of the entire story",
  "key_points": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"]
}

Make the visual style descriptions detailed and specific, including colors, lighting, camera angles, and animation techniques.
${isPremiumUser ? "Use premium quality descriptions with advanced animation techniques." : "Use standard quality descriptions."}
`

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const responseText = completion.data.choices[0].message?.content || ""

    // Parse the JSON response
    let storyData
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        storyData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("Could not extract JSON from response")
      }
    } catch (error) {
      console.error("Error parsing JSON response:", error)
      return new Response(JSON.stringify({ error: "Failed to parse story data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Insert the story into the database
    const { data: story, error: insertError } = await supabase
      .from("stories")
      .insert({
        user_id: user.id,
        title,
        description: storyData.summary,
        content: content,
        content_type: contentType,
        script: storyData,
        premium: isPremiumUser,
        status: "pending", // Will be updated when animation is generated
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Trigger animation generation (this would be a separate function)
    const { error: functionError } = await supabase.functions.invoke("generateAnimationAssets", {
      body: { storyId: story.id },
    })

    if (functionError) {
      console.error("Error triggering animation generation:", functionError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Story generated successfully",
        story: {
          id: story.id,
          title: story.title,
          description: story.description,
          status: story.status,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error generating story:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
