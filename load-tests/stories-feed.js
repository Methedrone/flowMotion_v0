import http from "k6/http"
import { sleep, check } from "k6"
import { Counter } from "k6/metrics"

// Custom metrics
const storiesRetrieved = new Counter("stories_retrieved")

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Ramp up to 10 users over 30 seconds
    { duration: "1m", target: 10 }, // Stay at 10 users for 1 minute
    { duration: "30s", target: 50 }, // Ramp up to 50 users over 30 seconds
    { duration: "1m", target: 50 }, // Stay at 50 users for 1 minute
    { duration: "30s", target: 100 }, // Ramp up to 100 users over 30 seconds
    { duration: "1m", target: 100 }, // Stay at 100 users for 1 minute
    { duration: "30s", target: 0 }, // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests should be below 500ms
    http_req_failed: ["rate<0.01"], // Less than 1% of requests should fail
  },
}

// Test setup - would include authentication in a real test
const BASE_URL = "https://your-supabase-url.supabase.co"
const API_KEY = "your-anon-key" // This would be stored securely in a real test

// Main test function
export default function () {
  // Set up headers
  const headers = {
    "Content-Type": "application/json",
    apikey: API_KEY,
    Authorization: `Bearer ${API_KEY}`,
  }

  // Test the stories feed endpoint
  const storiesResponse = http.get(`${BASE_URL}/rest/v1/stories?order=created_at.desc`, { headers })

  // Check if the request was successful
  check(storiesResponse, {
    "stories status is 200": (r) => r.status === 200,
    "stories response has data": (r) => r.json().length > 0,
  })

  // Count the number of stories retrieved
  if (storiesResponse.status === 200) {
    const stories = storiesResponse.json()
    storiesRetrieved.add(stories.length)
  }

  // Simulate user behavior - pause between actions
  sleep(Math.random() * 3 + 1) // Random sleep between 1-4 seconds
}
