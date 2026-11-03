import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import authApi from '../api/auth.api'
import {
  getStoredDemoUserId,
  setStoredDemoUserId,
  clearStoredDemoUserId,
} from '../api/axios'
import type { AuthContextValue, UserProfile } from '../types/auth.types'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const initializeSession = useCallback(async () => {
    const storedId = getStoredDemoUserId()
    if (!storedId) {
      setCurrentUser(null)
      setIsLoading(false)
      return
    }

    try {
      // Backend validates X-Demo-User-ID header and returns current user profile
      const user = await authApi.getCurrentUser()
      setCurrentUser(user)
    } catch {
      // Identity invalid or rejected by backend: clear stored demo identity
      clearStoredDemoUserId()
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    initializeSession()
  }, [initializeSession])

  const login = async (username: string): Promise<UserProfile> => {
    setIsLoading(true)
    try {
      const user = await authApi.login(username)
      // Save demo identity in localStorage
      setStoredDemoUserId(user.user_id)
      setCurrentUser(user)
      return user
    } finally {
      setIsLoading(false)
    }
  }

  const logout = (): void => {
    clearStoredDemoUserId()
    setCurrentUser(null)
  }

  const refreshProfile = async (): Promise<UserProfile | null> => {
    try {
      const user = await authApi.getCurrentUser()
      setCurrentUser(user)
      return user
    } catch {
      logout()
      return null
    }
  }

  const value: AuthContextValue = {
    isAuthenticated: !!currentUser,
    isLoading,
    currentUser,
    userId: currentUser?.user_id ?? null,
    role: currentUser?.role ?? null,
    login,
    logout,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Custom hook providing access to centralized authentication state.
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
