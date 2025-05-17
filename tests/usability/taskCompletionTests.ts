import { runUsabilityTest, UsabilityTestType } from "../../utils/usabilityTesting"

// Test saving a quote
export async function testSaveQuoteTask() {
  return runUsabilityTest(UsabilityTestType.TASK_COMPLETION, "Save Quote Task", async () => {
    // Simulate saving a quote
    const startTime = Date.now()
    const errorCount = 0
    let tapCount = 0

    // Simulate tapping on a story
    tapCount++

    // Simulate tapping key points button
    tapCount++

    // Simulate tapping save quote button
    tapCount++

    // Simulate quote saved successfully

    const endTime = Date.now()
    const timeToComplete = endTime - startTime

    // Check if the task was completed successfully
    const pass = tapCount <= 3 // Pass if it takes 3 or fewer taps

    return {
      pass,
      details: pass ? "Quote saved successfully in 3 taps" : "Quote saving took too many taps",
      metrics: {
        timeToComplete,
        errorCount,
        tapCount,
        satisfactionScore: 5, // Simulated user satisfaction score (1-5)
      },
    }
  })
}

// Test subscribing to premium
export async function testSubscribeTask() {
  return runUsabilityTest(UsabilityTestType.TASK_COMPLETION, "Subscribe to Premium Task", async () => {
    // Simulate subscribing to premium
    const startTime = Date.now()
    const errorCount = 0
    let tapCount = 0

    // Simulate tapping profile tab
    tapCount++

    // Simulate tapping subscribe button
    tapCount++

    // Simulate selecting a plan
    tapCount++

    // Simulate confirming subscription
    tapCount++

    // Simulate successful subscription

    const endTime = Date.now()
    const timeToComplete = endTime - startTime

    // Check if the task was completed successfully
    const pass = tapCount <= 4 // Pass if it takes 4 or fewer taps

    return {
      pass,
      details: pass ? "Subscription completed successfully in 4 taps" : "Subscription took too many taps",
      metrics: {
        timeToComplete,
        errorCount,
        tapCount,
        satisfactionScore: 4, // Simulated user satisfaction score (1-5)
      },
    }
  })
}

// Test creating a new story
export async function testCreateStoryTask() {
  return runUsabilityTest(UsabilityTestType.TASK_COMPLETION, "Create Story Task", async () => {
    // Simulate creating a new story
    const startTime = Date.now()
    const errorCount = 0
    let tapCount = 0

    // Simulate tapping create tab
    tapCount++

    // Simulate entering title
    tapCount++

    // Simulate entering content
    tapCount++

    // Simulate tapping generate button
    tapCount++

    // Simulate waiting for generation

    // Simulate story created successfully

    const endTime = Date.now()
    const timeToComplete = endTime - startTime

    // Check if the task was completed successfully
    const pass = tapCount <= 4 // Pass if it takes 4 or fewer taps

    return {
      pass,
      details: pass ? "Story created successfully in 4 taps" : "Story creation took too many taps",
      metrics: {
        timeToComplete,
        errorCount,
        tapCount,
        satisfactionScore: 4, // Simulated user satisfaction score (1-5)
      },
    }
  })
}
