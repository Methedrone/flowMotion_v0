"use client"

import { useState } from "react"
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from "react-native"
import { supabase } from "../../lib/supabase"
import { SafeAreaView } from "react-native-safe-area-context"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { AuthStackParamList } from "../../types/navigation"

type ForgotPasswordScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, "ForgotPassword">
}

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  async function resetPassword() {
    if (!email) {
      Alert.alert("Missing field", "Please enter your email address")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "flowmotion://reset-password",
    })

    setLoading(false)
    if (error) {
      Alert.alert("Error", error.message)
    } else {
      Alert.alert("Password reset email sent", "Check your email for a password reset link", [
        { text: "OK", onPress: () => navigation.navigate("SignIn") },
      ])
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Reset Your Password</Text>
        <Text style={styles.subtitle}>Enter your email address and we'll send you a link to reset your password</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={resetPassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Sending..." : "Send Reset Link"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: "#F9FAFB",
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#EC4899",
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    alignItems: "center",
  },
  backButtonText: {
    color: "#6B7280",
    fontSize: 16,
  },
})
