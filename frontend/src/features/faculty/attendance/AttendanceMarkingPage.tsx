import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckSquare,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  Send,
  ArrowLeft,
  Lock,
  RotateCcw,
} from 'lucide-react'
import facultyApi from '../../../api/faculty.api'
import { getApiErrorMessage } from '../../../api/axios'
import type {
  AttendanceStatus,
  AttendanceMarkItem,
  RosterStudentItem,
  FacultyLectureListItem,
} from '../../../types/faculty.types'
import {
  PageHeader,
  Card,
  Button,
  StatusBadge,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  ConfirmDialog,
} from '../../../components/common'

export const AttendanceMarkingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  // Selected lecture ID from URL
  const lectureIdParam = searchParams.get('lecture_id')
  const [selectedLectureId, setSelectedLectureId] = useState<number | null>(
    lectureIdParam ? Number(lectureIdParam) : null
  )

  // Local attendance state: student_id -> 'PRESENT' | 'ABSENT'
  const [attendanceMap, setAttendanceMap] = useState<Record<number, AttendanceStatus>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null)

  // 1. Fetch faculty's lectures for the selector dropdown
  const { data: lecturesData, isLoading: isLecturesListLoading } = useQuery({
    queryKey: ['faculty', 'lectures', { limit: 50 }],
    queryFn: () => facultyApi.getLectures({ limit: 50 }),
  })
  const lectures: FacultyLectureListItem[] = lecturesData?.items || []

  // Default to the first lecture if none selected
  useEffect(() => {
    if (!selectedLectureId && lectures.length > 0) {
      const firstEligible = lectures.find((l) => l.lecture_status === 'DRAFT') || lectures[0]
      setSelectedLectureId(firstEligible.lecture_id)
      setSearchParams({ lecture_id: String(firstEligible.lecture_id) }, { replace: true })
    }
  }, [lectures, selectedLectureId, setSearchParams])

  // 2. Fetch selected lecture details
  const {
    data: lectureDetail,
    isLoading: isDetailLoading,
    error: detailError,
  } = useQuery({
    queryKey: ['faculty', 'lecture-details', selectedLectureId],
    queryFn: () => facultyApi.getLectureDetails(selectedLectureId!),
    enabled: selectedLectureId !== null,
  })

  // 3. Fetch lecture roster
  const {
    data: rosterData,
    isLoading: isRosterLoading,
    error: rosterError,
    refetch: refetchRoster,
  } = useQuery({
    queryKey: ['faculty', 'roster', selectedLectureId],
    queryFn: () => facultyApi.getLectureRoster(selectedLectureId!),
    enabled: selectedLectureId !== null,
  })

  // Sync roster data into local attendance map
  useEffect(() => {
    if (rosterData?.students) {
      const initialMap: Record<number, AttendanceStatus> = {}
      rosterData.students.forEach((student) => {
        if (student.attendance_status === 'PRESENT' || student.attendance_status === 'ABSENT') {
          initialMap[student.student_id] = student.attendance_status
        }
      })
      setAttendanceMap(initialMap)
      setHasUnsavedChanges(false)
    }
  }, [rosterData])

  const students: RosterStudentItem[] = rosterData?.students || []
  const isDraft = lectureDetail?.lecture_status === 'DRAFT'
  const isSubmitted = lectureDetail?.lecture_status === 'SUBMITTED'
  const isCancelled = lectureDetail?.lecture_status === 'CANCELLED'

  // Summary counts
  const totalEnrolled = students.length
  const presentCount = useMemo(
    () => Object.values(attendanceMap).filter((s) => s === 'PRESENT').length,
    [attendanceMap]
  )
  const absentCount = useMemo(
    () => Object.values(attendanceMap).filter((s) => s === 'ABSENT').length,
    [attendanceMap]
  )
  const markedCount = presentCount + absentCount
  const unmarkedCount = totalEnrolled - markedCount
  const allMarked = totalEnrolled > 0 && unmarkedCount === 0

  // 4. Save Draft mutation
  const saveMutation = useMutation({
    mutationFn: (records: AttendanceMarkItem[]) =>
      facultyApi.saveAttendance(selectedLectureId!, { records }),
    onSuccess: (updatedRoster) => {
      queryClient.setQueryData(['faculty', 'roster', selectedLectureId], updatedRoster)
      queryClient.invalidateQueries({ queryKey: ['faculty', 'lecture-details', selectedLectureId] })
      queryClient.invalidateQueries({ queryKey: ['faculty', 'lectures'] })
      setHasUnsavedChanges(false)
      setActionErrorMessage(null)
      setActionSuccessMessage('Draft attendance saved successfully.')
    },
    onError: (err) => {
      setActionErrorMessage(getApiErrorMessage(err, 'Failed to save attendance draft.'))
    },
  })

  // 5. Submit Final Attendance mutation
  const submitMutation = useMutation({
    mutationFn: () => facultyApi.submitAttendance(selectedLectureId!),
    onSuccess: (submissionRes) => {
      queryClient.invalidateQueries({ queryKey: ['faculty', 'roster', selectedLectureId] })
      queryClient.invalidateQueries({ queryKey: ['faculty', 'lecture-details', selectedLectureId] })
      queryClient.invalidateQueries({ queryKey: ['faculty', 'lectures'] })
      queryClient.invalidateQueries({ queryKey: ['faculty', 'dashboard'] })
      setIsSubmitConfirmOpen(false)
      setHasUnsavedChanges(false)
      setActionErrorMessage(null)
      setActionSuccessMessage(submissionRes.message || 'Attendance submitted and locked successfully!')
    },
    onError: (err) => {
      setIsSubmitConfirmOpen(false)
      setActionErrorMessage(getApiErrorMessage(err, 'Failed to submit attendance.'))
    },
  })

  // Handlers
  const handleSelectLecture = (id: number) => {
    setSelectedLectureId(id)
    setSearchParams({ lecture_id: String(id) })
    setActionSuccessMessage(null)
    setActionErrorMessage(null)
  }

  const handleSetStudentStatus = (studentId: number, status: AttendanceStatus) => {
    if (!isDraft) return
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }))
    setHasUnsavedChanges(true)
    setActionSuccessMessage(null)
  }

  const handleMarkAll = (status: AttendanceStatus) => {
    if (!isDraft) return
    const nextMap: Record<number, AttendanceStatus> = {}
    students.forEach((s) => {
      nextMap[s.student_id] = status
    })
    setAttendanceMap(nextMap)
    setHasUnsavedChanges(true)
    setActionSuccessMessage(null)
  }

  const handleClearAll = () => {
    if (!isDraft) return
    setAttendanceMap({})
    setHasUnsavedChanges(true)
    setActionSuccessMessage(null)
  }

  const handleSaveDraft = () => {
    if (!isDraft || !selectedLectureId) return
    const records: AttendanceMarkItem[] = Object.entries(attendanceMap).map(([sId, status]) => ({
      student_id: Number(sId),
      status,
    }))
    if (records.length === 0) {
      setActionErrorMessage('Please mark at least one student before saving.')
      return
    }
    saveMutation.mutate(records)
  }

  const handleOpenSubmitConfirm = () => {
    if (!allMarked) {
      setActionErrorMessage(
        `Cannot submit attendance: ${unmarkedCount} student(s) remain unmarked. Mark all students as Present or Absent before final submission.`
      )
      return
    }

    // Save draft first if there are unsaved local marks, then prompt submit
    if (hasUnsavedChanges) {
      const records: AttendanceMarkItem[] = Object.entries(attendanceMap).map(([sId, status]) => ({
        student_id: Number(sId),
        status,
      }))
      saveMutation.mutate(records, {
        onSuccess: () => {
          setIsSubmitConfirmOpen(true)
        },
      })
    } else {
      setIsSubmitConfirmOpen(true)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Marking & Roster"
        description="Record and finalize student attendance for scheduled course lectures."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckSquare className="w-3.5 h-3.5" />
            ATTENDANCE DISPATCH
          </span>
        }
        actions={
          <Link to="/faculty/lectures">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Lectures
            </Button>
          </Link>
        }
      />

      {/* Messages */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionErrorMessage && (
        <ErrorMessage
          message={actionErrorMessage}
          onDismiss={() => setActionErrorMessage(null)}
        />
      )}

      {/* Lecture Selector & Summary Card */}
      <Card noPadding className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Selector Dropdown */}
          <div className="w-full lg:max-w-md">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Select Lecture Session
            </label>
            {isLecturesListLoading ? (
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            ) : lectures.length === 0 ? (
              <div className="text-xs text-slate-500">No scheduled lectures found.</div>
            ) : (
              <select
                value={selectedLectureId || ''}
                onChange={(e) => handleSelectLecture(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
              >
                {lectures.map((lec) => (
                  <option key={lec.lecture_id} value={lec.lecture_id}>
                    [{lec.lecture_status}] {lec.lecture_date} • {lec.subject_code} ({lec.class_name} Div {lec.division}) • {lec.start_time.slice(0, 5)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Active Lecture Metadata */}
          {lectureDetail && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-600 border-t lg:border-t-0 pt-3 lg:pt-0">
              <div>
                <span className="text-slate-400 block mb-0.5">Subject & Class</span>
                <span className="font-bold text-slate-900">
                  {lectureDetail.subject_code} • {lectureDetail.class_name} ({lectureDetail.division})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Date & Time</span>
                <span className="font-bold text-slate-900">
                  {lectureDetail.lecture_date} • {lectureDetail.start_time.slice(0, 5)} - {lectureDetail.end_time.slice(0, 5)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Session Status</span>
                <StatusBadge status={lectureDetail.lecture_status} size="sm" />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Main Roster & Marking Area */}
      {isDetailLoading || isRosterLoading ? (
        <div className="p-16 flex justify-center">
          <LoadingSpinner size="lg" text="Loading lecture attendance roster..." />
        </div>
      ) : detailError || rosterError ? (
        <ErrorMessage
          title="Failed to load lecture roster"
          message={getApiErrorMessage(detailError || rosterError)}
          onRetry={() => refetchRoster()}
        />
      ) : !selectedLectureId ? (
        <Card>
          <EmptyState
            icon={<CheckSquare className="w-10 h-10" />}
            title="No Lecture Selected"
            description="Choose a lecture session from the dropdown above to load the enrolled class roster."
          />
        </Card>
      ) : isCancelled ? (
        <Card className="border-rose-200 bg-rose-50/50">
          <div className="flex items-start gap-3 p-4">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-rose-900">Session Cancelled</h3>
              <p className="text-xs sm:text-sm text-rose-700 mt-1">
                This lecture was cancelled. Attendance cannot be recorded or modified for cancelled lectures.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Status Banners */}
          {isSubmitted && (
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs sm:text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  <strong>Attendance Finalized:</strong> Submitted on{' '}
                  {lectureDetail?.submitted_at
                    ? new Date(lectureDetail.submitted_at).toLocaleString()
                    : 'N/A'}
                  . Records are locked. Any dispute must be submitted by students via the correction request workflow.
                </span>
              </div>
            </div>
          )}

          {/* Attendance Stats & Quick Actions Toolbar */}
          <Card noPadding className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Stat Counters */}
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                  <span className="text-slate-500">Enrolled: </span>
                  <strong className="text-slate-900">{totalEnrolled}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  <span>Present: </span>
                  <strong>{presentCount}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <span>Absent: </span>
                  <strong>{absentCount}</strong>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-lg border text-xs ${
                    unmarkedCount > 0
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-medium'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span>Unmarked: </span>
                  <strong>{unmarkedCount}</strong>
                </div>
              </div>

              {/* Actions for Draft */}
              {isDraft && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAll('PRESENT')}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    All Present
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAll('ABSENT')}
                    leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}
                  >
                    All Absent
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Reset
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Roster Table */}
          <Card noPadding>
            {students.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">Class Roster Empty</h4>
                <p className="text-xs text-slate-500 mt-1">
                  No active students enrolled in this class section yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4 w-16">#</th>
                      <th className="py-3 px-4 w-32">Roll Number</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 w-44">Attendance Status</th>
                      <th className="py-3 px-4 w-48 text-right">Selection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {students.map((student, idx) => {
                      const currentStatus = attendanceMap[student.student_id]
                      const isPresent = currentStatus === 'PRESENT'
                      const isAbsent = currentStatus === 'ABSENT'
                      const isUnmarked = !currentStatus

                      return (
                        <tr
                          key={student.student_id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isUnmarked && isDraft ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          {/* Row Number */}
                          <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                            {idx + 1}
                          </td>

                          {/* Roll Number */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {student.roll_number}
                          </td>

                          {/* Student Name */}
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {student.student_name}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-4">
                            {isPresent ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                PRESENT
                              </span>
                            ) : isAbsent ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                <XCircle className="w-3.5 h-3.5" />
                                ABSENT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                <AlertCircle className="w-3.5 h-3.5" />
                                UNMARKED
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-right">
                            {isDraft ? (
                              <div className="inline-flex items-center rounded-xl p-0.5 bg-slate-100 border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => handleSetStudentStatus(student.student_id, 'PRESENT')}
                                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                    isPresent
                                      ? 'bg-emerald-600 text-white shadow-2xs'
                                      : 'text-slate-600 hover:text-emerald-700'
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetStudentStatus(student.student_id, 'ABSENT')}
                                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                    isAbsent
                                      ? 'bg-rose-600 text-white shadow-2xs'
                                      : 'text-slate-600 hover:text-rose-700'
                                  }`}
                                >
                                  Absent
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">Locked</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Finalize Bar (Draft only) */}
            {isDraft && students.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900">
                    {allMarked ? (
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        All {totalEnrolled} students marked. Ready for final submission.
                      </span>
                    ) : (
                      <span className="text-amber-800 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        {unmarkedCount} student(s) still unmarked. All students must be marked to submit.
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Save Draft keeps your progress. Final Submit permanently finalizes and locks the records.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDraft}
                    isLoading={saveMutation.isPending}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    Save Draft
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenSubmitConfirm}
                    disabled={!allMarked || saveMutation.isPending || submitMutation.isPending}
                    isLoading={submitMutation.isPending}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Finalize & Submit
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Confirmation Dialog Before Final Submission */}
      <ConfirmDialog
        isOpen={isSubmitConfirmOpen}
        onCancel={() => setIsSubmitConfirmOpen(false)}
        onConfirm={() => submitMutation.mutate()}
        title="Finalize Lecture Attendance"
        message={`Are you ready to submit attendance for this lecture session? This will finalize records for ${totalEnrolled} students (${presentCount} Present, ${absentCount} Absent). Once submitted, attendance records are locked and can only be amended through formal student correction requests.`}
        confirmText="Yes, Finalize & Submit"
        variant="primary"
        isLoading={submitMutation.isPending}
      />
    </div>
  )
}

export default AttendanceMarkingPage
