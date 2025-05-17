"use client"

import { useState } from "react"
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native"
import { supabase } from "../../lib/supabase"
import { SafeAreaView } from "react-native-safe-area-context"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { AuthStackParamList } from "../../types/navigation"
import { LinearGradient } from "expo-linear-gradient"
import Logo from "../../components/Logo"
import { COLORS, GRADIENTS, SIZES } from "../../constants/theme"
import { logEvent, AnalyticsEventType } from "../../services/analytics"

type SignUpScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, "SignUp">
}

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function signUpWithEmail() {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    setLoading(false)
    if (error) {
      Alert.alert("Error", error.message)
    } else {
      // Track sign up event
      logEvent(AnalyticsEventType.SIGN_UP, { method: "email" })

      Alert.alert(
        "Confirmation email sent",
        "Check your email for a confirmation link. Once confirmed, you can sign in.",
      )
      navigation.navigate("SignIn")
    }
  }

  async function signUpWithGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    })
    setLoading(false)

    if (!error) {
      // Track sign up event
      logEvent(AnalyticsEventType.SIGN_UP, { method: "google" })
    } else {
      Alert.alert("Error", error.message)
    }
  }

  async function signUpWithApple() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
    })
    setLoading(false)

    if (!error) {
      // Track sign up event
      logEvent(AnalyticsEventType.SIGN_UP, { method: "apple" })
    } else {
      Alert.alert("Error", error.message)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={GRADIENTS.primary.colors}
          start={GRADIENTS.primary.start}
          end={GRADIENTS.primary.end}
          style={styles.header}
        >
          <Logo size={80} />
          <Text style={styles.title}>FlowMotion</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <Text style={styles.subtitle}>Create your account</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, loading && styles.disabledButton]}
            onPress={signUpWithEmail}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Creating Account..." : "Sign Up"}</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>OR</Text>

          <TouchableOpacity style={[styles.button, styles.socialButton]} onPress={signUpWithGoogle} disabled={loading}>
            <Text style={styles.socialButtonText}>Sign Up with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.socialButton]} onPress={signUpWithApple} disabled={loading}>
            <Text style={styles.socialButtonText}>Sign Up with Apple</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.terms}>By signing up, you agree to our Terms of Service and Privacy Policy</Text>
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
    paddingVertical: 30,
    borderBottomLeftRadius: SIZES.radius.xl,
    borderBottomRightRadius: SIZES.radius.xl,
  },
  title: {
    fontSize: SIZES.font2XL,
    fontWeight: "bold",
    color: COLORS.textLight,
    marginTop: 10,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: SIZES.fontXL,
    fontWeight: "600",
    marginBottom: 20,
    color: COLORS.textDark,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius.md,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: COLORS.backgroundMuted,
  },
  button: {
    height: 50,
    borderRadius: SIZES.radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  disabledButton: {
    backgroundColor: COLORS.primary,
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.textLight,
    fontSize: SIZES.fontMD,
    fontWeight: "600",
  },
  orText: {
    textAlign: "center",
    marginVertical: 15,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  socialButton: {
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  socialButtonText: {
    color: COLORS.textDark,
    fontSize: SIZES.fontMD,
    fontWeight: "600",
  },
  footer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    color: COLORS.textMuted,
  },
  link: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  terms: {
    marginTop: 15,
    fontSize: SIZES.fontXS,
    color: COLORS.textMuted,
    textAlign: "center",
  },
})
