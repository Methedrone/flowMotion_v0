import { Image, StyleSheet, View, type ViewStyle, type ImageStyle } from "react-native"

type LogoProps = {
  size?: number
  containerStyle?: ViewStyle
  imageStyle?: ImageStyle
}

export default function Logo({ size = 80, containerStyle, imageStyle }: LogoProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        source={require("../assets/icon.png")}
        style={[styles.image, { width: size, height: size }, imageStyle]}
        resizeMode="contain"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 80,
    height: 80,
  },
})
