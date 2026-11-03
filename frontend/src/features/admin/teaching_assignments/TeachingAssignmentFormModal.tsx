import React, { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type {
  TeachingAssignmentDetailResponse,
  TeachingAssignmentCreateRequest,
  TeachingAssignmentUpdateRequest,
} from '../../../types/admin.types'
import { Modal, Select, Button, ErrorMessage } from '../../../components/common'

export interface TeachingAssignmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  assignment?: TeachingAssignmentDetailResponse | null
  onSuccess?: () => void
}

export const TeachingAssignmentFormModal: React.FC<TeachingAssignmentFormModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onSuccess,
}) => {
  const queryClient = useQueryClient()
  const isEdit = !!assignment

  const [facultyId, setFacultyId] = useState<number | ''>('')
  const [subjectId, setSubjectId] = useState<number | ''>('')
  const [classId, setClassId] = useState<number | ''>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch faculty members for dropdown
  const { data: facultyData, isLoading: isFacultyLoading } = useQuery({
    queryKey: ['admin', 'faculty', 'dropdown'],
    queryFn: () => adminApi.getFaculty({ limit: 100, account_status: 'ACTIVE' }),
    enabled: isOpen,
  })

  // Fetch subjects for dropdown
  const { data: subjectsData, isLoading: isSubjectsLoading } = useQuery({
    queryKey: ['admin', 'subjects', 'dropdown'],
    queryFn: () => adminApi.getSubjects({ limit: 100 }),
    enabled: isOpen,
  })

  // Fetch classes for dropdown
  const { data: classesData, isLoading: isClassesLoading } = useQuery({
    queryKey: ['admin', 'classes', 'dropdown'],
    queryFn: () => adminApi.getClasses({ limit: 100 }),
    enabled: isOpen,
  })

  useEffect(() => {
    if (assignment) {
      setFacultyId(assignment.faculty_id)
      setSubjectId(assignment.subject_id)
      setClassId(assignment.class_id)
    } else {
      setFacultyId('')
      setSubjectId('')
      setClassId('')
    }
    setErrorMessage(null)
  }, [assignment, isOpen])

  const createMutation = useMutation({
    mutationFn: (payload: TeachingAssignmentCreateRequest) =>
      adminApi.createTeachingAssignment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teaching-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      onSuccess?.()
      onClose()
    },
    onError: (err) => {
      setErrorMessage(getApiErrorMessage(err, 'Failed to assign course.'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; data: TeachingAssignmentUpdateRequest }) =>
      adminApi.updateTeachingAssignment(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teaching-assignments'] })
      onSuccess?.()
      onClose()
    },
    onError: (err) => {
      setErrorMessage(getApiErrorMessage(err, 'Failed to update course assignment.'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (facultyId === '' || subjectId === '' || classId === '') {
      setErrorMessage('Please select a faculty member, a subject, and a class.')
      return
    }

    if (isEdit && assignment) {
      updateMutation.mutate({
        id: assignment.assignment_id,
        data: {
          faculty_id: Number(facultyId),
          subject_id: Number(subjectId),
          class_id: Number(classId),
        },
      })
    } else {
      createMutation.mutate({
        faculty_id: Number(facultyId),
        subject_id: Number(subjectId),
        class_id: Number(classId),
      })
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const facultyOptions = (facultyData?.items || []).map((f) => ({
    value: f.faculty_id,
    label: `${f.faculty_name} (${f.department_name})`,
  }))

  const subjectOptions = (subjectsData?.items || []).map((s) => ({
    value: s.subject_id,
    label: `${s.subject_name} (${s.subject_code} - Sem ${s.semester})`,
  }))

  const classOptions = (classesData?.items || []).map((c) => ({
    value: c.class_id,
    label: `${c.class_name} - Div ${c.division} (Sem ${c.semester})`,
  }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Teaching Assignment' : 'Create Teaching Assignment'}
      description={
        isEdit
          ? `Updating course assignment #${assignment?.assignment_id}`
          : 'Assigns a faculty member to teach an academic subject for a specific class section.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <ErrorMessage message={errorMessage} onDismiss={() => setErrorMessage(null)} />}

        <Select
          label="Assigned Faculty Member"
          value={facultyId}
          onChange={(e) => setFacultyId(e.target.value ? Number(e.target.value) : '')}
          options={facultyOptions}
          placeholderOption={isFacultyLoading ? 'Loading faculty...' : 'Choose faculty...'}
          required
          disabled={isSubmitting || isFacultyLoading}
        />

        <Select
          label="Subject Curriculum Course"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : '')}
          options={subjectOptions}
          placeholderOption={isSubjectsLoading ? 'Loading subjects...' : 'Choose subject...'}
          required
          disabled={isSubmitting || isSubjectsLoading}
        />

        <Select
          label="Target Academic Class Section"
          value={classId}
          onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : '')}
          options={classOptions}
          placeholderOption={isClassesLoading ? 'Loading classes...' : 'Choose class...'}
          required
          disabled={isSubmitting || isClassesLoading}
        />

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Confirm Assignment'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default TeachingAssignmentFormModal

