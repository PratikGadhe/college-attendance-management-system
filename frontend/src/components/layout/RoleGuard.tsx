import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../types/auth.types'
import LoadingScreen from '../common/LoadingScreen'

export interface RoleGuardProps {
  allowedRoles: UserRole[]
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles }) => {
  const { role, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen message="Verifying role permissions..." />
  }

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(role)) {
    // Cross-role access attempt: redirect to user's authorized home portal
    const fallbackPath =
      role === 'ADMIN' ? '/admin' : role === 'FACULTY' ? '/faculty' : '/student'
    return <Navigate to={fallbackPath} replace />
  }

  return <Outlet />
}

export default RoleGuard

