import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  History,
  CheckCircle2,
  XCircle,
  Eye,
  FileEdit,
} from 'lucide-react'
import studentApi from '../../../api/student.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { StudentSubjectAttendanceSummary } from '../../../types/student.types'
import {
  PageHeader,
  Card,
  Button,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
} from '../../../components/common'
import { Pagination } from '../../../components/tables/Pagination'
import StudentAttendanceDetailModal from './StudentAttendanceDetailModal'

export const StudentAttendanceHistoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const subjectParam = searchParams.get('subject_id')
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>(
    subjectParam ? Number(subjectParam) : ''
  )
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [skip, setSkip] = useState(0)
  const limit = 15

  const [detailAttendanceId, setDetailAttendanceId] = useState<number | null>(null)

  // Fetch student subjects for dropdown
  const { data: summaryData } = useQuery({
    queryKey: ['student', 'attendance-summary'],
    queryFn: () => studentApi.getAttendanceSummary(),
  })
  const subjects: StudentSubjectAttendanceSummary[] = summaryData?.subjects || []

  // Attendance History query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'student',
      'attendance-history',
      {
        subject_id: selectedSubjectId || undefined,
        attendance_status: statusFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        skip,
        limit,
      },
    ],
    queryFn: () =>
      studentApi.getAttendanceHistory({
        subject_id: selectedSubjectId ? Number(selectedSubjectId) : undefined,
        attendance_status: statusFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        skip,
        limit,
      }),
  })

  const records = data?.items || []
  const total = data?.total || 0

  const handleClearFilters = () => {
    setSelectedSubjectId('')
    setStatusFilter('')
    setStartDate('')
    setEndDate('')
    setSkip(0)
    setSearchParams({})
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance History Log"
        description="Comprehensive chronological log of attendance records across all finalized course lectures."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <History className="w-3.5 h-3.5" />
            {total} RECORDS
          </span>
        }
      />

      {/* Filter Bar */}
      <Card noPadding className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Subject Filter */}
          <div className="w-full md:w-64">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value ? Number(e.target.value) : '')
                setSkip(0)
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            >
              <option value="">All Enrolled Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.subject_id} value={sub.subject_id}>
                  {sub.subject_code} - {sub.subject_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-40">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setSkip(0)
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="w-full md:w-40">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setSkip(0)
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            />
          </div>

          {/* End Date */}
          <div className="w-full md:w-40">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setSkip(0)
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            />
          </div>

          {/* Clear Filters */}
          {(selectedSubjectId !== '' || statusFilter !== '' || startDate !== '' || endDate !== '') && (
            <div className="w-full md:w-auto md:self-end">
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Table Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" text="Loading attendance history..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorMessage
              title="Failed to load attendance history"
              message={getApiErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : records.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<History className="w-8 h-8" />}
              title="No Attendance Records"
              description={
                selectedSubjectId || statusFilter || startDate || endDate
                  ? 'No lecture records matched your active filter criteria.'
                  : 'You do not have any submitted attendance records in the system yet.'
              }
              action={
                selectedSubjectId || statusFilter || startDate || endDate
                  ? {
                      label: 'Clear Filters',
                      onClick: handleClearFilters,
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Time Slot</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((rec) => {
                  const isPresent = rec.attendance_status === 'PRESENT'
                  const isAbsent = rec.attendance_status === 'ABSENT'

                  return (
                    <tr
                      key={rec.attendance_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isAbsent ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Subject */}
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {rec.subject_code}
                          </span>
                          <span className="truncate max-w-[180px] sm:max-w-[240px]">
                            {rec.subject_name}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-900">
                        {rec.lecture_date}
                      </td>

                      {/* Time Slot */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {rec.start_time.slice(0, 5)} - {rec.end_time.slice(0, 5)}
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {rec.class_name} <span className="text-slate-400 font-normal">(Div {rec.division})</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            PRESENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3.5 h-3.5" />
                            ABSENT
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Dispute absent mark */}
                          {isAbsent && (
                            <Link to={`/student/correction-requests?attendance_id=${rec.attendance_id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-amber-700 border-amber-300 hover:bg-amber-50"
                                leftIcon={<FileEdit className="w-3.5 h-3.5 text-amber-600" />}
                              >
                                Dispute
                              </Button>
                            </Link>
                          )}

                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => setDetailAttendanceId(rec.attendance_id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="View Session Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {total > limit && (
          <div className="border-t border-slate-100">
            <Pagination
              skip={skip}
              limit={limit}
              total={total}
              onPageChange={(newSkip) => setSkip(newSkip)}
            />
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <StudentAttendanceDetailModal
        isOpen={detailAttendanceId !== null}
        onClose={() => setDetailAttendanceId(null)}
        attendanceId={detailAttendanceId}
      />
    </div>
  )
}

export default StudentAttendanceHistoryPage
