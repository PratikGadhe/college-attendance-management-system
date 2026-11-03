import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserPlus,
  Eye,
  Edit2,
  CheckCircle,
  XCircle,
  Users,
} from 'lucide-react'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { StudentDetailResponse } from '../../../types/admin.types'
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
import StudentFormModal from './StudentFormModal'
import StudentDetailModal from './StudentDetailModal'

export const StudentListPage: React.FC = () => {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [accountStatus, setAccountStatus] = useState<string>('')
  const [skip, setSkip] = useState(0)
  const limit = 10

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailResponse | null>(null)
  const [viewStudent, setViewStudent] = useState<StudentDetailResponse | null>(null)
  const [statusConfirmStudent, setStatusConfirmStudent] = useState<StudentDetailResponse | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'students', { search, account_status: accountStatus, skip, limit }],
    queryFn: () =>
      adminApi.getStudents({
        search: search.trim() || undefined,
        account_status: accountStatus || undefined,
        skip,
        limit,
      }),
  })

  // Status toggle mutation
  const statusMutation = useMutation({
    mutationFn: (payload: { id: number; status: 'ACTIVE' | 'INACTIVE' }) =>
      adminApi.updateStudentStatus(payload.id, { account_status: payload.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      setStatusConfirmStudent(null)
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, 'Failed to update student account status.'))
      setStatusConfirmStudent(null)
    },
  })

  const handleOpenCreate = () => {
    setSelectedStudent(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEdit = (student: StudentDetailResponse) => {
    setSelectedStudent(student)
    setIsFormModalOpen(true)
  }

  const handleToggleStatus = (student: StudentDetailResponse) => {
    setStatusConfirmStudent(student)
  }

  const handleConfirmStatusChange = () => {
    if (!statusConfirmStudent) return
    const nextStatus = statusConfirmStudent.account_status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    statusMutation.mutate({ id: statusConfirmStudent.student_id, status: nextStatus })
  }

  const students = data?.items || []
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profiles"
        description="Manage enrolled college students, roll assignments, and active user account credentials."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add Student
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
        placeholder="Search by name, roll, username or email..."
      >
        <div className="w-36 sm:w-44 shrink-0">
          <select
            value={accountStatus}
            onChange={(e) => {
              setAccountStatus(e.target.value)
              setSkip(0)
            }}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
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
            <LoadingSpinner size="lg" text="Loading student records..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorMessage
              title="Failed to load students"
              message={getApiErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : students.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="No Students Found"
              description={
                search || accountStatus
                  ? 'No students matched the active filter criteria. Try adjusting your search query.'
                  : 'No student profiles registered in the system yet.'
              }
              action={
                search || accountStatus
                  ? {
                      label: 'Clear Filters',
                      onClick: () => {
                        setSearch('')
                        setAccountStatus('')
                        setSkip(0)
                      },
                      variant: 'outline',
                    }
                  : {
                      label: 'Add First Student',
                      onClick: handleOpenCreate,
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
                  <th className="px-4 py-3.5">Username</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Account Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map((stu) => (
                  <tr key={stu.student_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {stu.roll_number}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{stu.student_name}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{stu.username}</td>
                    <td className="px-4 py-3 text-slate-600">{stu.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={stu.account_status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewStudent(stu)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(stu)}
                          title="Edit Student"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(stu)}
                          title={
                            stu.account_status === 'ACTIVE'
                              ? 'Deactivate Account'
                              : 'Activate Account'
                          }
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            stu.account_status === 'ACTIVE'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {stu.account_status === 'ACTIVE' ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
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

      {/* Form Modal (Create / Edit) */}
      <StudentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        student={selectedStudent}
      />

      {/* Detail Modal */}
      <StudentDetailModal
        isOpen={!!viewStudent}
        onClose={() => setViewStudent(null)}
        student={viewStudent}
      />

      {/* Status Toggle Confirmation */}
      <ConfirmDialog
        isOpen={!!statusConfirmStudent}
        title={
          statusConfirmStudent?.account_status === 'ACTIVE'
            ? 'Deactivate Student Account'
            : 'Activate Student Account'
        }
        message={
          statusConfirmStudent?.account_status === 'ACTIVE'
            ? `Are you sure you want to deactivate ${statusConfirmStudent?.student_name} (${statusConfirmStudent?.roll_number})? Inactive accounts cannot log in.`
            : `Are you sure you want to activate ${statusConfirmStudent?.student_name} (${statusConfirmStudent?.roll_number})?`
        }
        confirmText={
          statusConfirmStudent?.account_status === 'ACTIVE' ? 'Deactivate' : 'Activate'
        }
        variant={statusConfirmStudent?.account_status === 'ACTIVE' ? 'destructive' : 'primary'}
        isLoading={statusMutation.isPending}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setStatusConfirmStudent(null)}
      />
    </div>
  )
}

export default StudentListPage

