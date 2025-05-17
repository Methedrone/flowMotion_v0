"use client"

import { useState, useEffect, useRef } from "react"
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native"
import { supabase } from "../../lib/supabase"
import type { RouteProp } from "@react-navigation/native"
import type { MainTabParamList, Story } from "../../types/navigation"
import { SafeAreaView } from "react-native-safe-area-context"
import { Video } from "expo-av"
import { Audio } from "expo-av"
import { Ionicons } from "@expo/vector-icons"
import * as Clipboard from "expo-clipboard"
import { COLORS, SIZES } from "../../constants/theme"
import { trackStoryEngagement } from "../../services/analytics"
import { getCachedVideoPath, cacheVideo } from "../../utils/videoCache"
import { SharedElement } from "react-navigation-shared-element"
import { useTranslation } from "react-i18next"

type PlayerScreenProps = {
  route: RouteProp<MainTabParamList, "Player">
}

type KeyPoint = {
  id: string
  story_id: string
  content: string
  order: number
}

const { width } = Dimensions.get("window")

export default function PlayerScreen({ route }: PlayerScreenProps) {
  const { storyId } = route.params || {}
  const { t } = useTranslation()

  const [story, setStory] = useState<Story | null>(null)
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [showKeyPoints, setShowKeyPoints] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [cachedVideoUri, setCachedVideoUri] = useState<string | null>(null)
  const [completionTracked, setCompletionTracked] = useState(false)

  const videoRef = useRef<Video>(null)

  useEffect(() => {
    if (storyId) {
      fetchStory()
      fetchKeyPoints()
      checkIfFavorite()

      // Track story view
      trackStoryEngagement(storyId, "view")
    }

    // Configure audio to continue in background
    configureAudio()

    return () => {
      // Clean up audio session when component unmounts
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
      })
    }
  }, [storyId])

  // Cache video when story changes
  useEffect(() => {
    const cacheStoryVideo = async () => {
      if (story?.video_url) {
        try {
          // Check if already cached
          let cachedPath = await getCachedVideoPath(story.video_url)

          // If not cached, cache it
          if (!cachedPath) {
            cachedPath = await cacheVideo(story.video_url)
          }

          if (cachedPath) {
            setCachedVideoUri(cachedPath)
          }
        } catch (error) {
          console.error(`Error caching video:`, error)
        }
      }
    }

    if (story) {
      cacheStoryVideo()
    }
  }, [story])

  const configureAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      })
    } catch (error) {
      console.error("Failed to configure audio mode:", error)
    }
  }

  async function fetchStory() {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.from("stories").select("*").eq("id", storyId).single()

      if (error) throw error

      setStory(data)
      setLoading(false)
    } catch (error: any) {
      setError(`Error loading story: ${error.message}`)
      setLoading(false)
    }
  }

  async function fetchKeyPoints() {
    try {
      const { data, error } = await supabase
        .from("key_points")
        .select("*")
        .eq("story_id", storyId)
        .order("order", { ascending: true })

      if (error) throw error

      setKeyPoints(data || [])
    } catch (error: any) {
      console.error("Error fetching key points:", error.message)
    }
  }

  async function checkIfFavorite() {
    try {
      const { data, error } = await supabase.from("favorites").select("*").eq("story_id", storyId).single()

      if (error && error.code !== "PGRST116") throw error

      setIsFavorite(!!data)
    } catch (error: any) {
      console.error("Error checking favorite status:", error.message)
    }
  }

  async function toggleFavorite() {
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase.from("favorites").delete().eq("story_id", storyId)

        if (error) throw error

        setIsFavorite(false)
        Alert.alert("Removed from favorites")

        // Track analytics
        trackStoryEngagement(storyId!, "favorite_remove")
      } else {
        // Add to favorites
        const { error } = await supabase.from("favorites").insert([{ story_id: storyId }])

        if (error) throw error

        setIsFavorite(true)
        Alert.alert("Added to favorites")

        // Track analytics
        trackStoryEngagement(storyId!, "favorite_add")
      }
    } catch (error: any) {
      Alert.alert("Error", error.message)
    }
  }

  async function saveQuote(quote: string) {
    try {
      const { error } = await supabase.from("quotes").insert([{ content: quote, story_id: storyId }])

      if (error) throw error

      Alert.alert("Quote saved successfully")
    } catch (error: any) {
      Alert.alert("Error saving quote", error.message)
    }
  }

  async function copyToClipboard(text: string) {
    await Clipboard.setStringAsync(text)
    Alert.alert("Copied to clipboard")
  }

  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current?.pauseAsync()
    } else {
      videoRef.current?.playAsync()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    videoRef.current?.setIsMutedAsync(!isMuted)
    setIsMuted(!isMuted)
  }

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying)

      // Calculate progress percentage
      if (status.durationMillis > 0) {
        const progress = status.positionMillis / status.durationMillis
        setVideoProgress(progress)

        // Track completion when 90% watched and not already tracked
        if (progress > 0.9 && !completionTracked && storyId) {
          trackStoryEngagement(storyId, "complete")
          setCompletionTracked(true)
        }
      }
    }
  }

  const getAccessibilityProps = (props: { label: string; role: string }) => {
    return {
      accessibilityLabel: props.label,
      accessibilityRole: props.role,
    }
  }

  if (!storyId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Select a story from the feed</Text>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  if (error || !story) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error || "Story not found"}</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.videoContainer}>
          <SharedElement id={`story.${storyId}.video`}>
            <Video
              ref={videoRef}
              source={{ uri: cachedVideoUri || story.video_url }}
              style={styles.video}
              resizeMode="contain"
              shouldPlay={true}
              isLooping
              isMuted={isMuted}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              usePoster={true}
              posterSource={{ uri: story.thumbnail_url }}
              posterStyle={styles.poster}
            />
          </SharedElement>

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={togglePlay}
              style={styles.controlButton}
              {...getAccessibilityProps({
                label: isPlaying ? t("player.pause") : t("player.play"),
                role: "button",
              })}
            >
              <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleMute}
              style={styles.controlButton}
              {...getAccessibilityProps({
                label: isMuted ? t("player.unmute") : t("player.mute"),
                role: "button",
              })}
            >
              <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${videoProgress * 100}%` }]} />
          </View>
        </View>

        <View style={styles.infoContainer}>
          <SharedElement id={`story.${storyId}.title`}>
            <Text style={styles.storyTitle}>{story.title}</Text>
          </SharedElement>
          <Text style={styles.storyDescription}>{story.description}</Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={toggleFavorite}>
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? COLORS.primary : COLORS.textDark}
              />
              <Text style={styles.actionButtonText}>{isFavorite ? "Favorited" : "Favorite"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => setShowKeyPoints(!showKeyPoints)}>
              <Ionicons name={showKeyPoints ? "chevron-up" : "chevron-down"} size={24} color={COLORS.textDark} />
              <Text style={styles.actionButtonText}>Key Points</Text>
            </TouchableOpacity>
          </View>

          {showKeyPoints && (
            <View style={styles.keyPointsContainer}>
              {keyPoints.length === 0 ? (
                <Text style={styles.emptyKeyPoints}>No key points available</Text>
              ) : (
                keyPoints.map((point, index) => (
                  <View key={point.id} style={styles.keyPointItem}>
                    <Text style={styles.keyPointNumber}>{index + 1}</Text>
                    <View style={styles.keyPointContent}>
                      <Text style={styles.keyPointText}>{point.content}</Text>
                      <View style={styles.keyPointActions}>
                        <TouchableOpacity onPress={() => copyToClipboard(point.content)} style={styles.keyPointAction}>
                          <Ionicons name="copy-outline" size={20} color={COLORS.textMuted} />
                          <Text style={styles.keyPointActionText}>Copy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => saveQuote(point.content)} style={styles.keyPointAction}>
                          <Ionicons name="bookmark-outline" size={20} color={COLORS.textMuted} />
                          <Text style={styles.keyPointActionText}>Save Quote</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
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
  videoContainer: {
    width: "100%",
    height: width * 0.75, // 4:3 aspect ratio
    backgroundColor: COLORS.backgroundDark,
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  poster: {
    resizeMode: "cover",
  },
  controls: {
    position: "absolute",
    bottom: 40,
    left: 10,
    flexDirection: "row",
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  progressBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  progressBar: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  infoContainer: {
    padding: SIZES.spacing.lg,
  },
  storyTitle: {
    fontSize: SIZES.font2XL,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: SIZES.spacing.sm,
  },
  storyDescription: {
    fontSize: SIZES.fontMD,
    color: COLORS.textMuted,
    marginBottom: SIZES.spacing.lg,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: SIZES.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 15,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: SIZES.spacing.md,
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: SIZES.fontMD,
    color: COLORS.textDark,
  },
  keyPointsContainer: {
    marginTop: SIZES.spacing.sm,
  },
  keyPointItem: {
    flexDirection: "row",
    marginBottom: SIZES.spacing.lg,
  },
  keyPointNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    textAlign: "center",
    lineHeight: 30,
    color: COLORS.textLight,
    fontWeight: "bold",
    marginRight: 15,
  },
  keyPointContent: {
    flex: 1,
  },
  keyPointText: {
    fontSize: SIZES.fontMD,
    color: COLORS.textDark,
    fontFamily: "serif", // This will use the default serif font per the PRD
    marginBottom: SIZES.spacing.sm,
    lineHeight: 24,
  },
  keyPointActions: {
    flexDirection: "row",
  },
  keyPointAction: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: SIZES.spacing.lg,
  },
  keyPointActionText: {
    marginLeft: 5,
    color: COLORS.textMuted,
    fontSize: SIZES.fontSM,
  },
  emptyKeyPoints: {
    textAlign: "center",
    color: COLORS.textMuted,
    paddingVertical: SIZES.spacing.lg,
  },
  title: {
    fontSize: SIZES.fontLG,
    textAlign: "center",
    marginTop: SIZES.spacing.lg,
    color: COLORS.textDark,
  },
  error: {
    fontSize: SIZES.fontMD,
    textAlign: "center",
    marginTop: SIZES.spacing.lg,
    color: COLORS.error,
  },
})
