import { runPerformanceTest, PerformanceTestType } from "../../utils/performanceTesting"

// Test video playback start time
export async function testVideoPlaybackStartTime() {
  console.log("Testing video playback start time...")

  const result = await runPerformanceTest(
    PerformanceTestType.VIDEO_PLAYBACK,
    "Video Start Time",
    async () => {
      // Simulate video loading and playback start
      await new Promise((resolve) => setTimeout(resolve, 350)) // Simulated time
    },
    {
      videoQuality: "high",
      videoDuration: 120, // seconds
      videoSize: 15000000, // bytes
    },
  )

  console.log(`Video playback start test ${result.pass ? "PASSED" : "FAILED"}`)
  console.log(`Duration: ${result.duration}ms (Threshold: ${result.threshold}ms)`)

  return result
}

// Test video seeking performance
export async function testVideoSeekingPerformance() {
  console.log("Testing video seeking performance...")

  const result = await runPerformanceTest(
    PerformanceTestType.VIDEO_PLAYBACK,
    "Video Seeking",
    async () => {
      // Simulate video seeking
      await new Promise((resolve) => setTimeout(resolve, 200)) // Simulated time
    },
    {
      seekDistance: 30, // seconds
      videoQuality: "high",
    },
    300, // Custom threshold for seeking (300ms)
  )

  console.log(`Video seeking test ${result.pass ? "PASSED" : "FAILED"}`)
  console.log(`Duration: ${result.duration}ms (Threshold: ${result.threshold}ms)`)

  return result
}
