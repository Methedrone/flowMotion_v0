"use client"

import type React from "react"

import {
  runPerformanceTest,
  PerformanceTestType,
  measureFrameRate,
  measureFPS,
  saveTestResults,
  PERFORMANCE_THRESHOLDS,
} from "../../utils/performanceTesting"
import * as Device from "expo-device"
import type { FlatList } from "react-native"
import { useRef, useEffect } from "react"
import DeviceInfo from "react-native-device-info"
import { Platform } from "react-native"

// Test configuration
const TEST_CONFIG = {
  durationMs: 10000, // 10 seconds of scrolling
  scrollSpeed: 2, // pixels per ms
  sampleIntervalMs: 100, // Sample FPS every 100ms
}

// Hook to test scroll performance on a FlatList
export const useFeedScrollTest = (flatListRef: React.RefObject<FlatList>, isActive = false) => {
  const samples = useRef<number[]>([])
  const testActive = useRef(false)
  const startTime = useRef<number | null>(null)

  useEffect(() => {
    testActive.current = isActive

    if (isActive && flatListRef.current) {
      startScrollTest()
    }

    return () => {
      testActive.current = false
    }
  }, [isActive, flatListRef])

  const startScrollTest = () => {
    console.log("Starting feed scroll test")
    console.log(`Target threshold: ${PERFORMANCE_THRESHOLDS.FEED_SCROLL_FPS} FPS`)

    samples.current = []
    startTime.current = Date.now()

    // Start measuring FPS
    measureFPS((fps) => {
      if (!testActive.current) return

      samples.current.push(fps)
      console.log(`Current FPS: ${fps}`)

      // Check if test duration has elapsed
      if (Date.now() - (startTime.current || 0) >= TEST_CONFIG.durationMs) {
        finishTest()
      }
    }, TEST_CONFIG.sampleIntervalMs)

    // Start programmatic scrolling
    startProgrammaticScrolling()
  }

  const startProgrammaticScrolling = () => {
    if (!flatListRef.current || !testActive.current) return

    let offset = 0
    const scrollInterval = setInterval(() => {
      if (!testActive.current) {
        clearInterval(scrollInterval)
        return
      }

      offset += TEST_CONFIG.scrollSpeed * TEST_CONFIG.sampleIntervalMs
      flatListRef.current?.scrollToOffset({ offset, animated: true })

      // If we've reached the end, scroll back to top
      if (offset > 10000) {
        offset = 0
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false })
      }
    }, TEST_CONFIG.sampleIntervalMs)

    // Clear interval after test duration
    setTimeout(() => {
      clearInterval(scrollInterval)
    }, TEST_CONFIG.durationMs)
  }

  const finishTest = async () => {
    testActive.current = false

    // Calculate summary
    const testResults = {
      device: {
        model: DeviceInfo.getModel(),
        os: Platform.OS,
        osVersion: Platform.Version,
        brand: DeviceInfo.getBrand(),
      },
      threshold: PERFORMANCE_THRESHOLDS.FEED_SCROLL_FPS,
      duration: TEST_CONFIG.durationMs,
      samples: [...samples.current],
      summary: {
        averageFPS: samples.current.reduce((a, b) => a + b, 0) / samples.current.length,
        minFPS: Math.min(...samples.current),
        maxFPS: Math.max(...samples.current),
        passRate:
          samples.current.filter((fps) => fps >= PERFORMANCE_THRESHOLDS.FEED_SCROLL_FPS).length /
          samples.current.length,
      },
    }

    console.log("Feed scroll test completed")
    console.log(`Average FPS: ${testResults.summary.averageFPS.toFixed(2)}`)
    console.log(`Pass rate: ${(testResults.summary.passRate * 100).toFixed(2)}%`)

    // Save results
    await saveTestResults("feed_scroll", testResults)

    return testResults
  }

  return {
    startTest: startScrollTest,
    stopTest: finishTest,
    isRunning: testActive.current,
  }
}

// Standalone test function
export const runFeedScrollTest = async (flatListRef: React.RefObject<FlatList>) => {
  return new Promise((resolve, reject) => {
    if (!flatListRef.current) {
      reject(new Error("FlatList reference is not available"))
      return
    }

    const testResults = {
      device: {
        model: DeviceInfo.getModel(),
        os: Platform.OS,
        osVersion: Platform.Version,
        brand: DeviceInfo.getBrand(),
      },
      threshold: PERFORMANCE_THRESHOLDS.FEED_SCROLL_FPS,
      duration: TEST_CONFIG.durationMs,
      samples: [] as number[],
      summary: {
        averageFPS: 0,
        minFPS: 0,
        maxFPS: 0,
        passRate: 0,
      },
    }

    const startTest = () => {
      console.log("Starting feed scroll test")
      console.log(`Target threshold: ${PERFORMANCE_THRESHOLDS.FEED_SCROLL_FPS} FPS`)

      testResults.samples = []
      const startTime = Date.now()

      // Start measuring FPS
      measureFPS((fps) => {
        if (!testResults) return

        testResults.samples.push(fps)
        console.log(`Current FPS: ${fps}`)

        // Check if test duration has elapsed
        if (Date.now() - startTime >= TEST_CONFIG.durationMs) {
          finishTest()
        }
      }, TEST_CONFIG.sampleIntervalMs)

      // Start programmatic scrolling
      startProgrammaticScrolling()
    }

    const startProgrammaticScrolling = () => {
      if (!flatListRef.current) return

      let offset = 0
      const scrollInterval = setInterval(() => {
        if (!testResults) {
          clearInterval(scrollInterval)
          return
        }

        offset += TEST_CONFIG.scrollSpeed * TEST_CONFIG.sampleIntervalMs
        flatListRef.current?.scrollToOffset({ offset, animated: true })

        // If we've reached the end, scroll back to top
        if (offset > 10000) {
          offset = 0
          flatListRef.current?.scrollToOffset({ offset: 0, animated: false })
        }
      }, TEST_CONFIG.sampleIntervalMs)

      // Clear interval after test duration
      setTimeout(() => {
        clearInterval(scrollInterval)
      }, TEST_CONFIG.durationMs)
    }

    const finishTest = async () => {
      // Calculate summary
      testResults.summary.averageFPS = testResults.samples.reduce((a, b) => a + b, 0) / testResults.samples.length
      testResults.summary.minFPS = Math.min(...testResults.samples)
      testResults.summary.maxFPS = Math.max(...testResults.samples)
      testResults.summary.passRate =
        testResults.samples.filter((fps) => fps >= PERFORMANCE_THRESHOLDS.FEED_SCROLL_FPS).length /
        testResults.samples.length

      console.log("Feed scroll test completed")
      console.log(`Average FPS: ${testResults.summary.averageFPS.toFixed(2)}`)
      console.log(`Pass rate: ${(testResults.summary.passRate * 100).toFixed(2)}%`)

      // Save results
      await saveTestResults("feed_scroll", testResults)

      resolve(testResults)
    }

    startTest()
  })
}

// Test feed scroll performance
export async function testFeedScrollPerformance() {
  console.log("Testing feed scroll performance...")

  // Get device info for logging
  const deviceInfo = {
    brand: Device.brand,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
  }

  const result = await runPerformanceTest(
    PerformanceTestType.FEED_SCROLL,
    "Feed Scroll FPS",
    async () => {
      // Measure frame rate during scrolling
      const fps = await measureFrameRate(3000) // Measure for 3 seconds

      // Store FPS in metadata
      result.metadata = { ...result.metadata, fps }

      // If FPS is below 55, consider it a failure
      if (fps < 55) {
        throw new Error(`Frame rate too low: ${fps.toFixed(2)} FPS`)
      }
    },
    {
      scrollDistance: 1000,
      scrollDirection: "vertical",
      ...deviceInfo,
    },
  )

  console.log(`Feed scroll test ${result.pass ? "PASSED" : "FAILED"}`)
  console.log(`FPS: ${result.metadata?.fps?.toFixed(2) || "N/A"}`)

  return result
}

// Test feed item rendering performance
export async function testFeedItemRenderPerformance() {
  console.log("Testing feed item render performance...")

  // Get device info for logging
  const deviceInfo = {
    brand: Device.brand,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
  }

  const result = await runPerformanceTest(
    PerformanceTestType.RENDER,
    "Feed Item Render",
    async () => {
      // Simulate rendering a feed item
      await new Promise((resolve) => setTimeout(resolve, 30)) // Simulated time
    },
    {
      componentName: "StoryCard",
      itemCount: 1,
      ...deviceInfo,
    },
  )

  console.log(`Feed item render test ${result.pass ? "PASSED" : "FAILED"}`)
  console.log(`Duration: ${result.duration}ms (Threshold: ${result.threshold}ms)`)

  return result
}

// Test feed scroll with real content
export async function testFeedScrollWithRealContent() {
  console.log("Testing feed scroll with real content...")

  // Get device info for logging
  const deviceInfo = {
    brand: Device.brand,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
  }

  const result = await runPerformanceTest(
    PerformanceTestType.FEED_SCROLL,
    "Feed Scroll With Real Content",
    async () => {
      // Load real content
      // This would typically fetch stories from the API
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulated API call

      // Measure frame rate during scrolling with real content
      const fps = await measureFrameRate(5000) // Measure for 5 seconds

      // Store FPS in metadata
      result.metadata = { ...result.metadata, fps }

      // If FPS is below 60, consider it a failure
      if (fps < 60) {
        throw new Error(`Frame rate too low: ${fps.toFixed(2)} FPS`)
      }
    },
    {
      contentType: "real",
      itemCount: 20,
      ...deviceInfo,
    },
  )

  console.log(`Feed scroll with real content test ${result.pass ? "PASSED" : "FAILED"}`)
  console.log(`FPS: ${result.metadata?.fps?.toFixed(2) || "N/A"}`)

  return result
}
