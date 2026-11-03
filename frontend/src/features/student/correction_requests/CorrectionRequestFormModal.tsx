import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import studentApi from '../../../api/student.api'
import { getApiErrorMessage } from '../../../api/axios'
import type {
  CorrectionRequestCreateRequest,
  StudentAttendanceHistoryItem,
} from '../../../types/student.types'
import { Modal } from '../../../components/common/Modal'
import { Button, FormField, ErrorMessage } from '../../../components/common'

interface CorrectionRequestFormModalProps {
  isOpen: boolean
  onClose: () => void
  preselectedAttendanceId?: number | null
}

export const CorrectionRequestFormModal: React.FC<CorrectionRequestFormModalProps> = ({
  isOpen,
  onClose,
  preselectedAttendanceId,
}) => {
  const queryClient = useQueryClient()

  const [attendanceId, setAttendanceId] = useState<number | ''>(
    preselectedAttendanceId || ''
  )
  const [requestedStatus, setRequestedStatus] = useState<'PRESENT' | 'ABSENT'>('PRESENT')
  const [reason, setReason] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch recent absent attendance records for the selection dropdown
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['student', 'attendance-history', { attendance_status: 'ABSENT', limit: 20 }],
    queryFn: () => studentApi.getAttendanceHistory({ attendance_status: 'ABSENT', limit: 20 }),
    enabled: isOpen,
  })

  // If a specific attendance ID was preselected, fetch its details to show context
  const { data: preselectedRecord } = useQuery({
    queryKey: ['student', 'attendance-record', preselectedAttendanceId],
    queryFn: () => studentApi.getAttendanceRecordDetail(preselectedAttendanceId!),
    enabled: isOpen && Boolean(preselectedAttendanceId),
  })

  useEffect(() => {
    if (preselectedAttendanceId) {
      setAttendanceId(preselectedAttendanceId)
    } else if (historyData?.items && historyData.items.length > 0) {
      setAttendanceId(historyData.items[0].attendance_id)
    }
  }, [preselectedAttendanceId, historyData])

  const createMutation = useMutation({
    mutationFn: (payload: CorrectionRequestCreateRequest) =>
      studentApi.createCorrectionRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'correction-requests'] })
      queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['student', 'attendance-history'] })
      setReason('')
      setFormError(null)
      onClose()
    },
    onError: (err) => {
      setFormError(getApiErrorMessage(err, 'Failed to submit correction request.'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!attendanceId) {
      setFormError('Please select an attendance record to dispute.')
      return
    }

    const cleanReason = reason.trim()
    if (cleanReason.length < 5) {
      setFormError('Reason must be at least 5 characters long.')
      return
    }

    if (cleanReason.length > 500) {
      setFormError('Reason cannot exceed 500 characters.')
      return
    }

    createMutation.mutate({
      attendance_id: Number(attendanceId),
      requested_status: requestedStatus,
      reason: cleanReason,
    })
  }

  const absentRecords: StudentAttendanceHistoryItem[] = historyData?.items || []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Attendance Correction Request"
      description="Dispute a marked attendance record and submit your justification to the course faculty."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <ErrorMessage message={formError} onDismiss={() => setFormError(null)} />
        )}

        {/* Attendance Record Selector */}
        <FormField label="Target Lecture Attendance Record" required>
          {preselectedRecord ? (
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
              <span className="font-bold text-slate-900 block">
                {preselectedRecord.subject_code} • {preselectedRecord.subject_name}
              </span>
              <span className="text-slate-500 block mt-0.5">
                {preselectedRecord.lecture_date} ({preselectedRecord.start_time.slice(0, 5)} - {preselectedRecord.end_time.slice(0, 5)}) • Recorded: {preselectedRecord.attendance_status}
              </span>
            </div>
          ) : isHistoryLoading ? (
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
          ) : absentRecords.length === 0 ? (
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800">
              No recent absent records found. You can only dispute finalized lectures where attendance was marked.
            </div>
          ) : (
            <select
              value={attendanceId}
              onChange={(e) => setAttendanceId(Number(e.target.value))}
              required
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            >
              {absentRecords.map((rec) => (
                <option key={rec.attendance_id} value={rec.attendance_id}>
                  {rec.lecture_date} • {rec.subject_code} ({rec.attendance_status})
                </option>
              ))}
            </select>
          )}
        </FormField>

        {/* Requested Status */}
        <FormField label="Requested Attendance Status" required>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRequestedStatus('PRESENT')}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                requestedStatus === 'PRESENT'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              PRESENT (Attended)
            </button>
            <button
              type="button"
              onClick={() => setRequestedStatus('ABSENT')}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                requestedStatus === 'ABSENT'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ABSENT (Missed)
            </button>
          </div>
        </FormField>

        {/* Reason */}
        <FormField label="Justification & Reason" required>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={4}
            maxLength={500}
            placeholder="Explain why this attendance record requires correction (e.g. Attended lecture in room 302; verified physical presence with professor)..."
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
          />
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
            <span>Minimum 5 characters</span>
            <span>{reason.length}/500</span>
          </div>
        </FormField>

        {/* Submit Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={createMutation.isPending}
            disabled={!attendanceId || reason.trim().length < 5}
          >
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CorrectionRequestFormModal

