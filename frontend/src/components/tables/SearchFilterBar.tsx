import React from 'react'
import { Search, X } from 'lucide-react'

export interface SearchFilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  placeholder?: string
  children?: React.ReactNode
  actionButton?: React.ReactNode
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search records...',
  children,
  actionButton,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
      {/* Left / Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-3xl">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="block w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {children}
      </div>

      {/* Right / Action Button */}
      {actionButton && <div className="shrink-0 flex items-center gap-2">{actionButton}</div>}
    </div>
  )
}

export default SearchFilterBar

