import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserPlus,
  CheckCircle,
  XCircle,
  School,
} from 'lucide-react'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { EnrollmentDetailResponse } from '../../../types/admin.types'
import {
  PageHeader,
  Button,
  StatusBadge,
  Card,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  ConfirmDialog,
} from '../../../components/common'
import { Pagination, SearchFilterBar } from '../../../components/tables'
import EnrollmentFormModal from './EnrollmentFormModal'

export const EnrollmentListPage: React.FC = () => {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [classId, setClassId] = useState<number | ''>('')
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>('')
  const [skip, setSkip] = useState(0)
  const limit = 10

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [statusConfirmEnrollment, setStatusConfirmEnrollment] =
    useState<EnrollmentDetailResponse | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Fetch classes for filter dropdown
  const { data: classData } = useQuery({
    queryKey: ['admin', 'classes', 'dropdown'],
    queryFn: () => adminApi.getClasses({ limit: 100 }),
  })

  // Fetch enrollments
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'admin',
      'enrollments',
      { search, class_id: classId, enrollment_status: enrollmentStatus, skip, limit },
    ],
    queryFn: () =>
      adminApi.getEnrollments({
        search: search.trim() || undefined,
        class_id: classId !== '' ? Number(classId) : undefined,
        enrollment_status: enrollmentStatus || undefined,
        skip,
        limit,
      }),
  })

  // Status toggle mutation
  const statusMutation = useMutation({
    mutationFn: (payload: { id: number; status: 'ACTIVE' | 'INACTIVE' }) =>
      adminApi.updateEnrollmentStatus(payload.id, { enrollment_status: payload.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'classes'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      setStatusConfirmEnrollment(null)
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, 'Failed to update enrollment status.'))
      setStatusConfirmEnrollment(null)
    },
  })

  const handleToggleStatus = (enrollment: EnrollmentDetailResponse) => {
    setStatusConfirmEnrollment(enrollment)
  }

  const handleConfirmStatusChange = () => {
    if (!statusConfirmEnrollment) return
    const nextStatus =
      statusConfirmEnrollment.enrollment_status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    statusMutation.mutate({
      id: statusConfirmEnrollment.enrollment_id,
      status: nextStatus,
    })
  }

  const enrollments = data?.items || []
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Class Enrollments"
        description="Manage active student class memberships, enrollment dates, and roster statuses."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsFormModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            New Enrollment
          </Button>
        }
      />

      {actionError && (
        <ErrorMessage message={actionError} onDismiss={() => setActionError(null)} className="mb-4" />
      )}

      {/* Filter and Search Bar */}
      <SearchFilterBar
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val)
          setSkip(0)
        }}
        placeholder="Search by student name or roll number..."
      >
        <div className="flex items-center gap-2">
          {/* Class Filter */}
          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value ? Number(e.target.value) : '')
              setSkip(0)
            }}
            className="w-40 sm:w-48 py-2 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Classes</option>
            {(classData?.items || []).map((c) => (
              <option key={c.class_id} value={c.class_id}>
                {c.class_name} ({c.division})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={enrollmentStatus}
            onChange={(e) => {
              setEnrollmentStatus(e.target.value)
              setSkip(0)
            }}
            className="w-32 sm:w-36 py-2 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </SearchFilterBar>

      {/* Table Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" text="Loading enrollments..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorMessage
              title="Failed to load enrollments"
              message={getApiErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : enrollments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<School className="w-8 h-8" />}
              title="No Enrollments Found"
              description={
                search || classId || enrollmentStatus
                  ? 'No enrollment records matched your active filters.'
                  : 'No students enrolled in any classes yet.'
              }
              action={
                search || classId || enrollmentStatus
                  ? {
                      label: 'Clear Filters',
                      onClick: () => {
                        setSearch('')
                        setClassId('')
                        setEnrollmentStatus('')
                        setSkip(0)
                      },
                      variant: 'outline',
                    }
                  : {
                      label: 'Create First Enrollment',
                      onClick: () => setIsFormModalOpen(true),
                      variant: 'primary',
                    }
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Roll Number</th>
                  <th className="px-4 py-3.5">Student Name</th>
                  <th className="px-4 py-3.5">Enrolled Class</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Enrollment Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {enrollments.map((enr) => (
                  <tr key={enr.enrollment_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {enr.roll_number}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{enr.student_name}</td>
                    <td className="px-4 py-3 text-slate-800">
                      <span className="font-semibold block">{enr.class_name}</span>
                      <span className="text-[11px] text-slate-500">
                        Div {enr.division} • {enr.academic_year}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{enr.department_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {enr.enrollment_date}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={enr.enrollment_status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(enr)}
                        title={
                          enr.enrollment_status === 'ACTIVE'
                            ? 'Deactivate Enrollment'
                            : 'Activate Enrollment'
                        }
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          enr.enrollment_status === 'ACTIVE'
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {enr.enrollment_status === 'ACTIVE' ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-3">
          <Pagination
            total={total}
            skip={skip}
            limit={limit}
            onPageChange={(newSkip) => setSkip(newSkip)}
          />
        </div>
      </Card>

      {/* Form Modal */}
      <EnrollmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
      />

      {/* Status Toggle Confirmation */}
      <ConfirmDialog
        isOpen={!!statusConfirmEnrollment}
        title={
          statusConfirmEnrollment?.enrollment_status === 'ACTIVE'
            ? 'Deactivate Class Enrollment'
            : 'Activate Class Enrollment'
        }
        message={
          statusConfirmEnrollment?.enrollment_status === 'ACTIVE'
            ? `Are you sure you want to deactivate ${statusConfirmEnrollment?.student_name}'s enrollment in ${statusConfirmEnrollment?.class_name}? Inactive students will not appear on lecture attendance rosters.`
            : `Are you sure you want to activate ${statusConfirmEnrollment?.student_name}'s enrollment in ${statusConfirmEnrollment?.class_name}?`
        }
        confirmText={
          statusConfirmEnrollment?.enrollment_status === 'ACTIVE' ? 'Deactivate' : 'Activate'
        }
        variant={
          statusConfirmEnrollment?.enrollment_status === 'ACTIVE' ? 'destructive' : 'primary'
        }
        isLoading={statusMutation.isPending}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setStatusConfirmEnrollment(null)}
      />
    </div>
  )
}

export default EnrollmentListPage

