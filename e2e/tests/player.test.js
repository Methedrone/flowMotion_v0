import { device, element, by, waitFor } from "detox"

describe("Player Screen", () => {
  beforeAll(async () => {
    // Sign in and navigate to player screen
    await device.reloadReactNative()
    await element(by.id("email-input")).typeText("test@example.com")
    await element(by.id("password-input")).typeText("password123")
    await element(by.text("Sign In")).tap()
    await waitFor(element(by.text("FlowMotion")))
      .toBeVisible()
      .withTimeout(5000)

    // Tap on the first story
    await element(by.id("story-item")).atIndex(0).tap()

    // Verify player screen is shown
    await waitFor(element(by.id("player-controls")))
      .toBeVisible()
      .withTimeout(2000)
  })

  it("should play video automatically", async () => {
    // Verify video is playing (progress bar is moving)
    const initialProgress = await element(by.id("progress-bar")).getAttributes()

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Check progress again
    const newProgress = await element(by.id("progress-bar")).getAttributes()

    // Verify progress has increased
    expect(Number.parseFloat(newProgress.width)).toBeGreaterThan(Number.parseFloat(initialProgress.width))
  })

  it("should pause and resume video", async () => {
    // Tap play/pause button
    await element(by.id("play-pause-button")).tap()

    // Verify video is paused
    await expect(element(by.id("play-icon"))).toBeVisible()

    // Tap play/pause button again
    await element(by.id("play-pause-button")).tap()

    // Verify video is playing
    await expect(element(by.id("pause-icon"))).toBeVisible()
  })

  it("should mute and unmute video", async () => {
    // Tap mute button
    await element(by.id("mute-button")).tap()

    // Verify video is muted
    await expect(element(by.id("muted-icon"))).toBeVisible()

    // Tap mute button again
    await element(by.id("mute-button")).tap()

    // Verify video is unmuted
    await expect(element(by.id("unmuted-icon"))).toBeVisible()
  })

  it("should toggle key points", async () => {
    // Tap key points button
    await element(by.text("Key Points")).tap()

    // Verify key points are shown
    await expect(element(by.id("key-points-container"))).toBeVisible()

    // Tap key points button again
    await element(by.text("Key Points")).tap()

    // Verify key points are hidden
    await expect(element(by.id("key-points-container"))).toBeNotVisible()
  })

  it("should add and remove from favorites", async () => {
    // Tap favorite button
    await element(by.id("favorite-button")).tap()

    // Verify favorite status
    await expect(element(by.text("Favorited"))).toBeVisible()

    // Tap favorite button again
    await element(by.id("favorite-button")).tap()

    // Verify unfavorite status
    await expect(element(by.text("Favorite"))).toBeVisible()
  })

  it("should save a quote", async () => {
    // Tap key points button to show key points
    await element(by.text("Key Points")).tap()

    // Tap save quote button on first key point
    await element(by.id("save-quote-button")).atIndex(0).tap()

    // Verify success message
    await expect(element(by.text("Quote saved successfully"))).toBeVisible()
  })
})
