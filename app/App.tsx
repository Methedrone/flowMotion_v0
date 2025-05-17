import { NavigationContainer } from "@react-navigation/native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ToastProvider } from "../components/providers/ToastProvider"
import { LoadingProvider } from "../components/providers/LoadingProvider"
import { ErrorBoundary } from "../components/ErrorBoundary"
import AppNavigator from "../navigation/AppNavigator"
import { I18nextProvider } from "react-i18next"
import i18n from "../i18n"

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <SafeAreaProvider>
            <ToastProvider>
              <LoadingProvider>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
              </LoadingProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
