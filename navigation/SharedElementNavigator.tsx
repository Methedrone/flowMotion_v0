import { createSharedElementStackNavigator } from "react-navigation-shared-element"
import { TransitionPresets } from "@react-navigation/stack"
import FeedScreen from "../screens/main/FeedScreen"
import PlayerScreen from "../screens/main/PlayerScreen"
import type { Story } from "../types/navigation"

// Define the param list for the shared element navigator
export type SharedElementStackParamList = {
  Feed: undefined
  Player: { storyId: string; story?: Story }
}

// Create the shared element navigator
const SharedElementStack = createSharedElementStackNavigator<SharedElementStackParamList>()

export default function SharedElementNavigator() {
  return (
    <SharedElementStack.Navigator
      initialRouteName="Feed"
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.SlideFromRightIOS,
        cardStyleInterpolator: ({ current: { progress } }) => {
          return {
            cardStyle: {
              opacity: progress,
            },
          }
        },
      }}
    >
      <SharedElementStack.Screen name="Feed" component={FeedScreen} />
      <SharedElementStack.Screen
        name="Player"
        component={PlayerScreen}
        sharedElements={(route) => {
          const { storyId } = route.params
          return [
            {
              id: `story.${storyId}.video`,
              animation: "move",
              resize: "auto",
              align: "center-center",
            },
            {
              id: `story.${storyId}.title`,
              animation: "fade",
              resize: "clip",
              align: "left-center",
            },
          ]
        }}
        options={{
          gestureEnabled: true,
          cardOverlayEnabled: true,
          cardStyle: { backgroundColor: "transparent" },
        }}
      />
    </SharedElementStack.Navigator>
  )
}
