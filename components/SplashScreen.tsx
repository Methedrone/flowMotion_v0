"use client"

import { useEffect, useRef } from "react"
import { StyleSheet, Animated, View, Dimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import Logo from "./Logo"
import { COLORS, GRADIENTS } from "../constants/theme"
import * as Animations from "../utils/animations"

const { width } = Dimensions.get("window")

export default function SplashScreen() {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const textOpacity = useRef(new Animated.Value(0)).current
  const textTranslateY = useRef(new Animated.Value(20)).current
  const gradientOpacity = useRef(new Animated.Value(0)).current
  const wavePosition = useRef(new Animated.Value(-width)).current

  useEffect(() => {
    // Sequence of animations
    Animations.sequence([
      // Fade in gradient
      Animations.fadeIn(gradientOpacity, 500),

      // Logo animation
      Animations.parallel([Animations.fadeIn(logoOpacity, 800), Animations.spring(logoScale, 1, 8, 40)]),

      // Text animation
      Animations.parallel([
        Animations.fadeIn(textOpacity, 600),
        Animations.translate(textTranslateY, 0, 600, Animations.EASINGS.decelerate),
      ]),

      // Wave animation
      Animations.translate(wavePosition, 0, 1200, Animations.EASINGS.decelerate),
    ]).start()

    // Start the wave animation loop after initial animation
    setTimeout(() => {
      Animations.loop(
        Animations.sequence([
          Animations.translate(wavePosition, width, 15000, Animations.EASINGS.standard),
          Animations.timing(wavePosition, {
            toValue: -width,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    }, 3000)
  }, [])

  return (
    <Animated.View style={[styles.container, { opacity: gradientOpacity }]}>
      <LinearGradient
        colors={GRADIENTS.primary.colors}
        start={GRADIENTS.primary.start}
        end={GRADIENTS.primary.end}
        style={styles.gradient}
      >
        {/* Animated wave effect */}
        <Animated.View
          style={[
            styles.wave,
            {
              transform: [{ translateX: wavePosition }],
            },
          ]}
        >
          <View style={styles.waveShape} />
        </Animated.View>

        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Logo size={150} />
          </Animated.View>

          <Animated.Text
            style={[
              styles.appName,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            FlowMotion
          </Animated.Text>
        </View>
      </LinearGradient>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.textLight,
    letterSpacing: 1,
  },
  wave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  waveShape: {
    width: width * 2,
    height: 100,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderTopLeftRadius: 500,
    borderTopRightRadius: 500,
  },
})
