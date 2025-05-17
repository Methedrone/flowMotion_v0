import type { NavigatorScreenParams } from "@react-navigation/native"

// Story Type
export type Story = {
  id: string
  title: string
  description: string
  thumbnail_url: string
  video_url: string
  created_at: string
  premium: boolean
}

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>
  Main: NavigatorScreenParams<MainTabParamList>
}

// Auth Stack
export type AuthStackParamList = {
  SignIn: undefined
  SignUp: undefined
  ForgotPassword: undefined
}

// Main Tab
export type MainTabParamList = {
  Feed: undefined
  Player: { storyId?: string } | undefined
  Create: undefined
  Profile: undefined
  Analytics: undefined
}
