import http from "k6/http"
import { sleep, check } from "k6"
import { Trend } from "k6/metrics"

// Custom metrics
const videoStreamingTime = new Trend("video_streaming_time")
const videoChunkSize = new Trend("video_chunk_size")

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 5 }, // Ramp up to 5 users over 30 seconds
    { duration: "1m", target: 5 }, // Stay at 5 users for 1 minute
    { duration: "30s", target: 20 }, // Ramp up to 20 users over 30 seconds
    { duration: "1m", target: 20 }, // Stay at 20 users for 1 minute
    { duration: "30s", target: 50 }, // Ramp up to 50 users over 30 seconds
    { duration: "1m", target: 50 }, // Stay at 50 users for 1 minute
    { duration: "30s", target: 0 }, // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% of requests should be below 2000ms
    http_req_failed: ["rate<0.05"], // Less than 5% of requests should fail
  },
}

// Test setup
const BASE_URL = "https://your-supabase-url.supabase.co"
const API_KEY = "your-anon-key" // This would be stored securely in a real test

// Sample video URLs - in a real test, these would be retrieved dynamically
const VIDEO_URLS = [
  "https://your-storage-url.com/videos/sample1.mp4",
  "https://your-storage-url.com/videos/sample2.mp4",
  "https://your-storage-url.com/videos/sample3.mp4",
]

// Main test function
export default function () {
  // Set up headers
  const headers = {
    apikey: API_KEY,
    Authorization: `Bearer ${API_KEY}`,
    Range: "bytes=0-1000000", // Request first 1MB chunk
  }

  // Select a random video URL
  const videoUrl = VIDEO_URLS[Math.floor(Math.random() * VIDEO_URLS.length)]

  // Simulate streaming by requesting a chunk of the video
  const startTime = new Date()
  const videoResponse = http.get(videoUrl, { headers })
  const endTime = new Date()

  // Calculate streaming time
  const streamingTime = endTime - startTime
  videoStreamingTime.add(streamingTime)

  // Check if the request was successful
  check(videoResponse, {
    "video status is 206 (Partial Content)": (r) => r.status === 206,
    "video response has content": (r) => r.body.length > 0,
  })

  // Record chunk size
  if (videoResponse.status === 206) {
    videoChunkSize.add(videoResponse.body.length)
  }

  // Simulate user watching video for a while
  sleep(Math.random() * 5 + 3) // Random sleep between 3-8 seconds

  // Request another chunk (simulating continued playback)
  headers.Range = "bytes=1000001-2000000" // Next 1MB chunk

  const nextChunkResponse = http.get(videoUrl, { headers })

  check(nextChunkResponse, {
    "next chunk status is 206": (r) => r.status === 206,
  })

  // Simulate more watching
  sleep(Math.random() * 5 + 3)
}
