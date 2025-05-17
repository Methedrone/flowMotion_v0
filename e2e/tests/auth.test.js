const { device, element, by, waitFor } = require("detox")

describe("Authentication Flow", () => {
  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it("should show login screen", async () => {
    await expect(element(by.text("Sign In"))).toBeVisible()
    await expect(element(by.text("Sign Up"))).toBeVisible()
  })

  it("should show validation errors with empty fields", async () => {
    await element(by.text("Sign In")).tap()
    await expect(element(by.text("Email is required"))).toBeVisible()
    await expect(element(by.text("Password is required"))).toBeVisible()
  })

  it("should navigate to sign up screen", async () => {
    await element(by.text("Don't have an account?")).tap()
    await element(by.text("Sign Up")).tap()
    await expect(element(by.text("Create Account"))).toBeVisible()
  })

  it("should navigate to forgot password screen", async () => {
    await element(by.text("Forgot Password?")).tap()
    await expect(element(by.text("Reset Password"))).toBeVisible()
  })

  it("should sign in with valid credentials", async () => {
    // Note: This test would use test credentials in a real implementation
    await element(by.id("email-input")).typeText("test@example.com")
    await element(by.id("password-input")).typeText("password123")
    await element(by.text("Sign In")).tap()

    // Wait for home screen to appear
    await waitFor(element(by.text("FlowMotion")))
      .toBeVisible()
      .withTimeout(5000)
  })
})
