import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FileEdit,
  Eye,
  ArrowRight,
} from 'lucide-react'
import facultyApi from '../../../api/faculty.api'
import { getApiErrorMessage } from '../../../api/axios'
import type {
  CorrectionRequestDetailResponse,
  FacultyTeachingAssignmentResponse,
} from '../../../types/faculty.types'
import {
  PageHeader,
  Button,
  StatusBadge,
  Card,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
} from '../../../components/common'
import { Pagination } from '../../../components/tables/Pagination'
import CorrectionRequestReviewModal from './CorrectionRequestReviewModal'

export const CorrectionRequestListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '')
  const [subjectFilter, setSubjectFilter] = useState<number | ''>('')
  const [skip, setSkip] = useState(0)
  const limit = 10

  const [selectedRequest, setSelectedRequest] = useState<CorrectionRequestDetailResponse | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch teaching assignments for subject filter
  const { data: assignmentsData } = useQuery({
    queryKey: ['faculty', 'teaching-assignments'],
    queryFn: () => facultyApi.getTeachingAssignments(),
  })
  const assignments: FacultyTeachingAssignmentResponse[] = assignmentsData?.items || []

  // Unique subjects from assignments
  const distinctSubjects = React.useMemo(() => {
    const map = new Map<number, string>()
    assignments.forEach((a) => {
      if (!map.has(a.subject_id)) {
        map.set(a.subject_id, `${a.subject_code} - ${a.subject_name}`)
      }
    })
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }))
  }, [assignments])

  // Queries
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'faculty',
      'correction-requests',
      {
        request_status: statusFilter || undefined,
        subject_id: subjectFilter || undefined,
        skip,
        limit,
      },
    ],
    queryFn: () =>
      facultyApi.getCorrectionRequests({
        request_status: statusFilter || undefined,
        subject_id: subjectFilter ? Number(subjectFilter) : undefined,
        skip,
        limit,
      }),
  })

  const requests = data?.items || []
  const total = data?.total || 0

  // Check URL params for request_id to open modal directly
  const requestIdParam = searchParams.get('request_id')
  useEffect(() => {
    if (requestIdParam && requests.length > 0) {
      const match = requests.find((r) => r.request_id === Number(requestIdParam))
      if (match) {
        setSelectedRequest(match)
        setIsModalOpen(true)
      }
    }
  }, [requestIdParam, requests])

  const handleOpenReview = (req: CorrectionRequestDetailResponse) => {
    setSelectedRequest(req)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRequest(null)
    // Clear request_id param
    if (searchParams.get('request_id')) {
      const next = new URLSearchParams(searchParams)
      next.delete('request_id')
      setSearchParams(next, { replace: true })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Correction Reviews"
        description="Review student disputes for marked attendance records, inspect justifications, and approve or reject adjustments."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <FileEdit className="w-3.5 h-3.5" />
            {total} DISPUTES
          </span>
        }
      />

      {/* Filter Tabs & Dropdowns */}
      <Card noPadding className="p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {[
              { label: 'All', value: '' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Approved', value: 'APPROVED' },
              { label: 'Rejected', value: 'REJECTED' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.value)
                  setSkip(0)
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === tab.value
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Subject Filter */}
          <div className="w-full md:w-64">
            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value ? Number(e.target.value) : '')
                setSkip(0)
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            >
              <option value="">All Subjects</option>
              {distinctSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" text="Loading correction requests..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorMessage
              title="Failed to load correction requests"
              message={getApiErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<FileEdit className="w-8 h-8" />}
              title="No Correction Requests"
              description={
                statusFilter || subjectFilter
                  ? 'No correction requests matched your active filters.'
                  : 'There are no attendance correction requests submitted for your courses.'
              }
              action={
                statusFilter || subjectFilter
                  ? {
                      label: 'Clear Filters',
                      onClick: () => {
                        setStatusFilter('')
                        setSubjectFilter('')
                        setSkip(0)
                      },
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
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Subject & Class</th>
                  <th className="py-3.5 px-4">Lecture Date</th>
                  <th className="py-3.5 px-4">Status Change</th>
                  <th className="py-3.5 px-4">Student Reason</th>
                  <th className="py-3.5 px-4">Request Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((req) => (
                  <tr key={req.request_id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{req.student_name}</div>
                      <div className="font-mono text-xs text-slate-500">{req.roll_number}</div>
                    </td>

                    {/* Subject & Class */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{req.subject_code}</div>
                      <div className="text-xs text-slate-500">
                        {req.class_name} (Div {req.division})
                      </div>
                    </td>

                    {/* Lecture Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-900">
                      {req.lecture_date}
                    </td>

                    {/* Status Change: Original -> Requested */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            req.current_status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {req.current_status}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span
                          className={`px-2 py-0.5 rounded ${
                            req.requested_status === 'PRESENT'
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'bg-rose-600 text-white font-bold'
                          }`}
                        >
                          {req.requested_status}
                        </span>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 max-w-[200px] truncate italic text-slate-600">
                      &quot;{req.reason}&quot;
                    </td>

                    {/* Request Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={req.request_status} size="sm" />
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {req.request_status === 'PENDING' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenReview(req)}
                        >
                          Review
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReview(req)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Details
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
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

      {/* Review & Detail Modal */}
      <CorrectionRequestReviewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        request={selectedRequest}
      />
    </div>
  )
}

export default CorrectionRequestListPage
