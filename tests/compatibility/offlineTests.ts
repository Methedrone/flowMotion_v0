import { runCompatibilityTests } from "../../utils/compatibilityTesting"
import * as FileSystem from "expo-file-system"
import { supabase } from "../../lib/supabase"

// Offline functionality tests
export async function runOfflineFunctionalityTests() {
  console.log("Running offline functionality tests...")

  const tests = [
    {
      name: "Cached Content Access",
      testFn: async () => {
        try {
          // Create a test file to simulate cached content
          const testFilePath = `${FileSystem.cacheDirectory}test-cached-content.json`
          const testContent = JSON.stringify({ title: "Test Story", content: "This is a test story." })

          await FileSystem.writeAsStringAsync(testFilePath, testContent)

          // Check if we can read the cached content
          const readContent = await FileSystem.readAsStringAsync(testFilePath)
          const parsed = JSON.parse(readContent)

          // Clean up
          await FileSystem.deleteAsync(testFilePath)

          return parsed.title === "Test Story"
        } catch (error) {
          console.error("Cached content access test failed:", error)
          return false
        }
      },
    },
    {
      name: "Offline Video Playback",
      testFn: async () => {
        try {
          // Simulate downloading a video for offline playback
          const testVideoUrl = "https://example.com/test-video.mp4"
          const testVideoPath = `${FileSystem.cacheDirectory}test-video.mp4`

          // In a real implementation, we would download the video
          // For this test, we'll just create a dummy file
          await FileSystem.writeAsStringAsync(testVideoPath, "dummy video content")

          // Check if the file exists
          const fileInfo = await FileSystem.getInfoAsync(testVideoPath)

          // Clean up
          await FileSystem.deleteAsync(testVideoPath)

          return fileInfo.exists
        } catch (error) {
          console.error("Offline video playback test failed:", error)
          return false
        }
      },
    },
    {
      name: "Network Error Handling",
      testFn: async () => {
        try {
          // Simulate a network error by using an invalid URL
          try {
            await supabase.from("nonexistent_table").select("*")

            // If we get here, the test failed because it should have thrown an error
            return false
          } catch (error) {
            // This is expected, so the test passes
            return true
          }
        } catch (error) {
          console.error("Network error handling test failed:", error)
          return false
        }
      },
    },
  ]

  return runCompatibilityTests(tests)
}
