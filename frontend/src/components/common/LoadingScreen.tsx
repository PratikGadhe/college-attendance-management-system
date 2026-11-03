import React from 'react'
import { GraduationCap, Loader2 } from 'lucide-react'

export interface LoadingScreenProps {
  message?: string
  subMessage?: string
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading College Attendance System...',
  subMessage = 'Validating authentication session',
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center max-w-sm text-center">
        <div className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-md mb-4 animate-bounce">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-1">
          {message}
        </h2>
        <p className="text-xs text-slate-500 mb-6">{subMessage}</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-xs">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span className="text-xs font-semibold text-slate-600">Please wait</span>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen

