import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { DepartmentDetailResponse, DepartmentCreateRequest, DepartmentUpdateRequest } from '../../../types/admin.types'
import { Modal, Input, Button, ErrorMessage } from '../../../components/common'

export interface DepartmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  department?: DepartmentDetailResponse | null
  onSuccess?: () => void
}

export const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({
  isOpen,
  onClose,
  department,
  onSuccess,
}) => {
  const queryClient = useQueryClient()
  const isEdit = !!department

  const [departmentName, setDepartmentName] = useState('')
  const [departmentCode, setDepartmentCode] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (department) {
      setDepartmentName(department.department_name)
      setDepartmentCode(department.department_code)
    } else {
      setDepartmentName('')
      setDepartmentCode('')
    }
    setErrorMessage(null)
  }, [department, isOpen])

  const createMutation = useMutation({
    mutationFn: (payload: DepartmentCreateRequest) => adminApi.createDepartment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      onSuccess?.()
      onClose()
    },
    onError: (err) => {
      setErrorMessage(getApiErrorMessage(err, 'Failed to create department.'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; data: DepartmentUpdateRequest }) =>
      adminApi.updateDepartment(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] })
      onSuccess?.()
      onClose()
    },
    onError: (err) => {
      setErrorMessage(getApiErrorMessage(err, 'Failed to update department.'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!departmentName.trim() || !departmentCode.trim()) {
      setErrorMessage('Please fill in both department name and department code.')
      return
    }

    if (isEdit && department) {
      updateMutation.mutate({
        id: department.department_id,
        data: {
          department_name: departmentName.trim(),
          department_code: departmentCode.trim().toUpperCase(),
        },
      })
    } else {
      createMutation.mutate({
        department_name: departmentName.trim(),
        department_code: departmentCode.trim().toUpperCase(),
      })
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Department' : 'Create Academic Department'}
      description={
        isEdit
          ? `Updating department code ${department?.department_code}`
          : 'Creates a new academic department for organizing classes and faculty.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <ErrorMessage message={errorMessage} onDismiss={() => setErrorMessage(null)} />}

        <Input
          label="Department Name"
          value={departmentName}
          onChange={(e) => setDepartmentName(e.target.value)}
          placeholder="e.g. Computer Engineering"
          required
          disabled={isSubmitting}
        />

        <Input
          label="Department Code"
          value={departmentCode}
          onChange={(e) => setDepartmentCode(e.target.value.toUpperCase())}
          placeholder="e.g. COMP"
          helperText="Unique uppercase identifier (max 20 characters)"
          required
          disabled={isSubmitting}
        />

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Department'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default DepartmentFormModal

