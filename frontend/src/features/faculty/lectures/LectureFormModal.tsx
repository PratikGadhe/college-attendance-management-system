import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import facultyApi from '../../../api/faculty.api'
import { getApiErrorMessage } from '../../../api/axios'
import type {
  FacultyTeachingAssignmentResponse,
  FacultyLectureListItem,
  LectureCreateRequest,
  LectureUpdateRequest,
} from '../../../types/faculty.types'
import { Modal } from '../../../components/common/Modal'
import { Button, FormField, ErrorMessage } from '../../../components/common'

interface LectureFormModalProps {
  isOpen: boolean
  onClose: () => void
  lectureToEdit?: FacultyLectureListItem | null
  assignments: FacultyTeachingAssignmentResponse[]
  preselectedAssignmentId?: number | null
}

export const LectureFormModal: React.FC<LectureFormModalProps> = ({
  isOpen,
  onClose,
  lectureToEdit,
  assignments,
  preselectedAssignmentId,
}) => {
  const queryClient = useQueryClient()
  const isEditing = Boolean(lectureToEdit)

  // Form states
  const [assignmentId, setAssignmentId] = useState<number | ''>('')
  const [lectureDate, setLectureDate] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('09:00')
  const [endTime, setEndTime] = useState<string>('10:00')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (lectureToEdit) {
      setAssignmentId(lectureToEdit.assignment_id)
      setLectureDate(lectureToEdit.lecture_date)
      setStartTime(lectureToEdit.start_time.slice(0, 5))
      setEndTime(lectureToEdit.end_time.slice(0, 5))
    } else {
      if (preselectedAssignmentId) {
        setAssignmentId(preselectedAssignmentId)
      } else if (assignments.length > 0) {
        setAssignmentId(assignments[0].assignment_id)
      } else {
        setAssignmentId('')
      }
      // Default to today's date formatted as YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0]
      setLectureDate(today)
      setStartTime('09:00')
      setEndTime('10:00')
    }
    setFormError(null)
  }, [lectureToEdit, assignments, preselectedAssignmentId, isOpen])

  const createMutation = useMutation({
    mutationFn: (payload: LectureCreateRequest) => facultyApi.createLecture(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty', 'lectures'] })
      queryClient.invalidateQueries({ queryKey: ['faculty', 'dashboard'] })
      onClose()
    },
    onError: (err) => {
      setFormError(getApiErrorMessage(err, 'Failed to schedule lecture.'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: LectureUpdateRequest }) =>
      facultyApi.updateLecture(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty', 'lectures'] })
      queryClient.invalidateQueries({ queryKey: ['faculty', 'dashboard'] })
      onClose()
    },
    onError: (err) => {
      setFormError(getApiErrorMessage(err, 'Failed to update lecture.'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!isEditing && !assignmentId) {
      setFormError('Please select a course/assignment.')
      return
    }

    if (!lectureDate) {
      setFormError('Lecture date is required.')
      return
    }

    if (!startTime || !endTime) {
      setFormError('Start time and end time are required.')
      return
    }

    if (startTime >= endTime) {
      setFormError('End time must be after start time.')
      return
    }

    // Ensure times format HH:MM:SS
    const formattedStart = startTime.length === 5 ? `${startTime}:00` : startTime
    const formattedEnd = endTime.length === 5 ? `${endTime}:00` : endTime

    if (isEditing && lectureToEdit) {
      updateMutation.mutate({
        id: lectureToEdit.lecture_id,
        payload: {
          lecture_date: lectureDate,
          start_time: formattedStart,
          end_time: formattedEnd,
        },
      })
    } else {
      createMutation.mutate({
        assignment_id: Number(assignmentId),
        lecture_date: lectureDate,
        start_time: formattedStart,
        end_time: formattedEnd,
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Draft Lecture Schedule' : 'Schedule New Lecture'}
      description={
        isEditing
          ? 'Modify the date or time slot of this draft lecture before marking attendance.'
          : 'Create a new lecture session in DRAFT status for one of your assigned courses.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <ErrorMessage message={formError} onDismiss={() => setFormError(null)} />
        )}

        {/* Course Assignment */}
        <FormField label="Assigned Course & Class" required>
          {isEditing ? (
            <input
              type="text"
              disabled
              value={`${lectureToEdit?.subject_code} - ${lectureToEdit?.subject_name} (${lectureToEdit?.class_name})`}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          ) : (
            <select
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value ? Number(e.target.value) : '')}
              required
              disabled={assignments.length === 0}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            >
              {assignments.length === 0 ? (
                <option value="">No teaching assignments available</option>
              ) : (
                assignments.map((a) => (
                  <option key={a.assignment_id} value={a.assignment_id}>
                    {a.subject_code} - {a.subject_name} • {a.class_name} (Div {a.division})
                  </option>
                ))
              )}
            </select>
          )}
        </FormField>

        {/* Lecture Date */}
        <FormField label="Lecture Date" required>
          <input
            type="date"
            value={lectureDate}
            onChange={(e) => setLectureDate(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
          />
        </FormField>

        {/* Start & End Times */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start Time" required>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            />
          </FormField>
          <FormField label="End Time" required>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            />
          </FormField>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isPending}>
            {isEditing ? 'Save Changes' : 'Create Draft Lecture'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default LectureFormModal
