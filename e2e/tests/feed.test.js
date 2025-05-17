const { device, element, by, waitFor } = require("detox")

describe("Feed Screen", () => {
  beforeAll(async () => {
    // Sign in before tests
    await device.reloadReactNative()
    await element(by.id("email-input")).typeText("test@example.com")
    await element(by.id("password-input")).typeText("password123")
    await element(by.text("Sign In")).tap()
    await waitFor(element(by.text("FlowMotion")))
      .toBeVisible()
      .withTimeout(5000)
  })

  it("should display feed screen with stories", async () => {
    await expect(element(by.text("FlowMotion"))).toBeVisible()

    // Check if at least one story is visible
    await waitFor(element(by.id("story-item")))
      .toBeVisible()
      .withTimeout(5000)
  })

  it("should be able to scroll through stories", async () => {
    // Get the first story title
    const firstStoryTitle = await element(by.id("story-title")).getAttributes()

    // Scroll down to next story
    await element(by.id("feed-list")).scroll(500, "down")

    // Wait for scroll animation to complete
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Get the new story title
    const secondStoryTitle = await element(by.id("story-title")).getAttributes()

    // Verify it's a different story
    expect(firstStoryTitle.text).not.toEqual(secondStoryTitle.text)
  })

  it("should navigate to player screen when tapping a story", async () => {
    // Tap on the first story
    await element(by.id("story-item")).atIndex(0).tap()

    // Verify player screen is shown
    await waitFor(element(by.id("player-controls")))
      .toBeVisible()
      .withTimeout(2000)

    // Go back to feed
    await element(by.id("back-button")).tap()
  })

  it("should refresh feed when pulling down", async () => {
    // Pull to refresh
    await element(by.id("feed-list")).swipe("down", "slow")

    // Verify refresh indicator is shown
    await expect(element(by.id("refresh-indicator"))).toBeVisible()

    // Wait for refresh to complete
    await waitFor(element(by.id("refresh-indicator")))
      .toBeNotVisible()
      .withTimeout(5000)
  })
})
