const { device, element, by, waitFor } = require("detox")

describe("Profile Screen", () => {
  beforeAll(async () => {
    // Sign in and navigate to profile screen
    await device.reloadReactNative()
    await element(by.id("email-input")).typeText("test@example.com")
    await element(by.id("password-input")).typeText("password123")
    await element(by.text("Sign In")).tap()
    await waitFor(element(by.text("FlowMotion")))
      .toBeVisible()
      .withTimeout(5000)

    // Navigate to profile screen
    await element(by.text("Profile")).tap()
  })

  it("should display profile screen with user info", async () => {
    // Verify user email is displayed
    await expect(element(by.id("user-email"))).toBeVisible()
  })

  it("should switch between favorites and quotes tabs", async () => {
    // Verify favorites tab is active by default
    await expect(element(by.id("favorites-tab-active"))).toBeVisible()

    // Tap quotes tab
    await element(by.text("Quotes")).tap()

    // Verify quotes tab is now active
    await expect(element(by.id("quotes-tab-active"))).toBeVisible()

    // Tap favorites tab again
    await element(by.text("Favorites")).tap()

    // Verify favorites tab is active again
    await expect(element(by.id("favorites-tab-active"))).toBeVisible()
  })

  it("should display subscription information", async () => {
    // Verify subscription section is visible
    await expect(element(by.id("subscription-container"))).toBeVisible()
  })

  it("should navigate to subscription page", async () => {
    // Tap subscribe button if visible
    if (await element(by.text("Subscribe Now")).isVisible()) {
      await element(by.text("Subscribe Now")).tap()

      // Verify subscription dialog
      await expect(element(by.text("Subscribe"))).toBeVisible()

      // Dismiss dialog
      await element(by.text("Cancel")).tap()
    }
  })

  it("should sign out", async () => {
    // Scroll to bottom to reveal sign out button
    await element(by.id("profile-scroll")).scrollTo("bottom")

    // Tap sign out button
    await element(by.text("Sign Out")).tap()

    // Verify we're back at sign in screen
    await expect(element(by.text("Sign In"))).toBeVisible()
  })
})
