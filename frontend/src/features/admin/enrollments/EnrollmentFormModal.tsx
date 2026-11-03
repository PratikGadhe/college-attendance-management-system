import React, { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { EnrollmentCreateRequest } from '../../../types/admin.types'
import { Modal, Input, Select, Button, ErrorMessage } from '../../../components/common'

export interface EnrollmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const EnrollmentFormModal: React.FC<EnrollmentFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient()

  const [studentId, setStudentId] = useState<number | ''>('')
  const [classId, setClassId] = useState<number | ''>('')
  const [enrollmentDate, setEnrollmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch students for dropdown
  const { data: studentsData, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['admin', 'students', 'dropdown'],
    queryFn: () => adminApi.getStudents({ limit: 100, account_status: 'ACTIVE' }),
    enabled: isOpen,
  })

  // Fetch classes for dropdown
  const { data: classesData, isLoading: isClassesLoading } = useQuery({
    queryKey: ['admin', 'classes', 'dropdown'],
    queryFn: () => adminApi.getClasses({ limit: 100 }),
    enabled: isOpen,
  })

  useEffect(() => {
    if (isOpen) {
      setStudentId('')
      setClassId('')
      setEnrollmentDate(new Date().toISOString().split('T')[0])
      setErrorMessage(null)
    }
  }, [isOpen])

  const createMutation = useMutation({
    mutationFn: (payload: EnrollmentCreateRequest) => adminApi.createEnrollment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'classes'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      onSuccess?.()
      onClose()
    },
    onError: (err) => {
      setErrorMessage(getApiErrorMessage(err, 'Failed to enroll student.'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (studentId === '' || classId === '' || !enrollmentDate.trim()) {
      setErrorMessage('Please select a student, a class, and an enrollment date.')
      return
    }

    createMutation.mutate({
      student_id: Number(studentId),
      class_id: Number(classId),
      enrollment_date: enrollmentDate.trim(),
    })
  }

  const isSubmitting = createMutation.isPending

  const studentOptions = (studentsData?.items || []).map((s) => ({
    value: s.student_id,
    label: `${s.student_name} (${s.roll_number})`,
  }))

  const classOptions = (classesData?.items || []).map((c) => ({
    value: c.class_id,
    label: `${c.class_name} - Div ${c.division} (${c.department_name})`,
  }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enroll Student in Class"
      description="Assigns an active student to an academic class roster."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <ErrorMessage message={errorMessage} onDismiss={() => setErrorMessage(null)} />}

        <Select
          label="Select Student"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value ? Number(e.target.value) : '')}
          options={studentOptions}
          placeholderOption={isStudentsLoading ? 'Loading students...' : 'Choose a student...'}
          required
          disabled={isSubmitting || isStudentsLoading}
        />

        <Select
          label="Select Class"
          value={classId}
          onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : '')}
          options={classOptions}
          placeholderOption={isClassesLoading ? 'Loading classes...' : 'Choose a class...'}
          required
          disabled={isSubmitting || isClassesLoading}
        />

        <Input
          label="Enrollment Date"
          type="date"
          value={enrollmentDate}
          onChange={(e) => setEnrollmentDate(e.target.value)}
          required
          disabled={isSubmitting}
        />

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Confirm Enrollment
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default EnrollmentFormModal

