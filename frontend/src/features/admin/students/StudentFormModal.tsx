import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { StudentDetailResponse, StudentCreateRequest, StudentUpdateRequest } from '../../../types/admin.types'
import { Modal, Input, Button, ErrorMessage } from '../../../components/common'

export interface StudentFormModalProps {
  isOpen: boolean
  onClose: () => void
  student?: StudentDetailResponse | null
  onSuccess?: () => void
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  student,
  onSuccess,
}) => {
  const queryClient = useQueryClient()
  const isEdit = !!student

  const [studentName, setStudentName] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (student) {
      setStudentName(student.student_name)
      setRollNumber(student.roll_number)
      setUsername(student.username)
      setEmail(student.email)
    } else {
      setStudentName('')
      setRollNumber('')
      setUsername('')
      setEmail('')
    }
    setErrorMessage(null)
  }, [student, isOpen])

  const createMutation = useMutation({
    mutationFn: (payload: StudentCreateRequest) => adminApi.createStudent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      onSuccess?.()
      onClose()
    },
    onError: (err) => {
      setErrorMessage(getApiErrorMessage(err, 'Failed to create student profile.'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; data: StudentUpdateRequest }) =>
      adminApi.updateStudent(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] })
      onSuccess?.()
      onClose()
    },
    onError: (err) => {
      setErrorMessage(getApiErrorMessage(err, 'Failed to update student profile.'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!studentName.trim() || !rollNumber.trim() || !username.trim() || !email.trim()) {
      setErrorMessage('Please fill in all required fields.')
      return
    }

    if (isEdit && student) {
      updateMutation.mutate({
        id: student.student_id,
        data: {
          student_name: studentName.trim(),
          roll_number: rollNumber.trim(),
          username: username.trim(),
          email: email.trim(),
        },
      })
    } else {
      createMutation.mutate({
        student_name: studentName.trim(),
        roll_number: rollNumber.trim(),
        username: username.trim(),
        email: email.trim(),
      })
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Student Profile' : 'Register New Student'}
      description={
        isEdit
          ? `Updating details for roll number ${student?.roll_number}`
          : 'Creates a student profile and linked active user login credentials.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <ErrorMessage message={errorMessage} onDismiss={() => setErrorMessage(null)} />}

        <Input
          label="Full Name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="e.g. Aarav Patil"
          required
          disabled={isSubmitting}
        />

        <Input
          label="College Roll Number"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value)}
          placeholder="e.g. student01"
          required
          disabled={isSubmitting}
        />

        <Input
          label="Login Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. student01"
          required
          disabled={isSubmitting}
        />

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. student01@college.edu"
          required
          disabled={isSubmitting}
        />

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Student'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default StudentFormModal

