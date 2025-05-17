const { device, element, by, waitFor } = require("detox")

describe("Create Screen", () => {
  beforeAll(async () => {
    // Sign in and navigate to create screen
    await device.reloadReactNative()
    await element(by.id("email-input")).typeText("test@example.com")
    await element(by.id("password-input")).typeText("password123")
    await element(by.text("Sign In")).tap()
    await waitFor(element(by.text("FlowMotion")))
      .toBeVisible()
      .withTimeout(5000)

    // Navigate to create screen
    await element(by.text("Create")).tap()
  })

  it("should display create screen", async () => {
    await expect(element(by.text("Create New Story"))).toBeVisible()
    await expect(element(by.text("Story Title"))).toBeVisible()
  })

  it("should show validation errors with empty fields", async () => {
    // Tap generate button without entering data
    await element(by.text("Generate Story")).tap()

    // Verify error messages
    await expect(element(by.text("Missing title"))).toBeVisible()
  })

  it("should switch between text and URL content types", async () => {
    // Tap URL tab
    await element(by.text("URL")).tap()

    // Verify URL input is shown
    await expect(element(by.text("Source URL"))).toBeVisible()

    // Tap Text tab
    await element(by.text("Text")).tap()

    // Verify Text input is shown
    await expect(element(by.text("Source Content"))).toBeVisible()
  })

  it("should clear form when tapping clear button", async () => {
    // Enter title
    await element(by.id("title-input")).typeText("Test Story")

    // Enter content
    await element(by.id("content-input")).typeText("This is a test story content.")

    // Tap clear button
    await element(by.text("Clear")).tap()

    // Verify fields are cleared
    const titleAttributes = await element(by.id("title-input")).getAttributes()
    expect(titleAttributes.text).toBe("")

    const contentAttributes = await element(by.id("content-input")).getAttributes()
    expect(contentAttributes.text).toBe("")
  })

  it("should generate a story with valid inputs", async () => {
    // Enter title
    await element(by.id("title-input")).typeText("Test Story")

    // Enter content
    await element(by.id("content-input")).typeText(
      "This is a test story about personal growth and development. The main character learns to overcome challenges and achieve their goals through perseverance and dedication.",
    )

    // Tap generate button
    await element(by.text("Generate Story")).tap()

    // Verify generation progress is shown
    await expect(element(by.text("Generating Script"))).toBeVisible()

    // Wait for generation to complete (this would take longer in a real app)
    await waitFor(element(by.text("Complete")))
      .toBeVisible()
      .withTimeout(10000)

    // Verify success message
    await expect(element(by.text("Story Generated Successfully"))).toBeVisible()
  })
})
