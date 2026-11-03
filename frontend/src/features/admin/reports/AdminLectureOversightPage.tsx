import React from 'react'
import { CalendarDays } from 'lucide-react'
import { PageHeader } from '../../../components/common'
import { LectureReportTab } from './LectureReportTab'

export const AdminLectureOversightPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Lecture Oversight"
        description="Monitor conducted lectures across all departments, inspect attendance headcounts, and export audit trails."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CalendarDays className="w-3.5 h-3.5" />
            LECTURE MONITORING
          </span>
        }
      />

      <LectureReportTab />
    </div>
  )
}
export default AdminLectureOversightPage

