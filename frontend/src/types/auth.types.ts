/**
 * Authentication and User Profile Types matching the FastAPI backend contract.
 */

export type UserRole = 'ADMIN' | 'FACULTY' | 'STUDENT'

export type AccountStatus = 'ACTIVE' | 'INACTIVE'

export interface UserProfile {
  user_id: number
  username: string
  role: UserRole
  status: AccountStatus
}

export interface LoginRequest {
  username: string
}

export type LoginResponse = UserProfile

export interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  currentUser: UserProfile | null
  userId: number | null
  role: UserRole | null
  login: (username: string) => Promise<UserProfile>
  logout: () => void
  refreshProfile: () => Promise<UserProfile | null>
}

