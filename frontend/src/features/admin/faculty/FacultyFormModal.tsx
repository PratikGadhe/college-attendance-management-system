import React, { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { FacultyDetailResponse, FacultyCreateRequest, FacultyUpdateRequest } from '../../../types/admin.types'
import { Modal, Input, Select, Button, ErrorMessage } from '../../../components/common'

export interface FacultyFormModalProps {
  isOpen: boolean
  onClose: () => void
  faculty?: FacultyDetailResponse | null
  onSuccess?: () => void
}

export const FacultyFormModal: React.FC<FacultyFormModalProps> = ({
  isOpen,
  onClose,
  faculty,
  onSuccess,
}) => {
  const queryClient = useQueryClient()
  const isEdit = !!faculty

  const [facultyName, setFacultyName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [departmentId, setDepartmentId] = useState<number | ''>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch departments for dropdown
  const { data: deptData, isLoading: isDeptsLoading } = useQuery({
    queryKey: ['admin', 'departments', 'dropdown'],
    queryFn: () => adminApi.getDepartments({ limit: 100 }),
    enabled: isOpen,
  })

  useEffect(() => {
    if (faculty) {
      setFacultyName(faculty.faculty_name)
      setUsername(faculty.username)
      setEmail(faculty.email)
      setDepartmentId(faculty.department_id)
    } else {
      setFacultyName('')
      setUsername('')
      setEmail('')
      setDepartmentId('')
    }
    setErrorMessage(null)
  }, [faculty, isOpen])

  const createMutation = useMutation({
    mutationFn: (payload: FacultyCreateRequest) => adminApi.createFaculty(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'faculty'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      onSuccess?.()
      onClose()
    },
    onError: (err) => {
      setErrorMessage(getApiErrorMessage(err, 'Failed to create faculty member.'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; data: FacultyUpdateRequest }) =>
      adminApi.updateFaculty(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'faculty'] })
      onSuccess?.()
      onClose()
    },
    onError: (err) => {
      setErrorMessage(getApiErrorMessage(err, 'Failed to update faculty member.'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!facultyName.trim() || !username.trim() || !email.trim() || departmentId === '') {
      setErrorMessage('Please fill in all required fields.')
      return
    }

    if (isEdit && faculty) {
      updateMutation.mutate({
        id: faculty.faculty_id,
        data: {
          faculty_name: facultyName.trim(),
          username: username.trim(),
          email: email.trim(),
          department_id: Number(departmentId),
        },
      })
    } else {
      createMutation.mutate({
        faculty_name: facultyName.trim(),
        username: username.trim(),
        email: email.trim(),
        department_id: Number(departmentId),
      })
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const deptOptions = (deptData?.items || []).map((d) => ({
    value: d.department_id,
    label: `${d.department_name} (${d.department_code})`,
  }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Faculty Profile' : 'Register New Faculty'}
      description={
        isEdit
          ? `Updating details for faculty #${faculty?.faculty_id}`
          : 'Creates a faculty profile, department assignment, and linked active user account.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <ErrorMessage message={errorMessage} onDismiss={() => setErrorMessage(null)} />}

        <Input
          label="Faculty Full Name"
          value={facultyName}
          onChange={(e) => setFacultyName(e.target.value)}
          placeholder="e.g. Dr. Rajesh Sharma"
          required
          disabled={isSubmitting}
        />

        <Input
          label="Login Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. faculty1"
          required
          disabled={isSubmitting}
        />

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. rajesh.sharma@college.edu"
          required
          disabled={isSubmitting}
        />

        <Select
          label="Assigned Department"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
          options={deptOptions}
          placeholderOption={isDeptsLoading ? 'Loading departments...' : 'Select a department...'}
          required
          disabled={isSubmitting || isDeptsLoading}
        />

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Faculty'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default FacultyFormModal

