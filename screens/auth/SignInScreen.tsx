"use client"

import { useState } from "react"
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native"
import { supabase } from "../../lib/supabase"
import { SafeAreaView } from "react-native-safe-area-context"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { AuthStackParamList } from "../../types/navigation"
import { LinearGradient } from "expo-linear-gradient"
import Logo from "../../components/Logo"
import { COLORS, GRADIENTS, SIZES } from "../../constants/theme"
import { logEvent, AnalyticsEventType } from "../../services/analytics"
import { useToast } from "../../components/providers/ToastProvider"
import { useLoading } from "../../components/providers/LoadingProvider"
import { useErrorHandler } from "../../utils/errorHandler"
import Button from "../../components/ui/Button"
import Input from "../../components/ui/Input"
import { Mail, Lock, LogIn } from "lucide-react-native"

type SignInScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, "SignIn">
}

export default function SignInScreen({ navigation }: SignInScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const { showToast } = useToast()
  const { showLoading, hideLoading } = useLoading()
  const { handleErrorWithToast } = useErrorHandler()

  const validateInputs = () => {
    let isValid = true

    // Validate email
    if (!email) {
      setEmailError("Email is required")
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address")
      isValid = false
    } else {
      setEmailError("")
    }

    // Validate password
    if (!password) {
      setPasswordError("Password is required")
      isValid = false
    } else {
      setPasswordError("")
    }

    return isValid
  }

  async function signInWithEmail() {
    if (!validateInputs()) {
      return
    }

    try {
      showLoading("Signing in...")

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      hideLoading()

      if (error) {
        throw error
      }

      // Success
      logEvent(AnalyticsEventType.SIGN_IN, { method: "email" })
      showToast("Successfully signed in", "success")
    } catch (error) {
      hideLoading()
      handleErrorWithToast(error)
    }
  }

  async function signInWithGoogle() {
    try {
      showLoading("Connecting to Google...")

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      })

      hideLoading()

      if (error) {
        throw error
      }

      // Success is handled by the OAuth redirect
      logEvent(AnalyticsEventType.SIGN_IN, { method: "google" })
    } catch (error) {
      hideLoading()
      handleErrorWithToast(error)
    }
  }

  async function signInWithApple() {
    try {
      showLoading("Connecting to Apple...")

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
      })

      hideLoading()

      if (error) {
        throw error
      }

      // Success is handled by the OAuth redirect
      logEvent(AnalyticsEventType.SIGN_IN, { method: "apple" })
    } catch (error) {
      hideLoading()
      handleErrorWithToast(error)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={GRADIENTS.primary.colors}
          start={GRADIENTS.primary.start}
          end={GRADIENTS.primary.end}
          style={styles.header}
        >
          <Logo size={100} />
          <Text style={styles.title}>FlowMotion</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text)
              setEmailError("")
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={<Mail size={20} color={COLORS.textMuted} />}
            error={emailError}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text)
              setPasswordError("")
            }}
            isPassword
            leftIcon={<Lock size={20} color={COLORS.textMuted} />}
            error={passwordError}
          />

          <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            variant="gradient"
            size="lg"
            onPress={signInWithEmail}
            fullWidth
            leftIcon={<LogIn size={20} color={COLORS.textLight} />}
            style={styles.signInButton}
          >
            Sign In
          </Button>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button variant="outline" size="lg" onPress={signInWithGoogle} fullWidth style={styles.socialButton}>
            Sign In with Google
          </Button>

          <Button variant="outline" size="lg" onPress={signInWithApple} fullWidth style={styles.socialButton}>
            Sign In with Apple
          </Button>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    borderBottomLeftRadius: SIZES.radius.xl,
    borderBottomRightRadius: SIZES.radius.xl,
  },
  title: {
    fontSize: SIZES.font3XL,
    fontWeight: "bold",
    color: COLORS.textLight,
    marginTop: SIZES.spacing.md,
  },
  subtitle: {
    fontSize: SIZES.fontMD,
    color: COLORS.textLight,
    marginTop: SIZES.spacing.sm,
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    padding: SIZES.spacing.lg,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: SIZES.spacing.lg,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: SIZES.fontSM,
    fontWeight: "500",
  },
  signInButton: {
    marginTop: SIZES.spacing.md,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SIZES.spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SIZES.spacing.md,
    color: COLORS.textMuted,
    fontSize: SIZES.fontSM,
  },
  socialButton: {
    marginBottom: SIZES.spacing.md,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SIZES.spacing.xl,
  },
  signupText: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontMD,
  },
  signupLink: {
    color: COLORS.primary,
    fontSize: SIZES.fontMD,
    fontWeight: "600",
  },
})
