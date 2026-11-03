import apiClient from './axios'
import type { LoginRequest, LoginResponse, UserProfile } from '../types/auth.types'

/**
 * Authentication API Service interacting with FastAPI prototype endpoints.
 */
export const authApi = {
  /**
   * Authenticate a demo user by username.
   */
  async login(username: string): Promise<LoginResponse> {
    const payload: LoginRequest = { username: username.trim() }
    const response = await apiClient.post<LoginResponse>('/api/auth/login', payload)
    return response.data
  },

  /**
   * Retrieve the currently authenticated user's profile verified by X-Demo-User-ID header.
   */
  async getCurrentUser(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/api/auth/me')
    return response.data
  },
}

export default authApi
