"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import LoadingOverlay from "../ui/LoadingOverlay"

interface LoadingContextType {
  showLoading: (message?: string) => void
  hideLoading: () => void
  isLoading: boolean
}

interface LoadingProviderProps {
  children: React.ReactNode
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [loading, setLoading] = useState({
    visible: false,
    message: "Loading...",
  })

  const showLoading = useCallback((message = "Loading...") => {
    setLoading({
      visible: true,
      message,
    })
  }, [])

  const hideLoading = useCallback(() => {
    setLoading((prev) => ({ ...prev, visible: false }))
  }, [])

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading, isLoading: loading.visible }}>
      {children}
      <LoadingOverlay visible={loading.visible} message={loading.message} />
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider")
  }
  return context
}
