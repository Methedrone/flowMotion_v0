"use client"

import { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { supabase } from "../../lib/supabase"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import * as Clipboard from "expo-clipboard"
import { COLORS } from "../../constants/theme"
import { logEvent, AnalyticsEventType } from "../../services/analytics"
import { captureException } from "../../utils/sentry"

export default function CreateScreen() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [contentType, setContentType] = useState<"text" | "url">("text")
  const [loading, setLoading] = useState(false)
  const [generationStep, setGenerationStep] = useState<
    "idle" | "generating-script" | "generating-animation" | "extracting-keypoints" | "complete"
  >("idle")
  const [generatedStoryId, setGeneratedStoryId] = useState<string | null>(null)

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync()
    if (text) {
      setContent(text)
      // Try to detect if it's a URL
      if (text.startsWith("http://") || text.startsWith("https://")) {
        setContentType("url")
      }
    }
  }

  const handleClear = () => {
    setTitle("")
    setContent("")
    setGenerationStep("idle")
    setGeneratedStoryId(null)
  }

  const validateInput = () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a title for your story")
      return false
    }
    if (!content.trim()) {
      Alert.alert("Missing content", "Please enter or paste some content to generate a story from")
      return false
    }
    return true
  }

  const generateStory = async () => {
    if (!validateInput()) return

    try {
      setLoading(true)
      setGenerationStep("generating-script")

      // Track story creation started
      logEvent(AnalyticsEventType.STORY_CREATED, {
        content_type: contentType,
        content_length: content.length,
      })

      // Step 1: Generate the storyboard script
      const { data: scriptData, error: scriptError } = await supabase.functions.invoke("generateStoryScript", {
        body: {
          sourceContent: content,
          title,
          contentType,
        },
      })

      if (scriptError) throw new Error(`Error generating script: ${scriptError.message}`)

      const storyId = scriptData.storyId
      setGeneratedStoryId(storyId)

      // Step 2: Generate animation assets
      setGenerationStep("generating-animation")
      const { error: animationError } = await supabase.functions.invoke("generateAnimationAssets", {
        body: {
          storyId,
        },
      })

      if (animationError) throw new Error(`Error generating animation: ${animationError.message}`)

      // Step 3: Extract key points
      setGenerationStep("extracting-keypoints")
      const { error: keyPointsError } = await supabase.functions.invoke("extractKeyPoints", {
        body: {
          storyId,
        },
      })

      if (keyPointsError) throw new Error(`Error extracting key points: ${keyPointsError.message}`)

      setGenerationStep("complete")
      Alert.alert("Story Generated Successfully", "Your story has been created and is now available in the feed.", [
        {
          text: "View Story",
          onPress: () => {
            // Navigate to the player screen with the generated story ID
            // This would be implemented with navigation in a real app
            Alert.alert("Navigate to story", `Navigate to story with ID: ${storyId}`)
          },
        },
        {
          text: "Create Another",
          onPress: handleClear,
        },
      ])
    } catch (error: any) {
      Alert.alert("Error", error.message)
      setGenerationStep("idle")
      captureException(error, { context: "generateStory" })
    } finally {
      setLoading(false)
    }
  }

  const renderProgressIndicator = () => {
    if (generationStep === "idle") return null

    const steps = [
      { key: "generating-script", label: "Generating Script" },
      { key: "generating-animation", label: "Creating Animation" },
      { key: "extracting-keypoints", label: "Extracting Key Points" },
      { key: "complete", label: "Complete" },
    ]

    const currentStepIndex = steps.findIndex((step) => step.key === generationStep)

    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={step.key} style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                index <= currentStepIndex ? styles.progressDotActive : styles.progressDotInactive,
              ]}
            >
              {index < currentStepIndex ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : index === currentStepIndex && generationStep !== "complete" ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : null}
            </View>
            <Text
              style={[
                styles.progressLabel,
                index <= currentStepIndex ? styles.progressLabelActive : styles.progressLabelInactive,
              ]}
            >
              {step.label}
            </Text>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.progressLine,
                  index < currentStepIndex ? styles.progressLineActive : styles.progressLineInactive,
                ]}
              />
            )}
          </View>
        ))}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Create New Story</Text>
            <Text style={styles.headerSubtitle}>Transform any content into an engaging animated story</Text>
          </LinearGradient>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Story Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter a title for your story"
              value={title}
              onChangeText={setTitle}
              editable={!loading}
            />

            <View style={styles.contentTypeSelector}>
              <TouchableOpacity
                style={[styles.contentTypeButton, contentType === "text" && styles.contentTypeButtonActive]}
                onPress={() => setContentType("text")}
                disabled={loading}
              >
                <Text
                  style={[styles.contentTypeButtonText, contentType === "text" && styles.contentTypeButtonTextActive]}
                >
                  Text
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contentTypeButton, contentType === "url" && styles.contentTypeButtonActive]}
                onPress={() => setContentType("url")}
                disabled={loading}
              >
                <Text
                  style={[styles.contentTypeButtonText, contentType === "url" && styles.contentTypeButtonTextActive]}
                >
                  URL
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>{contentType === "text" ? "Source Content" : "Source URL"}</Text>
            <View style={styles.contentInputContainer}>
              <TextInput
                style={styles.contentInput}
                placeholder={
                  contentType === "text" ? "Paste or type the content to transform" : "Enter the URL of the content"
                }
                value={content}
                onChangeText={setContent}
                multiline={contentType === "text"}
                numberOfLines={contentType === "text" ? 6 : 1}
                keyboardType={contentType === "url" ? "url" : "default"}
                editable={!loading}
              />
              <TouchableOpacity style={styles.pasteButton} onPress={handlePaste} disabled={loading}>
                <Ionicons name="clipboard-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {renderProgressIndicator()}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClear} disabled={loading}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.generateButton, loading && styles.disabledButton]}
                onPress={generateStory}
                disabled={loading}
              >
                <Text style={styles.generateButtonText}>{loading ? "Generating..." : "Generate Story"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textLight,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    opacity: 0.9,
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: COLORS.backgroundMuted,
  },
  contentTypeSelector: {
    flexDirection: "row",
    marginBottom: 20,
  },
  contentTypeButton: {
    flex: 1,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contentTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  contentTypeButtonText: {
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  contentTypeButtonTextActive: {
    color: COLORS.textLight,
  },
  contentInputContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundMuted,
    marginBottom: 20,
  },
  contentInput: {
    flex: 1,
    padding: 15,
    textAlignVertical: "top",
  },
  pasteButton: {
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressDotInactive: {
    backgroundColor: COLORS.border,
  },
  progressLabel: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  progressLabelActive: {
    color: COLORS.textDark,
  },
  progressLabelInactive: {
    color: COLORS.textMuted,
  },
  progressLine: {
    flex: 1,
    height: 2,
    marginLeft: 10,
  },
  progressLineActive: {
    backgroundColor: COLORS.primary,
  },
  progressLineInactive: {
    backgroundColor: COLORS.border,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  clearButton: {
    backgroundColor: COLORS.backgroundMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
    marginRight: 10,
  },
  clearButtonText: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: "600",
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    flex: 2,
  },
  generateButtonText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.7,
  },
})
