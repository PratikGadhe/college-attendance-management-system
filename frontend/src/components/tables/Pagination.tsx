import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface PaginationProps {
  total: number
  skip: number
  limit: number
  onPageChange: (newSkip: number) => void
}

export const Pagination: React.FC<PaginationProps> = ({
  total,
  skip,
  limit,
  onPageChange,
}) => {
  if (total <= 0) return null

  const currentPage = Math.floor(skip / limit) + 1
  const totalPages = Math.ceil(total / limit)

  const startEntry = total === 0 ? 0 : skip + 1
  const endEntry = Math.min(skip + limit, total)

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(Math.max(0, skip - limit))
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(skip + limit)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 px-2 border-t border-slate-200/80 text-xs text-slate-500">
      <div>
        Showing <span className="font-semibold text-slate-700">{startEntry}</span> to{' '}
        <span className="font-semibold text-slate-700">{endEntry}</span> of{' '}
        <span className="font-semibold text-slate-700">{total}</span> entries
      </div>

      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <span className="px-3 py-1 font-semibold text-slate-700 bg-slate-100 rounded-lg">
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Pagination

