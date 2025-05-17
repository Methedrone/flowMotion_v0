import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Deno } from "https://deno.land/std@0.131.0/runtime/mod.ts"

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY") || ""
const stabilityApiKey = Deno.env.get("STABILITY_API_KEY") || ""

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

    // Get the storyboard content
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

    // Get the story details
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("title, description")
      .eq("id", storyId)
      .single()

    if (storyError) {
      return new Response(JSON.stringify({ error: `Error fetching story: ${storyError.message}` }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Generate a thumbnail image using Stability AI
    const thumbnailPrompt = `Create a minimalistic, cartoon-like illustration for a self-improvement story titled "${story.title}". Use pastel colors with a gradient from blue to orange. The style should be clean with hard lines, similar to Kurzgesagt animations.`

    const thumbnailResponse = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${stabilityApiKey}`,
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: thumbnailPrompt,
              weight: 1,
            },
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
          style_preset: "animation",
        }),
      },
    )

    if (!thumbnailResponse.ok) {
      const errorData = await thumbnailResponse.json()
      throw new Error(`Error generating thumbnail: ${JSON.stringify(errorData)}`)
    }

    const thumbnailData = await thumbnailResponse.json()
    const thumbnailBase64 = thumbnailData.artifacts[0].base64

    // Convert base64 to Uint8Array for storage
    const thumbnailBinary = Uint8Array.from(atob(thumbnailBase64), (c) => c.charCodeAt(0))

    // Upload thumbnail to Supabase Storage
    const thumbnailPath = `thumbnails/${storyId}.png`
    const { error: thumbnailUploadError } = await supabase.storage
      .from("flowmotion-assets")
      .upload(thumbnailPath, thumbnailBinary, {
        contentType: "image/png",
        upsert: true,
      })

    if (thumbnailUploadError) {
      throw new Error(`Error uploading thumbnail: ${thumbnailUploadError.message}`)
    }

    // Get the public URL for the thumbnail
    const { data: thumbnailUrl } = supabase.storage.from("flowmotion-assets").getPublicUrl(thumbnailPath)

    // For the MVP, we'll simulate the video generation process
    // In a real implementation, this would involve more complex animation generation
    // using tools like Stable Diffusion + ControlNet or a specialized animation AI

    // For now, we'll create a simple animation by generating a few frames and
    // then use a placeholder video URL

    // In a production environment, you would:
    // 1. Generate frames for each scene in the storyboard
    // 2. Create animations for transitions between scenes
    // 3. Combine with audio narration
    // 4. Encode as a video file
    // 5. Upload to storage

    // Placeholder video URL (in a real implementation, this would be generated)
    const videoPath = `videos/${storyId}.mp4`
    const { data: videoUrl } = supabase.storage.from("flowmotion-assets").getPublicUrl(videoPath)

    // Update the story with the thumbnail and video URLs
    const { error: updateError } = await supabase
      .from("stories")
      .update({
        thumbnail_url: thumbnailUrl.publicUrl,
        video_url: videoUrl.publicUrl || "https://example.com/placeholder-video.mp4", // Placeholder for MVP
        updated_at: new Date().toISOString(),
      })
      .eq("id", storyId)

    if (updateError) {
      throw new Error(`Error updating story: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        storyId,
        thumbnailUrl: thumbnailUrl.publicUrl,
        videoUrl: videoUrl.publicUrl || "https://example.com/placeholder-video.mp4", // Placeholder for MVP
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
