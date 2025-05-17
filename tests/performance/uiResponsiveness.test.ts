import { startMeasure, endMeasure, saveTestResults, PERFORMANCE_THRESHOLDS } from "../../utils/performanceTesting"
import { TouchableOpacity, TextInput, Button, View } from "react-native"
import { fireEvent, render, type RenderAPI } from "@testing-library/react-native"
import DeviceInfo from "react-native-device-info"
import { Platform } from "react-native"
import jest from "jest"

// Test configuration
const TEST_CONFIG = {
  iterations: 20,
  interactionTypes: ["button", "input", "navigation"] as const,
}

// Test results
const testResults = {
  device: {
    model: DeviceInfo.getModel(),
    os: Platform.OS,
    osVersion: Platform.Version,
    brand: DeviceInfo.getBrand(),
  },
  threshold: PERFORMANCE_THRESHOLDS.UI_RESPONSE_TIME_MS,
  iterations: TEST_CONFIG.iterations,
  results: [] as any[],
  summary: {
    averageResponseTime: 0,
    minResponseTime: 0,
    maxResponseTime: 0,
    passRate: 0,
    byInteractionType: {} as Record<
      string,
      {
        average: number
        passRate: number
      }
    >,
  },
}

// Simple test component
const TestComponent = ({
  onButtonPress,
  onInputChange,
  onNavigate,
}: {
  onButtonPress: () => void
  onInputChange: (text: string) => void
  onNavigate: () => void
}) => (
  <View>
    <TouchableOpacity testID="test-button" onPress={onButtonPress}>
      <Button title="Test Button" onPress={onButtonPress} />
    </TouchableOpacity>
    <TextInput testID="test-input" onChangeText={onInputChange} />
    <TouchableOpacity testID="test-navigation" onPress={onNavigate}>
      <Button title="Navigate" onPress={onNavigate} />
    </TouchableOpacity>
  </View>
)

// UI responsiveness test
export const runUIResponsivenessTest = async () => {
  console.log(`Starting UI responsiveness test (${TEST_CONFIG.iterations} iterations per interaction type)`)
  console.log(`Target threshold: ${PERFORMANCE_THRESHOLDS.UI_RESPONSE_TIME_MS}ms`)

  let rendered: RenderAPI
  const buttonPressHandler = jest.fn()
  const inputChangeHandler = jest.fn()
  const navigateHandler = jest.fn()

  // Render test component
  rendered = render(
    <TestComponent
      onButtonPress={buttonPressHandler}
      onInputChange={inputChangeHandler}
      onNavigate={navigateHandler}
    />,
  )

  // Test each interaction type
  for (const interactionType of TEST_CONFIG.interactionTypes) {
    console.log(`Testing ${interactionType} interactions...`)

    for (let i = 0; i < TEST_CONFIG.iterations; i++) {
      const measureId = startMeasure(`uiResponse_${interactionType}`)

      // Perform the interaction
      switch (interactionType) {
        case "button":
          fireEvent.press(rendered.getByTestId("test-button"))
          break
        case "input":
          fireEvent.changeText(rendered.getByTestId("test-input"), `test-${i}`)
          break
        case "navigation":
          fireEvent.press(rendered.getByTestId("test-navigation"))
          break
      }

      const result = endMeasure(measureId)

      testResults.results.push({
        iteration: i,
        interactionType,
        responseTime: result.duration,
        passed: result.passed,
        timestamp: new Date(),
      })

      console.log(`${interactionType} iteration ${i}: ${result.duration}ms (${result.passed ? "PASS" : "FAIL"})`)

      // Small delay between iterations
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  // Calculate summary
  const responseTimes = testResults.results.map((r) => r.responseTime)
  testResults.summary.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
  testResults.summary.minResponseTime = Math.min(...responseTimes)
  testResults.summary.maxResponseTime = Math.max(...responseTimes)
  testResults.summary.passRate = testResults.results.filter((r) => r.passed).length / testResults.results.length

  // Calculate summary by interaction type
  for (const interactionType of TEST_CONFIG.interactionTypes) {
    const typeResults = testResults.results.filter((r) => r.interactionType === interactionType)
    const typeTimes = typeResults.map((r) => r.responseTime)

    testResults.summary.byInteractionType[interactionType] = {
      average: typeTimes.reduce((a, b) => a + b, 0) / typeTimes.length,
      passRate: typeResults.filter((r) => r.passed).length / typeResults.length,
    }
  }

  console.log("UI responsiveness test completed")
  console.log(`Average response time: ${testResults.summary.averageResponseTime.toFixed(2)}ms`)
  console.log(`Pass rate: ${(testResults.summary.passRate * 100).toFixed(2)}%`)

  // Save results
  await saveTestResults("ui_responsiveness", testResults)

  return testResults
}

// Run the test if this file is executed directly
if (require.main === module) {
  runUIResponsivenessTest()
    .then(() => console.log("Test completed successfully"))
    .catch((error) => console.error("Test failed:", error))
}
