"use client"

import { useEffect, useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../lib/supabase"
import type { Session } from "@supabase/supabase-js"

// Screens
import SignInScreen from "../screens/auth/SignInScreen"
import SignUpScreen from "../screens/auth/SignUpScreen"
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen"
import FeedScreen from "../screens/main/FeedScreen"
import PlayerScreen from "../screens/main/PlayerScreen"
import ProfileScreen from "../screens/main/ProfileScreen"
import CreateScreen from "../screens/main/CreateScreen"
import AnalyticsDashboardScreen from "../screens/admin/AnalyticsDashboardScreen"
import SplashScreen from "../components/SplashScreen"
import LoadingScreen from "../components/LoadingScreen"

// Types
import type { AuthStackParamList, MainTabParamList } from "../types/navigation"
import { COLORS } from "../constants/theme"

const AuthStack = createStackNavigator<AuthStackParamList>()
const MainTab = createBottomTabNavigator<MainTabParamList>()

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  )
}

function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string

          if (route.name === "Feed") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Player") {
            iconName = focused ? "play-circle" : "play-circle-outline"
          } else if (route.name === "Create") {
            iconName = focused ? "add-circle" : "add-circle-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          } else if (route.name === "Analytics") {
            iconName = focused ? "bar-chart" : "bar-chart-outline"
          }

          return <Ionicons name={iconName as any} size={size} color={color} />
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.backgroundLight,
        },
      })}
    >
      <MainTab.Screen name="Feed" component={FeedScreen} />
      <MainTab.Screen name="Create" component={CreateScreen} />
      <MainTab.Screen name="Player" component={PlayerScreen} options={{ tabBarLabel: "Watch" }} />
      <MainTab.Screen name="Profile" component={ProfileScreen} />
      <MainTab.Screen name="Analytics" component={AnalyticsDashboardScreen} options={{ tabBarLabel: "Analytics" }} />
    </MainTab.Navigator>
  )
}

const AppNavigator = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // Show splash screen for at least 2 seconds
    const splashTimer = setTimeout(() => {
      setShowSplash(false)
    }, 2000)

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    return () => {
      clearTimeout(splashTimer)
      subscription.unsubscribe()
    }
  }, [])

  // Show splash screen
  if (showSplash) {
    return <SplashScreen />
  }

  // Show loading screen while checking auth
  if (loading) {
    return <LoadingScreen />
  }

  return <NavigationContainer>{session ? <MainNavigator /> : <AuthNavigator />}</NavigationContainer>
}

export default AppNavigator
