import { Component, type ErrorInfo, type ReactNode } from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import * as Sentry from "@sentry/react-native"
import { COLORS } from "../constants/theme"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to Sentry
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    })

    console.error("Uncaught error:", error, errorInfo)
  }

  handleRestart = () => {
    // Reset the error state
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>The app encountered an unexpected error. Our team has been notified.</Text>
          {this.state.error && <Text style={styles.errorDetails}>{this.state.error.toString()}</Text>}
          <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.backgroundLight,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.error,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: COLORS.textDark,
  },
  errorDetails: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 20,
    padding: 10,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 5,
    width: "100%",
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: COLORS.textLight,
    fontWeight: "bold",
  },
})
