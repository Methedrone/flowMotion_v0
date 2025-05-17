import http from "k6/http"
import { check, sleep } from "k6"
import { Counter, Rate, Trend } from "k6/metrics"
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.1.0/index.js"
import { randomItem } from "https://jslib.k6.io/k6-utils/1.1.0/index.js"
import { __ENV } from "k6"

// Custom metrics
const storyboardRequests = new Counter("storyboard_requests")
const animationRequests = new Counter("animation_requests")
const keyPointsRequests = new Counter("keypoints_requests")
const pipelineCompletions = new Counter("pipeline_completions")
const pipelineFailRate = new Rate("pipeline_fail_rate")
const storyboardTime = new Trend("storyboard_time")
const animationTime = new Trend("animation_time")
const keyPointsTime = new Trend("keypoints_time")
const totalPipelineTime = new Trend("total_pipeline_time")

// Test configuration - can be overridden with environment variables
const BASE_URL = __ENV.BASE_URL || "https://flowmotion-api.example.com"
const USERS = Number.parseInt(__ENV.USERS) || 50 // Fewer users for AI pipeline test
const DURATION = __ENV.DURATION || "10m"
const RAMP_UP = __ENV.RAMP_UP || "1m"

// Sample story prompts
const STORY_PROMPTS = [
  "A day in the life of a software developer",
  "How to make the perfect cup of coffee",
  "The history of the internet in 60 seconds",
  "Top 5 productivity tips for remote workers",
  "A beginner's guide to meditation",
  "The science behind a good night's sleep",
  "How electric cars are changing the automotive industry",
  "The future of artificial intelligence",
  "A tour of the solar system",
  "Understanding blockchain technology",
]

// Options for the load test
export const options = {
  scenarios: {
    ai_pipeline: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: RAMP_UP, target: USERS }, // Ramp up to target users
        { duration: DURATION, target: USERS }, // Stay at target for the duration
        { duration: "30s", target: 0 }, // Ramp down
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    total_pipeline_time: ["p95<30000"], // 95% of pipelines should complete in under 30s
    pipeline_fail_rate: ["rate<0.05"], // Less than 5% failure rate
  },
}

// Setup function - runs once per VU
export function setup() {
  // Create a pool of test users
  const users = []
  for (let i = 0; i < 20; i++) {
    users.push({
      id: `test-user-${i}`,
      token: `test-token-${i}`,
    })
  }

  return { users }
}

// Default function - runs for each VU
export default function (data) {
  // Select a random user from the pool
  const user = data.users[randomIntBetween(0, data.users.length - 1)]

  // Select a random prompt
  const prompt = randomItem(STORY_PROMPTS)

  // Start timing the entire pipeline
  const pipelineStartTime = new Date().getTime()
  let pipelineSuccess = true

  // Step 1: Generate storyboard
  const storyboardStartTime = new Date().getTime()
  const storyboardResponse = http.post(
    `${BASE_URL}/functions/generateStoryScript`,
    JSON.stringify({
      prompt: prompt,
      userId: user.id,
    }),
    {
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
    },
  )

  storyboardRequests.add(1)
  const storyboardTimeMs = new Date().getTime() - storyboardStartTime
  storyboardTime.add(storyboardTimeMs)

  const storyboardSuccess = check(storyboardResponse, {
    "storyboard status is 200": (r) => r.status === 200,
    "storyboard has script": (r) => r.json("script") !== undefined,
  })

  if (!storyboardSuccess) {
    pipelineSuccess = false
    pipelineFailRate.add(1)
    return
  }

  // Get the storyboard ID from the response
  const storyboardId = storyboardResponse.json("id")

  // Simulate some processing time
  sleep(randomIntBetween(1, 3))

  // Step 2: Generate animation assets
  const animationStartTime = new Date().getTime()
  const animationResponse = http.post(
    `${BASE_URL}/functions/generateAnimationAssets`,
    JSON.stringify({
      storyboardId: storyboardId,
      userId: user.id,
    }),
    {
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
    },
  )

  animationRequests.add(1)
  const animationTimeMs = new Date().getTime() - animationStartTime
  animationTime.add(animationTimeMs)

  const animationSuccess = check(animationResponse, {
    "animation status is 200": (r) => r.status === 200,
    "animation has assets": (r) => r.json("assets") !== undefined,
  })

  if (!animationSuccess) {
    pipelineSuccess = false
    pipelineFailRate.add(1)
    return
  }

  // Get the animation ID from the response
  const animationId = animationResponse.json("id")

  // Simulate some processing time
  sleep(randomIntBetween(1, 3))

  // Step 3: Extract key points
  const keyPointsStartTime = new Date().getTime()
  const keyPointsResponse = http.post(
    `${BASE_URL}/functions/extractKeyPoints`,
    JSON.stringify({
      storyboardId: storyboardId,
      animationId: animationId,
      userId: user.id,
    }),
    {
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
    },
  )

  keyPointsRequests.add(1)
  const keyPointsTimeMs = new Date().getTime() - keyPointsStartTime
  keyPointsTime.add(keyPointsTimeMs)

  const keyPointsSuccess = check(keyPointsResponse, {
    "key points status is 200": (r) => r.status === 200,
    "key points has data": (r) => r.json("keyPoints") !== undefined,
  })

  if (!keyPointsSuccess) {
    pipelineSuccess = false
    pipelineFailRate.add(1)
    return
  }

  // Calculate total pipeline time
  const totalTimeMs = new Date().getTime() - pipelineStartTime
  totalPipelineTime.add(totalTimeMs)

  // Record pipeline completion
  pipelineCompletions.add(1)
  if (!pipelineSuccess) {
    pipelineFailRate.add(1)
  } else {
    pipelineFailRate.add(0)
  }

  // Log the result
  console.log(
    `Pipeline completed in ${totalTimeMs}ms (Storyboard: ${storyboardTimeMs}ms, Animation: ${animationTimeMs}ms, KeyPoints: ${keyPointsTimeMs}ms)`,
  )

  // Simulate cooldown between requests
  sleep(randomIntBetween(5, 15))
}

// Teardown function - runs once per test
export function teardown(data) {
  console.log("AI pipeline load test completed")
}
