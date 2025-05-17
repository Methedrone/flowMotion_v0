import { EventEmitter } from "expo-modules-core"
import { ExponentAV } from "expo-av"

// Create a new event emitter instance
export const emitter = new EventEmitter(ExponentAV)

// Export event types
export const EventTypes = {
  PLAYBACK_STATUS: "playbackStatus",
  PLAYBACK_ERROR: "playbackError",
  LOADING_STATUS: "loadingStatus",
}

// Helper functions for emitting events
export function emitPlaybackStatus(status: any) {
  emitter.emit(EventTypes.PLAYBACK_STATUS, status)
}

export function emitPlaybackError(error: any) {
  emitter.emit(EventTypes.PLAYBACK_ERROR, error)
}

export function emitLoadingStatus(status: any) {
  emitter.emit(EventTypes.LOADING_STATUS, status)
}

// Helper functions for subscribing to events
export function addPlaybackStatusListener(listener: (status: any) => void) {
  return emitter.addListener(EventTypes.PLAYBACK_STATUS, listener)
}

export function addPlaybackErrorListener(listener: (error: any) => void) {
  return emitter.addListener(EventTypes.PLAYBACK_ERROR, listener)
}

export function addLoadingStatusListener(listener: (status: any) => void) {
  return emitter.addListener(EventTypes.LOADING_STATUS, listener)
}
