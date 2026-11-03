import React from 'react'
import { Link } from 'react-router-dom'
import { Layers, ArrowLeft } from 'lucide-react'
import PageHeader from './PageHeader'
import Button from './Button'

export interface PlaceholderPageProps {
  title: string
  description?: string
  portalHome: string
  expectedPhase?: string
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description = 'This module will be connected to the FastAPI backend in upcoming frontend phases.',
  portalHome,
  expectedPhase = 'Phase F3–F6',
}) => {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Link to={portalHome}>
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Dashboard
            </Button>
          </Link>
        }
      />

      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">{title} Module</h3>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
          The API endpoints and data models for this feature are complete in the backend (B1–B7).
          The interactive frontend UI components and workflows will be implemented in {expectedPhase}.
        </p>
        <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          Planned for {expectedPhase}
        </span>
      </div>
    </div>
  )
}

export default PlaceholderPage

