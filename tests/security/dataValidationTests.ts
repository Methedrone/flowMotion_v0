import { runSecurityTest, SecurityTestType } from "../../utils/securityTesting"
import { supabase } from "../../lib/supabase"

// Test SQL injection in query parameters
export async function testSqlInjection() {
  return runSecurityTest(SecurityTestType.INJECTION, "SQL Injection", async () => {
    // Sign in first to get authenticated
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: "test@example.com",
      password: "password123",
    })

    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`)
    }

    // Try SQL injection in a query parameter
    const injectionAttempt = "1'; DROP TABLE users; --"

    const { data, error } = await supabase.from("stories").select("*").eq("id", injectionAttempt)

    // This should not cause a server error, just return no results
    if (error && error.message.toLowerCase().includes("syntax")) {
      throw new Error("Possible SQL injection vulnerability")
    }

    // Try another injection pattern
    const injectionAttempt2 = "1 OR 1=1"

    const { data: data2, error: error2 } = await supabase.from("stories").select("*").eq("id", injectionAttempt2)

    // This should not return all rows
    if (data2 && data2.length > 10) {
      throw new Error("Possible SQL injection vulnerability - returned too many rows")
    }
  })
}

// Test XSS in user input
export async function testXssInUserInput() {
  return runSecurityTest(SecurityTestType.INJECTION, "XSS in User Input", async () => {
    // Sign in first to get authenticated
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: "test@example.com",
      password: "password123",
    })

    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`)
    }

    // Try to insert a quote with XSS payload
    const xssPayload = '<script>alert("XSS")</script>'

    // First get a story ID
    const { data: stories } = await supabase.from("stories").select("id").limit(1)

    if (!stories || stories.length === 0) {
      throw new Error("No stories found")
    }

    const storyId = stories[0].id

    // Insert quote with XSS payload
    const { data, error } = await supabase
      .from("quotes")
      .insert([
        {
          story_id: storyId,
          content: xssPayload,
        },
      ])
      .select()

    if (error) {
      // If there's an error, it might be due to validation, which is good
      return
    }

    // If insertion succeeded, check if the content was sanitized
    if (data && data.length > 0) {
      const insertedContent = data[0].content

      // Check if the script tag is still there
      if (insertedContent.includes("<script>")) {
        throw new Error("XSS payload was stored without sanitization")
      }
    }
  })
}

// Test input validation for required fields
export async function testRequiredFieldValidation() {
  return runSecurityTest(SecurityTestType.DATA_VALIDATION, "Required Field Validation", async () => {
    // Sign in first to get authenticated
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: "test@example.com",
      password: "password123",
    })

    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`)
    }

    // Try to insert a story without required fields
    const { error } = await supabase.from("stories").insert([
      {
        // Missing title and video_url, which are required
        description: "Test description",
      },
    ])

    // This should fail with a validation error
    if (!error) {
      throw new Error("Insertion succeeded without required fields")
    }

    // Verify the error is related to required fields
    if (!error.message.toLowerCase().includes("null") && !error.message.toLowerCase().includes("not null")) {
      throw new Error(`Unexpected error: ${error.message}`)
    }
  })
}
