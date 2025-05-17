import http from "k6/http"
import { sleep, check } from "k6"
import { Counter, Rate, Trend } from "k6/metrics"
import { __ENV } from "k6/env"

// Custom metrics
const storiesRequests = new Counter("stories_requests")
const storiesFailRate = new Rate("stories_fail_rate")
const storiesResponseTime = new Trend("stories_response_time")

// Options
export const options = {
  scenarios: {
    constant_request_rate: {
      executor: "constant-arrival-rate",
      rate: 50, // 50 requests per second
      timeUnit: "1s",
      duration: "1m",
      preAllocatedVUs: 50,
      maxVUs: 100,
    },
  },
  thresholds: {
    stories_fail_rate: ["rate<0.01"], // Less than 1% failure rate
    stories_response_time: ["p(95)<500"], // 95% of requests should be below 500ms
    http_req_duration: ["p(95)<500"], // 95% of requests should be below 500ms
  },
}

// Simulated JWT token (would be generated in a real scenario)
const JWT_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

// Main function
export default function () {
  const apiUrl = __ENV.API_URL || "https://example.com"
  const storiesUrl = `${apiUrl}/rest/v1/stories?select=*&order=created_at.desc`

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
      apikey: __ENV.SUPABASE_ANON_KEY || "anon-key",
    },
  }

  // Measure response time
  const startTime = new Date()

  // Make request
  const response = storiesRequest(storiesUrl, params)

  // Calculate response time
  const endTime = new Date()
  const responseTime = endTime - startTime

  // Record metrics
  storiesResponseTime.add(responseTime)

  // Sleep between requests
  sleep(1)
}

function storiesRequest(url, params) {
  storiesRequests.add(1)

  const response = http.get(url, params)

  const success = check(response, {
    "status is 200": (r) => r.status === 200,
    "response body is not empty": (r) => r.body.length > 0,
    "response is JSON": (r) => {
      try {
        JSON.parse(r.body)
        return true
      } catch (e) {
        return false
      }
    },
  })

  if (!success) {
    storiesFailRate.add(1)
    console.log(`Request failed: ${response.status} - ${response.body}`)
  } else {
    storiesFailRate.add(0)
  }

  return response
}
