import React from 'react'

export interface AvatarProps {
  name: string
  role?: 'ADMIN' | 'FACULTY' | 'STUDENT' | string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  role,
  size = 'md',
  className = '',
}) => {
  const getInitials = (n: string): string => {
    if (!n) return '?'
    const parts = n.trim().split(/\s+/)
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase()
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
  }

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-indigo-600 text-white border-indigo-700',
    FACULTY: 'bg-sky-600 text-white border-sky-700',
    STUDENT: 'bg-emerald-600 text-white border-emerald-700',
  }

  const colorStyle = role ? roleColors[role.toUpperCase()] || 'bg-slate-700 text-white' : 'bg-slate-700 text-white'

  return (
    <div
      title={`${name}${role ? ` (${role})` : ''}`}
      className={`inline-flex items-center justify-center font-bold rounded-full border shadow-2xs select-none shrink-0 ${sizeClasses[size]} ${colorStyle} ${className}`}
    >
      {getInitials(name)}
    </div>
  )
}

export default Avatar

