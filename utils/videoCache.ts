import * as FileSystem from "expo-file-system"
import { Platform } from "react-native"
import * as Crypto from "expo-crypto"

// Define the cache directory
const CACHE_DIRECTORY = `${FileSystem.cacheDirectory}video-cache/`

// Ensure the cache directory exists
async function ensureCacheDirectory() {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIRECTORY)
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIRECTORY, { intermediates: true })
  }
}

// Generate a hash for the URL to use as filename
async function getHashForUrl(url: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, url)
  return hash
}

// Get the cached file path for a URL
export async function getCachedVideoPath(url: string): Promise<string | null> {
  // Web doesn't support file caching this way
  if (Platform.OS === "web") {
    return url
  }

  try {
    await ensureCacheDirectory()
    const hash = await getHashForUrl(url)
    const filePath = `${CACHE_DIRECTORY}${hash}`

    const fileInfo = await FileSystem.getInfoAsync(filePath)
    if (fileInfo.exists) {
      return fileInfo.uri
    }

    return null
  } catch (error) {
    console.error("Error checking cached video:", error)
    return null
  }
}

// Download and cache a video
export async function cacheVideo(url: string): Promise<string> {
  // Web doesn't support file caching this way
  if (Platform.OS === "web") {
    return url
  }

  try {
    await ensureCacheDirectory()
    const hash = await getHashForUrl(url)
    const filePath = `${CACHE_DIRECTORY}${hash}`

    const fileInfo = await FileSystem.getInfoAsync(filePath)
    if (fileInfo.exists) {
      return fileInfo.uri
    }

    const downloadResumable = FileSystem.createDownloadResumable(url, filePath, {}, false)

    const { uri } = await downloadResumable.downloadAsync()
    return uri
  } catch (error) {
    console.error("Error caching video:", error)
    return url // Fallback to original URL
  }
}

// Clear the entire video cache
export async function clearVideoCache(): Promise<void> {
  if (Platform.OS === "web") {
    return
  }

  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIRECTORY)
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(CACHE_DIRECTORY)
      await ensureCacheDirectory()
    }
  } catch (error) {
    console.error("Error clearing video cache:", error)
  }
}

// Get the size of the video cache
export async function getVideoCacheSize(): Promise<number> {
  if (Platform.OS === "web") {
    return 0
  }

  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIRECTORY)
    if (!dirInfo.exists) {
      return 0
    }

    // This is a simplification - in a real app you'd recursively calculate directory size
    const files = await FileSystem.readDirectoryAsync(CACHE_DIRECTORY)
    let totalSize = 0

    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${CACHE_DIRECTORY}${file}`)
      if (fileInfo.exists && !fileInfo.isDirectory) {
        totalSize += fileInfo.size || 0
      }
    }

    return totalSize
  } catch (error) {
    console.error("Error getting cache size:", error)
    return 0
  }
}
