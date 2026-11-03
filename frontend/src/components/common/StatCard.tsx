import React from 'react'

export interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  helperText?: string
  trend?: {
    value: string
    isPositive?: boolean
  }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  helperText,
  trend,
  variant = 'default',
  className = '',
}) => {
  const iconVariants = {
    default: 'bg-slate-100 text-slate-600',
    primary: 'bg-indigo-50 text-indigo-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600',
  }

  return (
    <div
      className={`rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs transition-shadow hover:shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconVariants[variant]}`}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {helperText && (
        <p className="mt-1.5 text-xs text-slate-500 font-medium">{helperText}</p>
      )}
    </div>
  )
}

export default StatCard

