import { Animated, Easing } from "react-native"

// Standard animation durations
export const DURATIONS = {
  short: 150,
  medium: 300,
  long: 500,
}

// Standard easing functions
export const EASINGS = {
  standard: Easing.bezier(0.4, 0, 0.2, 1), // Material Design standard easing
  accelerate: Easing.bezier(0.4, 0, 1, 1), // Material Design accelerate easing
  decelerate: Easing.bezier(0, 0, 0.2, 1), // Material Design decelerate easing
  elastic: Easing.elastic(1), // Elastic bounce effect
  bounce: Easing.bounce, // Bounce effect
}

/**
 * Creates a fade-in animation
 * @param value Animated.Value to animate
 * @param duration Animation duration in ms
 * @param easing Easing function to use
 * @returns Animated.CompositeAnimation
 */
export const fadeIn = (
  value: Animated.Value,
  duration: number = DURATIONS.medium,
  easing: Easing.Function = EASINGS.standard,
): Animated.CompositeAnimation => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    easing,
    useNativeDriver: true,
  })
}

/**
 * Creates a fade-out animation
 * @param value Animated.Value to animate
 * @param duration Animation duration in ms
 * @param easing Easing function to use
 * @returns Animated.CompositeAnimation
 */
export const fadeOut = (
  value: Animated.Value,
  duration: number = DURATIONS.medium,
  easing: Easing.Function = EASINGS.standard,
): Animated.CompositeAnimation => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing,
    useNativeDriver: true,
  })
}

/**
 * Creates a scale animation
 * @param value Animated.Value to animate
 * @param toValue Target scale value
 * @param duration Animation duration in ms
 * @param easing Easing function to use
 * @returns Animated.CompositeAnimation
 */
export const scale = (
  value: Animated.Value,
  toValue: number,
  duration: number = DURATIONS.medium,
  easing: Easing.Function = EASINGS.standard,
): Animated.CompositeAnimation => {
  return Animated.timing(value, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  })
}

/**
 * Creates a translate animation
 * @param value Animated.Value to animate
 * @param toValue Target translation value
 * @param duration Animation duration in ms
 * @param easing Easing function to use
 * @returns Animated.CompositeAnimation
 */
export const translate = (
  value: Animated.Value,
  toValue: number,
  duration: number = DURATIONS.medium,
  easing: Easing.Function = EASINGS.standard,
): Animated.CompositeAnimation => {
  return Animated.timing(value, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  })
}

/**
 * Creates a sequence of animations
 * @param animations Array of animations to run in sequence
 * @returns Animated.CompositeAnimation
 */
export const sequence = (animations: Animated.CompositeAnimation[]): Animated.CompositeAnimation => {
  return Animated.sequence(animations)
}

/**
 * Creates a parallel set of animations
 * @param animations Array of animations to run in parallel
 * @returns Animated.CompositeAnimation
 */
export const parallel = (animations: Animated.CompositeAnimation[]): Animated.CompositeAnimation => {
  return Animated.parallel(animations)
}

/**
 * Creates a staggered set of animations
 * @param animations Array of animations to stagger
 * @param staggerDelay Delay between each animation
 * @returns Animated.CompositeAnimation
 */
export const stagger = (
  animations: Animated.CompositeAnimation[],
  staggerDelay: number,
): Animated.CompositeAnimation => {
  return Animated.stagger(staggerDelay, animations)
}

/**
 * Creates a spring animation
 * @param value Animated.Value to animate
 * @param toValue Target value
 * @param friction Friction value (default: 7)
 * @param tension Tension value (default: 40)
 * @returns Animated.CompositeAnimation
 */
export const spring = (
  value: Animated.Value,
  toValue: number,
  friction = 7,
  tension = 40,
): Animated.CompositeAnimation => {
  return Animated.spring(value, {
    toValue,
    friction,
    tension,
    useNativeDriver: true,
  })
}

/**
 * Creates a loop animation
 * @param animation Animation to loop
 * @param iterations Number of iterations (-1 for infinite)
 * @returns Animated.CompositeAnimation
 */
export const loop = (animation: Animated.CompositeAnimation, iterations = -1): Animated.CompositeAnimation => {
  return Animated.loop(animation, { iterations })
}
