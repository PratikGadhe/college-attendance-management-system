import React, { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { ClassDetailResponse, ClassCreateRequest, ClassUpdateRequest } from '../../../types/admin.types'
import { Modal, Input, Select, Button, ErrorMessage } from '../../../components/common'

export interface ClassFormModalProps {
  isOpen: boolean
  onClose: () => void
  classItem?: ClassDetailResponse | null
  onSuccess?: () => void
}

export const ClassFormModal: React.FC<ClassFormModalProps> = ({
  isOpen,
  onClose,
  classItem,
  onSuccess,
}) => {
  const queryClient = useQueryClient()
  const isEdit = !!classItem

  const [departmentId, setDepartmentId] = useState<number | ''>('')
  const [className, setClassName] = useState('')
  const [academicYear, setAcademicYear] = useState('2026-27')
  const [division, setDivision] = useState('A')
  const [semester, setSemester] = useState<number>(3)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch departments for dropdown
  const { data: deptData, isLoading: isDeptsLoading } = useQuery({
    queryKey: ['admin', 'departments', 'dropdown'],
    queryFn: () => adminApi.getDepartments({ limit: 100 }),
    enabled: isOpen,
  })

  useEffect(() => {
    if (classItem) {
      setDepartmentId(classItem.department_id)
      setClassName(classItem.class_name)
      setAcademicYear(classItem.academic_year)
      setDivision(classItem.division)
      setSemester(classItem.semester)
    } else {
      setDepartmentId('')
      setClassName('')
      setAcademicYear('2026-27')
      setDivision('A')
      setSemester(3)
    }
    setErrorMessage(null)
  }, [classItem, isOpen])

  const createMutation = useMutation({
    mutationFn: (payload: ClassCreateRequest) => adminApi.createClass(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'classes'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      onSuccess?.()
      onClose()
    },
    onError: (err) => {
      setErrorMessage(getApiErrorMessage(err, 'Failed to create academic class.'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; data: ClassUpdateRequest }) =>
      adminApi.updateClass(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'classes'] })
      onSuccess?.()
      onClose()
    },
    onError: (err) => {
      setErrorMessage(getApiErrorMessage(err, 'Failed to update academic class.'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (departmentId === '' || !className.trim() || !academicYear.trim() || !division.trim()) {
      setErrorMessage('Please fill in all required fields.')
      return
    }

    if (semester < 1 || semester > 8) {
      setErrorMessage('Semester must be between 1 and 8.')
      return
    }

    if (isEdit && classItem) {
      updateMutation.mutate({
        id: classItem.class_id,
        data: {
          department_id: Number(departmentId),
          class_name: className.trim(),
          academic_year: academicYear.trim(),
          division: division.trim().toUpperCase(),
          semester: Number(semester),
        },
      })
    } else {
      createMutation.mutate({
        department_id: Number(departmentId),
        class_name: className.trim(),
        academic_year: academicYear.trim(),
        division: division.trim().toUpperCase(),
        semester: Number(semester),
      })
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const deptOptions = (deptData?.items || []).map((d) => ({
    value: d.department_id,
    label: `${d.department_name} (${d.department_code})`,
  }))

  const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
    value: s,
    label: `Semester ${s}`,
  }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Academic Class' : 'Create Academic Class'}
      description={
        isEdit
          ? `Updating details for class #${classItem?.class_id}`
          : 'Creates a new academic class section for student enrollment and attendance.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <ErrorMessage message={errorMessage} onDismiss={() => setErrorMessage(null)} />}

        <Select
          label="Department"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
          options={deptOptions}
          placeholderOption={isDeptsLoading ? 'Loading departments...' : 'Select department...'}
          required
          disabled={isSubmitting || isDeptsLoading}
        />

        <Input
          label="Class Name"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          placeholder="e.g. SY Computer Engineering"
          required
          disabled={isSubmitting}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Academic Year"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="e.g. 2026-27"
            required
            disabled={isSubmitting}
          />

          <Input
            label="Division / Section"
            value={division}
            onChange={(e) => setDivision(e.target.value.toUpperCase())}
            placeholder="e.g. A"
            required
            disabled={isSubmitting}
          />
        </div>

        <Select
          label="Semester (1-8)"
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
            {isEdit ? 'Save Changes' : 'Create Class'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ClassFormModal

