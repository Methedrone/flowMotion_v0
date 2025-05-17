"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import Toast from "../ui/Toast"

type ToastType = "success" | "error" | "warning" | "info"

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  hideToast: () => void
}

interface ToastProviderProps {
  children: React.ReactNode
}

interface ToastState {
  visible: boolean
  message: string
  type: ToastType
  duration: number
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "info",
    duration: 3000,
  })

  const showToast = useCallback((message: string, type: ToastType = "info", duration = 3000) => {
    setToast({
      visible: true,
      message,
      type,
      duration,
    })
  }, [])

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
