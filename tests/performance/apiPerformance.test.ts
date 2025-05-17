import { runPerformanceTest, PerformanceTestType } from "../../utils/performanceTesting"
import { supabase } from "../../lib/supabase"

// Test stories feed API performance
export async function testStoriesFeedApiPerformance() {
  console.log("Testing stories feed API performance...")

  const result = await runPerformanceTest(
    PerformanceTestType.API_CALL,
    "Stories Feed API",
    async () => {
      // Make actual API call to Supabase
      const startTime = Date.now()
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error

      // Store response data in metadata
      result.metadata = {
        ...result.metadata,
        responseTime: Date.now() - startTime,
        itemCount: data?.length || 0,
      }
    },
    {
      endpoint: "/stories",
      method: "GET",
      limit: 10,
    },
  )

  console.log(`Stories feed API test ${result.pass ? "PASSED" : "FAILED"}`)
  console.log(`Duration: ${result.duration}ms (Threshold: ${result.threshold}ms)`)
  console.log(`Items returned: ${result.metadata?.itemCount || 0}`)

  return result
}

// Test key points API performance
export async function testKeyPointsApiPerformance() {
  console.log("Testing key points API performance...")

  const result = await runPerformanceTest(
    PerformanceTestType.API_CALL,
    "Key Points API",
    async () => {
      // First get a story ID
      const { data: stories } = await supabase.from("stories").select("id").limit(1)

      if (!stories || stories.length === 0) {
        throw new Error("No stories found")
      }

      const storyId = stories[0].id

      // Make API call to get key points
      const startTime = Date.now()
      const { data, error } = await supabase
        .from("key_points")
        .select("*")
        .eq("story_id", storyId)
        .order("order", { ascending: true })

      if (error) throw error

      // Store response data in metadata
      result.metadata = {
        ...result.metadata,
        responseTime: Date.now() - startTime,
        itemCount: data?.length || 0,
        storyId,
      }
    },
    {
      endpoint: "/key_points",
      method: "GET",
    },
  )

  console.log(`Key points API test ${result.pass ? "PASSED" : "FAILED"}`)
  console.log(`Duration: ${result.duration}ms (Threshold: ${result.threshold}ms)`)
  console.log(`Items returned: ${result.metadata?.itemCount || 0}`)

  return result
}
