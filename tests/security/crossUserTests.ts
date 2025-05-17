import { runSecurityTest, SecurityTestType } from "../../utils/securityTesting"
import { supabase } from "../../lib/supabase"

// Test access to another user's favorites
export async function testCrossUserFavoritesAccess() {
  return runSecurityTest(SecurityTestType.CROSS_USER, "Cross-User Favorites Access", async () => {
    // Sign in as test user 1
    const { data: authData1, error: authError1 } = await supabase.auth.signInWithPassword({
      email: "test1@example.com",
      password: "password123",
    })

    if (authError1) {
      throw new Error(`Authentication as user 1 failed: ${authError1.message}`)
    }

    // Get user 1's ID
    const user1Id = authData1.user?.id

    // Create a favorite for user 1
    const { data: stories } = await supabase.from("stories").select("id").limit(1)

    if (!stories || stories.length === 0) {
      throw new Error("No stories found")
    }

    const storyId = stories[0].id

    await supabase.from("favorites").insert([
      {
        story_id: storyId,
      },
    ])

    // Sign out user 1
    await supabase.auth.signOut()

    // Sign in as test user 2
    const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
      email: "test2@example.com",
      password: "password123",
    })

    if (authError2) {
      throw new Error(`Authentication as user 2 failed: ${authError2.message}`)
    }

    // Try to access user 1's favorites
    const { data, error } = await supabase.from("favorites").select("*").eq("user_id", user1Id)

    // This should fail with an authorization error or return empty results
    if (!error && data && data.length > 0) {
      throw new Error("User 2 was able to access User 1's favorites")
    }
  })
}

// Test access to another user's quotes
export async function testCrossUserQuotesAccess() {
  return runSecurityTest(SecurityTestType.CROSS_USER, "Cross-User Quotes Access", async () => {
    // Sign in as test user 1
    const { data: authData1, error: authError1 } = await supabase.auth.signInWithPassword({
      email: "test1@example.com",
      password: "password123",
    })

    if (authError1) {
      throw new Error(`Authentication as user 1 failed: ${authError1.message}`)
    }

    // Get user 1's ID
    const user1Id = authData1.user?.id

    // Create a quote for user 1
    const { data: stories } = await supabase.from("stories").select("id").limit(1)

    if (!stories || stories.length === 0) {
      throw new Error("No stories found")
    }

    const storyId = stories[0].id

    await supabase.from("quotes").insert([
      {
        story_id: storyId,
        content: "Test quote for security testing",
      },
    ])

    // Sign out user 1
    await supabase.auth.signOut()

    // Sign in as test user 2
    const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
      email: "test2@example.com",
      password: "password123",
    })

    if (authError2) {
      throw new Error(`Authentication as user 2 failed: ${authError2.message}`)
    }

    // Try to access user 1's quotes
    const { data, error } = await supabase.from("quotes").select("*").eq("user_id", user1Id)

    // This should fail with an authorization error or return empty results
    if (!error && data && data.length > 0) {
      throw new Error("User 2 was able to access User 1's quotes")
    }
  })
}

// Test access to premium content without subscription
export async function testPremiumContentAccess() {
  return runSecurityTest(SecurityTestType.CROSS_USER, "Premium Content Access", async () => {
    // Sign in as a user without subscription
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: "free-user@example.com",
      password: "password123",
    })

    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`)
    }

    // Get a premium story
    const { data: premiumStories } = await supabase.from("stories").select("id").eq("premium", true).limit(1)

    if (!premiumStories || premiumStories.length === 0) {
      throw new Error("No premium stories found")
    }

    const premiumStoryId = premiumStories[0].id

    // Try to access key points for the premium story
    const { data, error } = await supabase.from("key_points").select("*").eq("story_id", premiumStoryId)

    // This should fail with an authorization error or return empty results
    if (!error && data && data.length > 0) {
      throw new Error("Free user was able to access premium content")
    }
  })
}
