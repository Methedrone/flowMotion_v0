"use client"

import { useEffect, useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { supabase } from "./lib/supabase"
import type { Session } from "@supabase/supabase-js"
import { AppState, type AppStateStatus } from "react-native"

// Initialize i18n
import "../i18n"

// Initialize monitoring
import { initializeMonitoring } from "../utils/appInitialization"
import { trackScreenView } from "../utils/sentry"

// Screens
import SignInScreen from "./screens/auth/SignInScreen"
import SignUpScreen from "./screens/auth/SignUpScreen"
import ForgotPasswordScreen from "./screens/auth/ForgotPasswordScreen"
import FeedScreen from "./screens/main/FeedScreen"
import PlayerScreen from "./screens/main/PlayerScreen"
import ProfileScreen from "./screens/main/ProfileScreen"
import CreateScreen from "./screens/main/CreateScreen"
import AnalyticsDashboardScreen from "./screens/admin/AnalyticsDashboardScreen"

// Components
import LoadingScreen from "./components/LoadingScreen"
import SplashScreen from "./components/SplashScreen"
import { ToastProvider } from "./components/providers/ToastProvider"
import { LoadingProvider } from "./components/providers/LoadingProvider"

// Navigation Types
import type { RootStackParamList, AuthStackParamList, MainTabParamList } from "./types/navigation"

// Icons
import { Home, Play, User, PlusCircle, BarChart } from "lucide-react-native"
import { COLORS } from "./constants/theme"

// Analytics
import {
  startSession,
  endSession,
  trackScreenView as trackAnalyticsScreenView,
  AnalyticsEventType,
  logEvent,
} from "./services/analytics"

// Create navigation stacks
const Stack = createNativeStackNavigator<RootStackParamList>()
const AuthStack = createNativeStackNavigator<AuthStackParamList>()
const MainTab = createBottomTabNavigator<MainTabParamList>()

// Auth Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  )
}

// Main Tab Navigator
function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Feed") {
            return <Home size={size} color={color} />
          } else if (route.name === "Player") {
            return <Play size={size} color={color} />
          } else if (route.name === "Create") {
            return <PlusCircle size={size} color={color} />
          } else if (route.name === "Profile") {
            return <User size={size} color={color} />
          } else if (route.name === "Analytics") {
            return <BarChart size={size} color={color} />
          }
          return null
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginBottom: 4,
        },
      })}
    >
      <MainTab.Screen
        name="Feed"
        component={FeedScreen}
        listeners={{
          tabPress: () => {
            trackAnalyticsScreenView("Feed")
            trackScreenView("Feed")
          },
        }}
      />
      <MainTab.Screen
        name="Player"
        component={PlayerScreen}
        listeners={{
          tabPress: () => {
            trackAnalyticsScreenView("Player")
            trackScreenView("Player")
          },
        }}
      />
      <MainTab.Screen
        name="Create"
        component={CreateScreen}
        listeners={{
          tabPress: () => {
            trackAnalyticsScreenView("Create")
            trackScreenView("Create")
          },
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        listeners={{
          tabPress: () => {
            trackAnalyticsScreenView("Profile")
            trackScreenView("Profile")
          },
        }}
      />
      <MainTab.Screen
        name="Analytics"
        component={AnalyticsDashboardScreen}
        listeners={{
          tabPress: () => {
            trackAnalyticsScreenView("Analytics")
            trackScreenView("Analytics")
          },
        }}
      />
    </MainTab.Navigator>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)

  // Initialize monitoring
  useEffect(() => {
    initializeMonitoring()
  }, [])

  // Track app state for analytics
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        // App came to foreground
        startSession()
        logEvent(AnalyticsEventType.APP_OPEN)
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        // App went to background
        endSession()
      }
    }

    // Start session when app loads
    startSession()
    logEvent(AnalyticsEventType.APP_OPEN)

    // Subscribe to app state changes
    const subscription = AppState.addEventListener("change", handleAppStateChange)

    return () => {
      // End session when component unmounts
      endSession()
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    // Show splash screen for at least 2.5 seconds
    const splashTimer = setTimeout(() => {
      setShowSplash(false)
    }, 2500)

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)

      // Track sign in/sign out events
      if (session) {
        logEvent(AnalyticsEventType.SIGN_IN)
      }
    })

    // Check for existing session
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
    }

    checkSession()

    // Cleanup
    return () => {
      subscription.unsubscribe()
      clearTimeout(splashTimer)
    }
  }, [])

  if (showSplash) {
    return <SplashScreen />
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <ToastProvider>
      <LoadingProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {session ? (
              <Stack.Screen name="Main" component={MainNavigator} />
            ) : (
              <Stack.Screen name="Auth" component={AuthNavigator} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </LoadingProvider>
    </ToastProvider>
  )
}
