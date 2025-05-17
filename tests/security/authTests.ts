import { runSecurityTest, SecurityTestType } from "../../utils/securityTesting"
import { supabase } from "../../lib/supabase"

// Test authentication with invalid credentials
export async function testInvalidCredentials() {
  return runSecurityTest(SecurityTestType.AUTHENTICATION, "Invalid Credentials", async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "nonexistent@example.com",
      password: "invalidpassword",
    })

    // This should fail with an error
    if (!error) {
      throw new Error("Authentication succeeded with invalid credentials")
    }

    // Verify no session was created
    if (data.session) {
      throw new Error("Session was created with invalid credentials")
    }
  })
}

// Test password strength requirements
export async function testPasswordStrength() {
  return runSecurityTest(SecurityTestType.AUTHENTICATION, "Password Strength", async () => {
    // Try to sign up with a weak password
    const { error } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: "weak",
    })

    // This should fail with a password strength error
    if (!error) {
      throw new Error("Sign up succeeded with weak password")
    }

    // Verify the error is related to password strength
    if (!error.message.toLowerCase().includes("password")) {
      throw new Error(`Unexpected error: ${error.message}`)
    }
  })
}

// Test access to protected resources without authentication
export async function testUnauthenticatedAccess() {
  return runSecurityTest(SecurityTestType.AUTHORIZATION, "Unauthenticated Access", async () => {
    // Create a new Supabase client without auth
    const anonSupabase = supabase

    // Try to access protected resources
    const { error: storiesError } = await anonSupabase.from("stories").select("*").limit(1)

    // This should fail with an authorization error
    if (!storiesError) {
      throw new Error("Unauthenticated access to stories succeeded")
    }

    // Try to access user data
    const { error: usersError } = await anonSupabase.from("users").select("*").limit(1)

    // This should fail with an authorization error
    if (!usersError) {
      throw new Error("Unauthenticated access to users succeeded")
    }
  })
}
