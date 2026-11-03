import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { SubjectDetailResponse, SubjectCreateRequest, SubjectUpdateRequest } from '../../../types/admin.types'
import { Modal, Input, Select, Button, ErrorMessage } from '../../../components/common'

export interface SubjectFormModalProps {
  isOpen: boolean
  onClose: () => void
  subject?: SubjectDetailResponse | null
  onSuccess?: () => void
}

export const SubjectFormModal: React.FC<SubjectFormModalProps> = ({
  isOpen,
  onClose,
  subject,
  onSuccess,
}) => {
  const queryClient = useQueryClient()
  const isEdit = !!subject

  const [subjectCode, setSubjectCode] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [semester, setSemester] = useState<number>(3)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (subject) {
      setSubjectCode(subject.subject_code)
      setSubjectName(subject.subject_name)
      setSemester(subject.semester)
    } else {
      setSubjectCode('')
      setSubjectName('')
      setSemester(3)
    }
    setErrorMessage(null)
  }, [subject, isOpen])

  const createMutation = useMutation({
    mutationFn: (payload: SubjectCreateRequest) => adminApi.createSubject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subjects'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      onSuccess?.()
      onClose()
    },
    onError: (err) => {
      setErrorMessage(getApiErrorMessage(err, 'Failed to create academic subject.'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; data: SubjectUpdateRequest }) =>
      adminApi.updateSubject(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subjects'] })
      onSuccess?.()
      onClose()
    },
    onError: (err) => {
      setErrorMessage(getApiErrorMessage(err, 'Failed to update academic subject.'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!subjectCode.trim() || !subjectName.trim()) {
      setErrorMessage('Please fill in both subject code and subject name.')
      return
    }

    if (semester < 1 || semester > 8) {
      setErrorMessage('Semester must be between 1 and 8.')
      return
    }

    if (isEdit && subject) {
      updateMutation.mutate({
        id: subject.subject_id,
        data: {
          subject_code: subjectCode.trim().toUpperCase(),
          subject_name: subjectName.trim(),
          semester: Number(semester),
        },
      })
    } else {
      createMutation.mutate({
        subject_code: subjectCode.trim().toUpperCase(),
        subject_name: subjectName.trim(),
        semester: Number(semester),
      })
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
    value: s,
    label: `Semester ${s}`,
  }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Curriculum Subject' : 'Add Curriculum Subject'}
      description={
        isEdit
          ? `Updating details for subject ${subject?.subject_code}`
          : 'Creates a new academic course subject with assigned semester.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <ErrorMessage message={errorMessage} onDismiss={() => setErrorMessage(null)} />}

        <Input
          label="Subject Code"
          value={subjectCode}
          onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
          placeholder="e.g. DBMS, OS, CN"
          helperText="Unique uppercase subject identifier"
          required
          disabled={isSubmitting}
        />

        <Input
          label="Subject Full Name"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          placeholder="e.g. Database Management Systems"
          required
          disabled={isSubmitting}
        />

        <Select
          label="Academic Semester"
          value={semester}
          onChange={(e) => setSemester(Number(e.target.value))}
          options={semesterOptions}
          required
          disabled={isSubmitting}
        />

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Subject'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default SubjectFormModal

