"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { StyleSheet, View, ActivityIndicator, Dimensions, Text, TouchableOpacity } from "react-native"
import { supabase } from "../../lib/supabase"
import { SafeAreaView } from "react-native-safe-area-context"
import { Video } from "expo-av"
import type { Story } from "../../types/navigation"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { MainTabParamList } from "../../types/navigation"
import { LinearGradient } from "expo-linear-gradient"
import SubscriptionBanner from "../../components/SubscriptionBanner"
import { COLORS, SIZES } from "../../constants/theme"
import { getCachedVideoPath, cacheVideo } from "../../utils/videoCache"
import { useToast } from "../../components/providers/ToastProvider"
import { useErrorHandler } from "../../utils/errorHandler"
import { Button } from "../../components/ui/Button"
import Badge from "../../components/ui/Badge"
import * as Animations from "../../utils/animations"
import { RefreshCw, Play, Plus } from "lucide-react-native"
import { SharedElement } from "react-navigation-shared-element"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { startTransaction, trackScreenView } from "../../utils/sentry"
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated"

type FeedScreenProps = {
  navigation: StackNavigationProp<MainTabParamList, "Feed">
}

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window")

export default function FeedScreen({ navigation }: FeedScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cachedVideos, setCachedVideos] = useState<Record<string, string>>({})
  const videoRefs = useRef<{ [key: string]: Video | null }>({})
  const scrollY = useSharedValue(0)
  const refreshIconRotateValue = useSharedValue(0)
  const nativeRefreshIconRotate = useRef(new Animated.Value(0)).current

  const { showToast } = useToast()
  const { handleErrorWithToast } = useErrorHandler()
  const { t } = useTranslation()

  const animatedStyle = useAnimatedStyle(() => {
    const index = currentIndex
    const inputRange = [(index - 1) * SCREEN_HEIGHT, index * SCREEN_HEIGHT, (index + 1) * SCREEN_HEIGHT]

    const scale = interpolate(scrollY.value, inputRange, [0.9, 1, 0.9], Extrapolate.CLAMP)

    const opacity = interpolate(scrollY.value, inputRange, [0.7, 1, 0.7], Extrapolate.CLAMP)

    return {
      transform: [{ scale }],
      opacity,
    }
  })

  const refreshIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${refreshIconRotateValue.value * 360}deg`,
        },
      ],
    }
  })

  const spin = nativeRefreshIconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  useEffect(() => {
    trackScreenView("Feed")
  }, [])

  const {
    data: stories = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<Story[]>({
    queryKey: ["stories"],
    queryFn: async () => {
      const transaction = startTransaction("fetchStories", "api")
      try {
        const { data, error } = await supabase.from("stories").select("*").order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        transaction.setStatus("ok")
        return data || []
      } catch (error: any) {
        transaction.setStatus("error")
        throw error
      } finally {
        transaction.finish()
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  useEffect(() => {
    const storiesChannel = supabase
      .channel("stories-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories",
        },
        () => {
          refetch()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(storiesChannel)
    }
  }, [refetch])

  useEffect(() => {
    const cacheVideos = async () => {
      const transaction = startTransaction("cacheVideos", "cache")
      const newCachedVideos: Record<string, string> = { ...cachedVideos }

      try {
        for (const story of stories) {
          if (!cachedVideos[story.id] && story.video_url) {
            try {
              let cachedPath = await getCachedVideoPath(story.video_url)

              if (!cachedPath) {
                cachedPath = await cacheVideo(story.video_url)
              }

              if (cachedPath) {
                newCachedVideos[story.id] = cachedPath
              }
            } catch (error) {
              console.error(`Error caching video for story ${story.id}:`, error)
            }
          }
        }

        setCachedVideos(newCachedVideos)
        transaction.setStatus("ok")
      } catch (err) {
        transaction.setStatus("error")
        console.error("Error in cacheVideos:", err)
      } finally {
        transaction.finish()
      }
    }

    if (stories.length > 0) {
      cacheVideos()
    }
  }, [stories])

  const onRefresh = () => {
    // Animate the refresh icon
    refreshIconRotateValue.value = withTiming(1, { duration: 1000 })

    Animations.loop(
      Animations.timing(nativeRefreshIconRotate, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ).start()

    refetch().finally(() => {
      refreshIconRotateValue.value = 0
      nativeRefreshIconRotate.setValue(0)
    })
  }

  const prefetchNextVideos = useCallback(
    async (currentIndex: number) => {
      const transaction = startTransaction("prefetchNextVideos", "cache")
      try {
        for (let i = 1; i <= 2; i++) {
          const nextIndex = currentIndex + i
          if (nextIndex < stories.length) {
            const story = stories[nextIndex]
            if (story.video_url && !cachedVideos[story.id]) {
              await Video.loadAsync({ uri: story.video_url }, {}, false)
            }
          }
        }
        transaction.setStatus("ok")
      } catch (error) {
        transaction.setStatus("error")
        console.error("Error prefetching videos:", error)
      } finally {
        transaction.finish()
      }
    },
    [stories, cachedVideos],
  )

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index
      setCurrentIndex(index)

      // Pause all videos first
      Object.keys(videoRefs.current).forEach((key) => {
        if (videoRefs.current[key]) {
          videoRefs.current[key]?.pauseAsync()
        }
      })

      // Play the current video
      const currentId = viewableItems[0].item.id
      if (videoRefs.current[currentId]) {
        videoRefs.current[currentId]?.playAsync()
      }

      // Prefetch next videos
      prefetchNextVideos(index)
    }
  }).current

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  }

  const handleStoryPress = (story: Story) => {
    navigation.navigate("Player", { storyId: story.id })
  }

  const getVideoSource = useCallback(
    (story: Story) => {
      return cachedVideos[story.id] ? { uri: cachedVideos[story.id] } : { uri: story.video_url }
    },
    [cachedVideos],
  )

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  const renderItem = ({ item, index }: { item: Story; index: number }) => {
    return (
      <Animated.View style={[styles.storyContainer, animatedStyle]}>
        <TouchableOpacity style={styles.storyTouchable} onPress={() => handleStoryPress(item)} activeOpacity={0.9}>
          <SharedElement id={`story.${item.id}.video`}>
            <Video
              ref={(ref) => {
                videoRefs.current[item.id] = ref
              }}
              source={getVideoSource(item)}
              style={styles.video}
              resizeMode="cover"
              shouldPlay={index === currentIndex}
              isLooping
              isMuted={false}
              useNativeControls={false}
              posterSource={{ uri: item.thumbnail_url }}
              usePoster={true}
              onLoad={() => {
                if (index === currentIndex || index === currentIndex + 1) {
                  videoRefs.current[item.id]?.loadAsync()
                }
              }}
            />
          </SharedElement>

          <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.gradient}>
            <View style={styles.infoContainer}>
              <SharedElement id={`story.${item.id}.title`}>
                <Text style={styles.title}>{item.title}</Text>
              </SharedElement>
              <Text style={styles.description}>{item.description}</Text>
              {item.premium && <Badge variant="warning" label={t("feed.premium")} style={styles.premiumBadge} />}
            </View>
          </LinearGradient>

          <View style={styles.playButtonContainer}>
            <TouchableOpacity style={styles.playButton} onPress={() => handleStoryPress(item)}>
              <Play size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  const renderEmptyComponent = () => {
    if (isLoading) return null

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No stories available</Text>
        <Button
          variant="gradient"
          leftIcon={<Plus size={20} color={COLORS.textLight} />}
          onPress={() => navigation.navigate("Create")}
          style={styles.createButton}
        >
          Create Your First Story
        </Button>
      </View>
    )
  }

  const renderFooter = () => {
    if (!isLoading || stories.length === 0) return null

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <SubscriptionBanner />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>FlowMotion</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} disabled={isRefetching}>
          <Animated.View style={refreshIconStyle}>
            <RefreshCw size={20} color={COLORS.textDark} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {isLoading && stories.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Error: {error instanceof Error ? error.message : "Failed to load stories"}
          </Text>
          <Button variant="primary" onPress={() => refetch()} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      ) : (
        <Animated.FlatList
          data={stories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={renderFooter}
          contentContainerStyle={{ flexGrow: stories.length === 0 ? 1 : undefined }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={5}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshing={isRefetching}
          onRefresh={onRefresh}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    backgroundColor: COLORS.backgroundLight,
  },
  headerTitle: {
    fontSize: SIZES.fontXL,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  refreshButton: {
    padding: SIZES.spacing.sm,
  },
  storyContainer: {
    height: SCREEN_HEIGHT,
    width: "100%",
    position: "relative",
  },
  storyTouchable: {
    flex: 1,
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: "flex-end",
    paddingHorizontal: SIZES.spacing.lg,
    paddingBottom: 50,
  },
  infoContainer: {
    marginBottom: SIZES.spacing.lg,
  },
  title: {
    color: COLORS.textLight,
    fontSize: SIZES.font2XL,
    fontWeight: "bold",
    marginBottom: SIZES.spacing.xs,
  },
  description: {
    color: COLORS.textLight,
    fontSize: SIZES.fontSM,
    opacity: 0.8,
    marginBottom: SIZES.spacing.md,
  },
  premiumBadge: {
    alignSelf: "flex-start",
  },
  playButtonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
    padding: SIZES.spacing.lg,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.fontMD,
    textAlign: "center",
    marginBottom: SIZES.spacing.lg,
  },
  retryButton: {
    marginTop: SIZES.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
    padding: SIZES.spacing.lg,
  },
  emptyText: {
    color: COLORS.textDark,
    fontSize: SIZES.fontLG,
    marginBottom: SIZES.spacing.lg,
    textAlign: "center",
  },
  createButton: {
    marginTop: SIZES.spacing.md,
  },
  footerLoader: {
    paddingVertical: SIZES.spacing.lg,
  },
})
