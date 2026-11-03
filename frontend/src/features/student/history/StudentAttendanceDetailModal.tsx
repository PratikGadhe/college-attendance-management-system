import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
} from 'lucide-react'
import studentApi from '../../../api/student.api'
import { getApiErrorMessage } from '../../../api/axios'
import { Modal } from '../../../components/common/Modal'
import { Button, LoadingSpinner, ErrorMessage } from '../../../components/common'

interface StudentAttendanceDetailModalProps {
  isOpen: boolean
  onClose: () => void
  attendanceId: number | null
}

export const StudentAttendanceDetailModal: React.FC<StudentAttendanceDetailModalProps> = ({
  isOpen,
  onClose,
  attendanceId,
}) => {
  const { data: record, isLoading, error, refetch } = useQuery({
    queryKey: ['student', 'attendance-record', attendanceId],
    queryFn: () => studentApi.getAttendanceRecordDetail(attendanceId!),
    enabled: isOpen && attendanceId !== null,
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attendance Record Details"
      description={`Record #${attendanceId || ''} • Academic lecture session verification`}
      maxWidth="md"
    >
      {isLoading ? (
        <div className="p-12 flex justify-center">
          <LoadingSpinner size="md" text="Loading session record..." />
        </div>
      ) : error ? (
        <div className="p-4">
          <ErrorMessage
            title="Failed to load record"
            message={getApiErrorMessage(error)}
            onRetry={() => refetch()}
          />
        </div>
      ) : record ? (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3">
            <div>
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {record.subject_code}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {record.subject_name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {record.class_name} • Division {record.division}
              </p>
            </div>

            {record.attendance_status === 'PRESENT' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                PRESENT
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                <XCircle className="w-4 h-4" />
                ABSENT
              </span>
            )}
          </div>

          {/* Time & Session Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-slate-400 block mb-1">Lecture Date</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-sky-600" />
                {record.lecture_date}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-slate-400 block mb-1">Lecture Time</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                {record.start_time.slice(0, 5)} - {record.end_time.slice(0, 5)}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-slate-400 block mb-1">Marked Timestamp</span>
              <span className="font-semibold text-slate-900">
                {record.marked_at ? new Date(record.marked_at).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-slate-400 block mb-1">Finalized At</span>
              <span className="font-semibold text-slate-900">
                {record.submitted_at ? new Date(record.submitted_at).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>

            {record.attendance_status === 'ABSENT' && (
              <Link
                to={`/student/correction-requests?attendance_id=${record.attendance_id}`}
                onClick={onClose}
              >
                <Button variant="primary" size="sm" leftIcon={<FileEdit className="w-4 h-4" />}>
                  Dispute Attendance
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

export default StudentAttendanceDetailModal
