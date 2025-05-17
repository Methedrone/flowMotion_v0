import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Deno } from "https://deno.land/std@0.131.0/io/mod.ts" // Declare Deno variable

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY") || ""
const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || ""

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

    // Get the story ID from the request
    const { storyId } = await req.json()

    if (!storyId) {
      return new Response(JSON.stringify({ error: "storyId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get the story details and storyboard content
    const { data: storyboard, error: storyboardError } = await supabase
      .from("storyboards")
      .select("content")
      .eq("story_id", storyId)
      .single()

    if (storyboardError) {
      return new Response(JSON.stringify({ error: `Error fetching storyboard: ${storyboardError.message}` }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Extract key points using GPT-4
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert at extracting key insights and actionable points from content. Extract 3-5 most important, contextual pieces of information or conclusions from the given content. Make these points clear, concise, and actionable.",
          },
          {
            role: "user",
            content: `Extract 3-5 key points from this story:
${JSON.stringify(storyboard.content)}

Provide the key points in a JSON array format like this:
[
  "First key point that is clear and actionable",
  "Second key point that is clear and actionable",
  ...
]`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    })

    const gptData = await response.json()

    if (!gptData.choices || gptData.choices.length === 0) {
      throw new Error("Failed to extract key points")
    }

    const keyPoints = JSON.parse(gptData.choices[0].message.content)

    // Save the key points to the database
    const keyPointInserts = keyPoints.map((content, index) => ({
      story_id: storyId,
      content,
      order: index + 1,
    }))

    const { error: insertError } = await supabase.from("key_points").insert(keyPointInserts)

    if (insertError) {
      throw new Error(`Error saving key points: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        keyPoints,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
