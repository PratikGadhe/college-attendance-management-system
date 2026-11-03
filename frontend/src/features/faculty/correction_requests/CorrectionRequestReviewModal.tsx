import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
} from 'lucide-react'
import facultyApi from '../../../api/faculty.api'
import { getApiErrorMessage } from '../../../api/axios'
import type {
  CorrectionRequestDetailResponse,
  CorrectionRequestReviewRequest,
} from '../../../types/faculty.types'
import { Modal } from '../../../components/common/Modal'
import { Button, StatusBadge, FormField, ErrorMessage, ConfirmDialog } from '../../../components/common'

interface CorrectionRequestReviewModalProps {
  isOpen: boolean
  onClose: () => void
  request: CorrectionRequestDetailResponse | null
}

export const CorrectionRequestReviewModal: React.FC<CorrectionRequestReviewModalProps> = ({
  isOpen,
  onClose,
  request,
}) => {
  const queryClient = useQueryClient()

  const [remarks, setRemarks] = useState('')
  const [selectedDecision, setSelectedDecision] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const reviewMutation = useMutation({
    mutationFn: (data: CorrectionRequestReviewRequest) =>
      facultyApi.reviewCorrectionRequest(request!.request_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty', 'correction-requests'] })
      queryClient.invalidateQueries({ queryKey: ['faculty', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['faculty', 'roster'] })
      queryClient.invalidateQueries({ queryKey: ['faculty', 'lectures'] })
      setSelectedDecision(null)
      setRemarks('')
      setActionError(null)
      onClose()
    },
    onError: (err) => {
      setSelectedDecision(null)
      setActionError(getApiErrorMessage(err, 'Failed to submit correction decision.'))
    },
  })

  if (!request) return null

  const isPending = request.request_status === 'PENDING'

  const handlePromptDecision = (decision: 'APPROVED' | 'REJECTED') => {
    setSelectedDecision(decision)
    setActionError(null)
  }

  const handleConfirmDecision = () => {
    if (!selectedDecision) return
    reviewMutation.mutate({
      decision: selectedDecision,
      review_remarks: remarks.trim() || undefined,
    })
  }

  return (
    <>
      <Modal
        isOpen={isOpen && selectedDecision === null}
        onClose={onClose}
        title="Attendance Correction Request Review"
        description={`Request #${request.request_id} • Disputed attendance review`}
        maxWidth="lg"
      >
        <div className="space-y-5">
          {actionError && (
            <ErrorMessage message={actionError} onDismiss={() => setActionError(null)} />
          )}

          {/* Student & Course Summary Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{request.student_name}</span>
                <span className="font-mono text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {request.roll_number}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {request.subject_code} • {request.subject_name} ({request.class_name} Div {request.division})
              </p>
            </div>
            <StatusBadge status={request.request_status} size="md" />
          </div>

          {/* Dispute Comparison Box */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current Recorded Status */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Originally Recorded
              </span>
              <div className="flex items-center gap-2 mt-2">
                {request.current_status === 'PRESENT' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PRESENT
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    <XCircle className="w-3.5 h-3.5" />
                    ABSENT
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 mt-2 block">
                Lecture Date: {request.lecture_date}
              </span>
            </div>

            {/* Requested Status */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40">
              <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider block mb-1">
                Student Requested
              </span>
              <div className="flex items-center gap-2 mt-2">
                {request.requested_status === 'PRESENT' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PRESENT
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-2xs">
                    <XCircle className="w-3.5 h-3.5" />
                    ABSENT
                  </span>
                )}
              </div>
              <span className="text-[11px] text-indigo-400 mt-2 block">
                Submitted: {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Student's Reason */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              Student Justification
            </span>
            <p className="text-xs sm:text-sm text-slate-800 mt-2 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
              &quot;{request.reason}&quot;
            </p>
          </div>

          {/* Already Reviewed Details */}
          {!isPending && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Reviewed By:</span>
                <span className="font-semibold text-slate-900">{request.reviewer_name || 'Faculty'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Reviewed On:</span>
                <span className="font-semibold text-slate-900">
                  {request.reviewed_at ? new Date(request.reviewed_at).toLocaleString() : 'N/A'}
                </span>
              </div>
              {request.review_remarks && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">Faculty Remarks:</span>
                  <p className="text-slate-800 italic bg-white p-2.5 rounded border border-slate-200">
                    &quot;{request.review_remarks}&quot;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Faculty Review Input (Pending only) */}
          {isPending && (
            <FormField label="Faculty Review Remarks (Optional)">
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Provide notes or feedback regarding this decision (e.g. Verified attendance sheet; student was present in laboratory)..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
              />
              <span className="text-[11px] text-slate-400 block text-right mt-1">
                {remarks.length}/500
              </span>
            </FormField>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>

            {isPending && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePromptDecision('REJECTED')}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  leftIcon={<XCircle className="w-4 h-4 text-rose-600" />}
                >
                  Reject Request
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handlePromptDecision('APPROVED')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  leftIcon={<CheckCircle2 className="w-4 h-4 text-white" />}
                >
                  Approve Correction
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog before review decision */}
      <ConfirmDialog
        isOpen={selectedDecision !== null}
        onCancel={() => setSelectedDecision(null)}
        onConfirm={handleConfirmDecision}
        title={selectedDecision === 'APPROVED' ? 'Approve Attendance Correction?' : 'Reject Attendance Correction?'}
        message={
          selectedDecision === 'APPROVED'
            ? `Are you sure you want to APPROVE this correction? The student's attendance record will be atomically changed from ${request.current_status} to ${request.requested_status}, and an audit log entry will be created.`
            : `Are you sure you want to REJECT this correction? The student's attendance record will remain ${request.current_status}.`
        }
        confirmText={selectedDecision === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
        variant={selectedDecision === 'APPROVED' ? 'primary' : 'destructive'}
        isLoading={reviewMutation.isPending}
      />
    </>
  )
}

export default CorrectionRequestReviewModal
