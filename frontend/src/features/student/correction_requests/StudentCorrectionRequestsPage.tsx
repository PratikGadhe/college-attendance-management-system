import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FileEdit,
  Eye,
  PlusCircle,
  ArrowRight,
} from 'lucide-react'
import studentApi from '../../../api/student.api'
import { getApiErrorMessage } from '../../../api/axios'
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
import CorrectionRequestFormModal from './CorrectionRequestFormModal'
import StudentCorrectionDetailModal from './StudentCorrectionDetailModal'

export const StudentCorrectionRequestsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [statusFilter, setStatusFilter] = useState<string>('')
  const [skip, setSkip] = useState(0)
  const limit = 10

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [preselectedAttendanceId, setPreselectedAttendanceId] = useState<number | null>(null)
  const [viewRequestId, setViewRequestId] = useState<number | null>(null)

  // Check URL params for attendance_id
  useEffect(() => {
    const attId = searchParams.get('attendance_id')
    if (attId) {
      setPreselectedAttendanceId(Number(attId))
      setIsFormModalOpen(true)
      // Clean query param
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('attendance_id')
      setSearchParams(nextParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Queries
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'student',
      'correction-requests',
      {
        request_status: statusFilter || undefined,
        skip,
        limit,
      },
    ],
    queryFn: () =>
      studentApi.getCorrectionRequests({
        request_status: statusFilter || undefined,
        skip,
        limit,
      }),
  })

  const requests = data?.items || []
  const total = data?.total || 0

  const handleOpenNew = () => {
    setPreselectedAttendanceId(null)
    setIsFormModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Correction Requests"
        description="Submit and track correction disputes for wrongly recorded attendance sessions."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <FileEdit className="w-3.5 h-3.5" />
            {total} DISPUTES
          </span>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenNew}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            New Request
          </Button>
        }
      />

      {/* Status Filter Tabs */}
      <Card noPadding className="p-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {[
            { label: 'All Requests', value: '' },
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
      </Card>

      {/* Table Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" text="Loading correction disputes..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorMessage
              title="Failed to load requests"
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
                statusFilter
                  ? 'No correction requests matched your status filter.'
                  : 'You have not submitted any attendance correction requests.'
              }
              action={{
                label: statusFilter ? 'Show All Requests' : 'Create Correction Request',
                onClick: statusFilter ? () => setStatusFilter('') : handleOpenNew,
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Lecture Date</th>
                  <th className="py-3.5 px-4">Status Adjustment</th>
                  <th className="py-3.5 px-4">Justification</th>
                  <th className="py-3.5 px-4">Submitted On</th>
                  <th className="py-3.5 px-4">Request Status</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((req) => (
                  <tr key={req.request_id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Subject */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 mr-2">
                        {req.subject_code}
                      </span>
                      {req.subject_name}
                    </td>

                    {/* Lecture Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-900">
                      {req.lecture_date}
                    </td>

                    {/* Adjustment */}
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

                    {/* Submission Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={req.request_status} size="sm" />
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setViewRequestId(req.request_id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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

      {/* Form Modal */}
      <CorrectionRequestFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setPreselectedAttendanceId(null)
        }}
        preselectedAttendanceId={preselectedAttendanceId}
      />

      {/* Detail Modal */}
      <StudentCorrectionDetailModal
        isOpen={viewRequestId !== null}
        onClose={() => setViewRequestId(null)}
        requestId={viewRequestId}
      />
    </div>
  )
}

export default StudentCorrectionRequestsPage
