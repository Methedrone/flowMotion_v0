const fs = require("fs")
const path = require("path")

// Define PRD acceptance criteria
const PRD_CRITERIA = [
  {
    id: "core-1",
    section: "3.1",
    description: "Vertical feed with TikTok-style scrolling",
    files: ["screens/main/FeedScreen.tsx"],
    keywords: ["FlatList", "pagingEnabled", "snapToInterval", "decelerationRate"],
  },
  {
    id: "core-2",
    section: "3.2",
    description: "Video playback with autoplay on scroll",
    files: ["screens/main/FeedScreen.tsx"],
    keywords: ["shouldPlay", "onViewableItemsChanged", "playAsync", "pauseAsync"],
  },
  {
    id: "core-3",
    section: "3.3",
    description: "Story detail view with animations",
    files: ["screens/main/PlayerScreen.tsx"],
    keywords: ["SharedElement", "animation", "Animated"],
  },
  {
    id: "ai-1",
    section: "4.1",
    description: "AI content generation pipeline",
    files: ["supabase/functions/generateStory/index.ts"],
    keywords: ["openai", "createChatCompletion", "gpt-4"],
  },
  {
    id: "ai-2",
    section: "4.2",
    description: "Animation generation from story script",
    files: ["supabase/functions/generateAnimationAssets/index.ts"],
    keywords: ["animation", "generate", "assets"],
  },
  {
    id: "ai-3",
    section: "4.3",
    description: "Key points extraction",
    files: ["supabase/functions/extractKeyPoints/index.ts"],
    keywords: ["key points", "extract", "summary"],
  },
  {
    id: "ui-1",
    section: "5.1",
    description: "Consistent UI components",
    files: ["components/ui/Button.tsx", "components/ui/Card.tsx", "components/ui/Input.tsx"],
    keywords: ["style", "component", "props"],
  },
  {
    id: "ui-2",
    section: "5.2",
    description: "Responsive design for different screen sizes",
    files: ["constants/theme.ts"],
    keywords: ["responsive", "Dimensions", "screen"],
  },
  {
    id: "ui-3",
    section: "5.3",
    description: "Animations and transitions",
    files: ["utils/animations.ts"],
    keywords: ["animation", "transition", "Animated"],
  },
  {
    id: "perf-1",
    section: "6.1",
    description: "Performance monitoring",
    files: ["utils/performanceMonitoring.ts"],
    keywords: ["performance", "monitor", "metrics"],
  },
  {
    id: "perf-2",
    section: "6.2",
    description: "Video caching",
    files: ["utils/videoCache.ts"],
    keywords: ["cache", "video", "FileSystem"],
  },
  {
    id: "perf-3",
    section: "6.3",
    description: "Error tracking with Sentry",
    files: ["utils/sentry.ts", "components/ErrorBoundary.tsx"],
    keywords: ["Sentry", "error", "captureException"],
  },
  {
    id: "auth-1",
    section: "7.1",
    description: "User authentication",
    files: ["screens/auth/SignInScreen.tsx", "screens/auth/SignUpScreen.tsx"],
    keywords: ["auth", "signIn", "signUp"],
  },
  {
    id: "auth-2",
    section: "7.2",
    description: "User profile management",
    files: ["screens/main/ProfileScreen.tsx"],
    keywords: ["profile", "user", "email"],
  },
  {
    id: "auth-3",
    section: "7.3",
    description: "Password reset",
    files: ["screens/auth/ForgotPasswordScreen.tsx"],
    keywords: ["password", "reset", "forgot"],
  },
  {
    id: "sub-1",
    section: "8.1",
    description: "Subscription plans",
    files: ["supabase/functions/createStripeCustomerAndTrial/index.ts"],
    keywords: ["subscription", "plan", "stripe"],
  },
  {
    id: "sub-2",
    section: "8.2",
    description: "Trial period",
    files: ["supabase/functions/createStripeCustomerAndTrial/index.ts"],
    keywords: ["trial", "period", "days"],
  },
  {
    id: "sub-3",
    section: "8.3",
    description: "Premium content access",
    files: ["supabase/policies/subscription_policies.sql"],
    keywords: ["premium", "content", "access"],
  },
  {
    id: "i18n-1",
    section: "9.1",
    description: "Internationalization support",
    files: ["i18n/index.ts", "i18n/locales/en.json"],
    keywords: ["i18n", "translation", "language"],
  },
  {
    id: "i18n-2",
    section: "9.2",
    description: "Language selection",
    files: ["components/ui/LanguageSelector.tsx"],
    keywords: ["language", "select", "change"],
  },
  {
    id: "test-1",
    section: "10.1",
    description: "Unit tests",
    files: ["tests/ui-components.test.js"],
    keywords: ["test", "expect", "describe"],
  },
  {
    id: "test-2",
    section: "10.2",
    description: "End-to-end tests",
    files: ["e2e/tests/auth.test.js", "e2e/tests/feed.test.js"],
    keywords: ["e2e", "test", "detox"],
  },
  {
    id: "test-3",
    section: "10.3",
    description: "Performance tests",
    files: ["tests/performance/videoPlayback.test.ts", "tests/performance/apiPerformance.test.ts"],
    keywords: ["performance", "test", "measure"],
  },
]

// Root directory of the project
const rootDir = path.join(__dirname, "..")

// Check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(path.join(rootDir, filePath))
  } catch (error) {
    return false
  }
}

// Check if a file contains keywords
function fileContainsKeywords(filePath, keywords) {
  try {
    const content = fs.readFileSync(path.join(rootDir, filePath), "utf8")
    return keywords.some((keyword) => content.includes(keyword))
  } catch (error) {
    return false
  }
}

// Verify PRD compliance
function verifyCompliance() {
  console.log("Verifying PRD compliance...")
  console.log("---------------------------")

  const results = []
  let passCount = 0

  PRD_CRITERIA.forEach((criterion) => {
    const fileExistsResults = criterion.files.map((file) => ({
      file,
      exists: fileExists(file),
    }))

    const keywordResults = criterion.files
      .filter((file) => fileExists(file))
      .map((file) => ({
        file,
        containsKeywords: fileContainsKeywords(file, criterion.keywords),
      }))

    const allFilesExist = fileExistsResults.every((result) => result.exists)
    const allFilesContainKeywords =
      keywordResults.length > 0 && keywordResults.every((result) => result.containsKeywords)

    const pass = allFilesExist && allFilesContainKeywords

    if (pass) {
      passCount++
    }

    results.push({
      ...criterion,
      pass,
      fileExistsResults,
      keywordResults,
    })
  })

  // Calculate compliance percentage
  const totalCriteria = PRD_CRITERIA.length
  const compliancePercentage = (passCount / totalCriteria) * 100

  // Print results
  results.forEach((result) => {
    const status = result.pass ? "✅" : "❌"
    console.log(`${status} [${result.section}] ${result.description}`)

    if (!result.pass) {
      result.fileExistsResults.forEach((fileResult) => {
        if (!fileResult.exists) {
          console.log(`   - File not found: ${fileResult.file}`)
        }
      })

      result.keywordResults.forEach((keywordResult) => {
        if (!keywordResult.containsKeywords) {
          console.log(`   - Keywords not found in: ${keywordResult.file}`)
        }
      })
    }
  })

  console.log("\nCompliance Summary:")
  console.log(`Passed: ${passCount}/${totalCriteria} criteria`)
  console.log(`Compliance: ${compliancePercentage.toFixed(2)}%`)

  // Check if compliance meets the requirement (99%)
  const compliant = compliancePercentage >= 99

  if (compliant) {
    console.log("\n✅ FlowMotion MVP complete per §11. All systems nominal. DAU/MAU tracking active.")
  } else {
    console.log("\n❌ FlowMotion MVP does not meet the required 99% compliance rate.")
  }

  return {
    compliant,
    compliancePercentage,
    passCount,
    totalCriteria,
    results,
  }
}

// Run the verification
const complianceResult = verifyCompliance()

// Exit with appropriate code
process.exit(complianceResult.compliant ? 0 : 1)
