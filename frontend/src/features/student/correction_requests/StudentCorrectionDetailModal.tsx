import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Clock,
  MessageSquare,
  UserCheck,
} from 'lucide-react'
import studentApi from '../../../api/student.api'
import { getApiErrorMessage } from '../../../api/axios'
import { Modal } from '../../../components/common/Modal'
import { Button, StatusBadge, LoadingSpinner, ErrorMessage } from '../../../components/common'

interface StudentCorrectionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  requestId: number | null
}

export const StudentCorrectionDetailModal: React.FC<StudentCorrectionDetailModalProps> = ({
  isOpen,
  onClose,
  requestId,
}) => {
  const { data: request, isLoading, error, refetch } = useQuery({
    queryKey: ['student', 'correction-request', requestId],
    queryFn: () => studentApi.getCorrectionRequestDetail(requestId!),
    enabled: isOpen && requestId !== null,
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Correction Request Details"
      description={`Dispute #${requestId || ''} • Attendance record review tracker`}
      maxWidth="md"
    >
      {isLoading ? (
        <div className="p-12 flex justify-center">
          <LoadingSpinner size="md" text="Loading request status..." />
        </div>
      ) : error ? (
        <div className="p-4">
          <ErrorMessage
            title="Failed to load request details"
            message={getApiErrorMessage(error)}
            onRetry={() => refetch()}
          />
        </div>
      ) : request ? (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3">
            <div>
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {request.subject_code}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {request.subject_name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Lecture on {request.lecture_date}
              </p>
            </div>
            <StatusBadge status={request.request_status} size="md" />
          </div>

          {/* Status Change Box */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-slate-400 block mb-1">Originally Recorded</span>
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                {request.current_status}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/40">
              <span className="text-indigo-500 font-semibold block mb-1">Requested Status</span>
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                {request.requested_status}
              </span>
            </div>
          </div>

          {/* Student's Reason */}
          <div className="p-3 rounded-xl border border-slate-200 bg-white">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              Your Justification
            </span>
            <p className="text-xs text-slate-800 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              &quot;{request.reason}&quot;
            </p>
            <span className="text-[11px] text-slate-400 block mt-2">
              Submitted on: {request.created_at ? new Date(request.created_at).toLocaleString() : 'N/A'}
            </span>
          </div>

          {/* Review Details (if approved or rejected) */}
          {request.request_status !== 'PENDING' ? (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  Reviewed By:
                </span>
                <span className="font-semibold text-slate-900">{request.reviewer_name || 'Faculty Member'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Decision Date:</span>
                <span className="font-semibold text-slate-900">
                  {request.reviewed_at ? new Date(request.reviewed_at).toLocaleString() : 'N/A'}
                </span>
              </div>
              {request.review_remarks && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">Faculty Remarks:</span>
                  <p className="text-slate-800 italic bg-white p-2 rounded border border-slate-200">
                    &quot;{request.review_remarks}&quot;
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>This request is awaiting review by your course instructor.</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

export default StudentCorrectionDetailModal
