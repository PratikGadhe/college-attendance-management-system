import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  footer?: React.ReactNode
  noPadding?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  noPadding = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden ${className}`}
      {...props}
    >
      {header && (
        <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          {header}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
      {footer && (
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50">
          {footer}
        </div>
      )}
    </div>
  )
}

export default Card

