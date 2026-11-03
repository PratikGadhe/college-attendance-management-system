import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

export const DEMO_USER_ID_STORAGE_KEY = 'demo_user_id'

export const getStoredDemoUserId = (): string | null => {
  return localStorage.getItem(DEMO_USER_ID_STORAGE_KEY)
}

export const setStoredDemoUserId = (userId: number): void => {
  localStorage.setItem(DEMO_USER_ID_STORAGE_KEY, String(userId))
}

export const clearStoredDemoUserId = (): void => {
  localStorage.removeItem(DEMO_USER_ID_STORAGE_KEY)
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Centralized Axios client configured for FastAPI prototype identity authentication.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Automatically attach X-Demo-User-ID header when session exists
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const demoUserId = getStoredDemoUserId()
    if (demoUserId) {
      config.headers.set('X-Demo-User-ID', demoUserId)
    }
    return config
  },
  (error: unknown) => Promise.reject(error),
)

export interface ApiErrorDetail {
  loc?: (string | number)[]
  msg?: string
  type?: string
}

/**
 * Extracts a user-friendly error message from a FastAPI error response.
 */
export const getApiErrorMessage = (error: unknown, fallbackMessage = 'An unexpected error occurred'): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string | ApiErrorDetail[] | unknown }>
    
    // Check for network errors / server unreachable
    if (!axiosError.response) {
      if (axiosError.code === 'ERR_NETWORK') {
        return 'Unable to connect to the backend server. Please verify the backend is running at ' + API_BASE_URL
      }
      return axiosError.message || fallbackMessage
    }

    const detail = axiosError.response.data?.detail
    if (typeof detail === 'string') {
      return detail
    }
    if (Array.isArray(detail) && detail.length > 0) {
      // Pydantic 422 validation error array
      const first = detail[0] as ApiErrorDetail
      return first.msg ? `${first.loc ? first.loc.join('.') + ': ' : ''}${first.msg}` : fallbackMessage
    }
  } else if (error instanceof Error) {
    return error.message
  }
  return fallbackMessage
}

export default apiClient
