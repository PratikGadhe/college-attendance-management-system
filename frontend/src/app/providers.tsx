import React, { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import { AuthProvider } from '../context/AuthContext'

interface AppProvidersProps {
  children: React.ReactNode
}

/**
 * Root Application Providers.
 * Establishes TanStack QueryClient, Authentication Context, and React Router.
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (axios.isAxiosError(error)) {
                const status = error.response?.status
                // Do not retry authorization or not-found errors
                if (status === 401 || status === 403 || status === 404) {
                  return false
                }
              }
              return failureCount < 2
            },
            staleTime: 5 * 60 * 1000,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default AppProviders
