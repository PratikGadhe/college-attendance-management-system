import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarDays,
  Clock,
  CheckSquare,
} from 'lucide-react'
import facultyApi from '../../../api/faculty.api'
import { getApiErrorMessage } from '../../../api/axios'
import { Modal } from '../../../components/common/Modal'
import { Button, StatusBadge, LoadingSpinner, ErrorMessage } from '../../../components/common'

interface LectureDetailModalProps {
  isOpen: boolean
  onClose: () => void
  lectureId: number | null
}

export const LectureDetailModal: React.FC<LectureDetailModalProps> = ({
  isOpen,
  onClose,
  lectureId,
}) => {
  const { data: lecture, isLoading, error, refetch } = useQuery({
    queryKey: ['faculty', 'lectures', lectureId],
    queryFn: () => facultyApi.getLectureDetails(lectureId!),
    enabled: isOpen && lectureId !== null,
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lecture Session Details"
      description={`Session ID #${lectureId || ''} • Academic lecture record and attendance metrics`}
      maxWidth="lg"
    >
      {isLoading ? (
        <div className="p-12 flex justify-center">
          <LoadingSpinner size="md" text="Loading lecture details..." />
        </div>
      ) : error ? (
        <div className="p-4">
          <ErrorMessage
            title="Failed to load lecture"
            message={getApiErrorMessage(error)}
            onRetry={() => refetch()}
          />
        </div>
      ) : lecture ? (
        <div className="space-y-5">
          {/* Header Info Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {lecture.subject_code}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {lecture.subject_name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lecture.class_name} • Division {lecture.division} • Semester {lecture.semester} • {lecture.department_name}
              </p>
            </div>
            <StatusBadge status={lecture.lecture_status} size="md" />
          </div>

          {/* Time & Scheduling Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-slate-400 block mb-1">Lecture Date</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-sky-600" />
                {lecture.lecture_date}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-slate-400 block mb-1">Time Slot</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                {lecture.start_time.slice(0, 5)} - {lecture.end_time.slice(0, 5)}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-slate-400 block mb-1">Academic Year</span>
              <span className="font-semibold text-slate-900">{lecture.academic_year}</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-slate-400 block mb-1">Submitted At</span>
              <span className="font-semibold text-slate-900">
                {lecture.submitted_at
                  ? new Date(lecture.submitted_at).toLocaleDateString()
                  : 'Not Submitted'}
              </span>
            </div>
          </div>

          {/* Attendance Stats Cards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Attendance Roster Summary
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block">Enrolled Students</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">
                  {lecture.total_enrolled_students}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-xs text-emerald-700 block">Present</span>
                <span className="text-xl font-bold text-emerald-800 mt-1 block">
                  {lecture.present_count}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                <span className="text-xs text-rose-700 block">Absent</span>
                <span className="text-xl font-bold text-rose-800 mt-1 block">
                  {lecture.absent_count}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-xs text-amber-700 block">Unmarked</span>
                <span className="text-xl font-bold text-amber-800 mt-1 block">
                  {lecture.unmarked_students}
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {lecture.lecture_status === 'CANCELLED' ? (
              <span className="text-xs text-rose-600 font-medium">
                Lecture cancelled — attendance cannot be marked.
              </span>
            ) : (
              <Link to={`/faculty/attendance?lecture_id=${lecture.lecture_id}`} onClick={onClose}>
                <Button variant="primary" size="sm" leftIcon={<CheckSquare className="w-4 h-4" />}>
                  {lecture.lecture_status === 'DRAFT' ? 'Mark Attendance' : 'View Class Roster'}
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

export default LectureDetailModal
