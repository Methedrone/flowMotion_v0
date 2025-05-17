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

    // Get the source content from the request
    const { sourceContent, title, contentType = "text" } = await req.json()

    if (!sourceContent) {
      return new Response(JSON.stringify({ error: "sourceContent is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Generate a storyboard from the source content using GPT-4
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
              "You are an expert content creator who creates engaging, animated storyboards based on self-improvement content. You extract key ideas and transform them into a visual narrative that is engaging, universal, and relatable.",
          },
          {
            role: "user",
            content: `I need you to create a storyboard script for an animated short video (1-3 minutes) based on the following ${contentType}:

"${sourceContent}"

Create a JSON object with the following structure:
{
  "title": "Title of the story",
  "description": "Brief description of what this story is about",
  "scenes": [
    {
      "sceneNumber": 1,
      "narration": "Text for voice narration",
      "visualDescription": "Detailed description of what should be shown visually",
      "duration": "Approximate duration in seconds"
    },
    ...more scenes
  ]
}

Make the narration engaging, concise, and impactful. The visuals should be described in a way that they can be animated in a minimalistic, cartoon-like style with pastel colors. Focus on universal truths and practical applications.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    const gptData = await response.json()

    if (!gptData.choices || gptData.choices.length === 0) {
      throw new Error("Failed to generate storyboard script")
    }

    const storyboardScript = JSON.parse(gptData.choices[0].message.content)

    // Use the provided title if available, otherwise use the generated one
    if (title) {
      storyboardScript.title = title
    }

    // Save the storyboard script to the database
    const { data: storyData, error: storyError } = await supabase
      .from("stories")
      .insert({
        title: storyboardScript.title,
        description: storyboardScript.description,
        thumbnail_url: null, // Will be updated by the animation generation function
        video_url: null, // Will be updated by the animation generation function
        premium: false, // Default to non-premium
      })
      .select("id")
      .single()

    if (storyError) {
      throw new Error(`Error saving story: ${storyError.message}`)
    }

    // Save the storyboard with the story ID
    const { error: storyboardError } = await supabase.from("storyboards").insert({
      story_id: storyData.id,
      content: storyboardScript,
    })

    if (storyboardError) {
      throw new Error(`Error saving storyboard: ${storyboardError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        storyId: storyData.id,
        storyboard: storyboardScript,
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
