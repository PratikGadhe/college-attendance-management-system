import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserPlus,
  Eye,
  Edit2,
  CheckCircle,
  XCircle,
  Briefcase,
} from 'lucide-react'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { FacultyDetailResponse } from '../../../types/admin.types'
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
import FacultyFormModal from './FacultyFormModal'
import FacultyDetailModal from './FacultyDetailModal'

export const FacultyListPage: React.FC = () => {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [accountStatus, setAccountStatus] = useState<string>('')
  const [departmentId, setDepartmentId] = useState<number | ''>('')
  const [skip, setSkip] = useState(0)
  const limit = 10

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyDetailResponse | null>(null)
  const [viewFaculty, setViewFaculty] = useState<FacultyDetailResponse | null>(null)
  const [statusConfirmFaculty, setStatusConfirmFaculty] = useState<FacultyDetailResponse | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Fetch departments for filter dropdown
  const { data: deptData } = useQuery({
    queryKey: ['admin', 'departments', 'dropdown'],
    queryFn: () => adminApi.getDepartments({ limit: 100 }),
  })

  // Fetch faculty list
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'admin',
      'faculty',
      { search, account_status: accountStatus, department_id: departmentId, skip, limit },
    ],
    queryFn: () =>
      adminApi.getFaculty({
        search: search.trim() || undefined,
        account_status: accountStatus || undefined,
        department_id: departmentId !== '' ? Number(departmentId) : undefined,
        skip,
        limit,
      }),
  })

  // Status toggle mutation
  const statusMutation = useMutation({
    mutationFn: (payload: { id: number; status: 'ACTIVE' | 'INACTIVE' }) =>
      adminApi.updateFacultyStatus(payload.id, { account_status: payload.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'faculty'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      setStatusConfirmFaculty(null)
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, 'Failed to update faculty account status.'))
      setStatusConfirmFaculty(null)
    },
  })

  const handleOpenCreate = () => {
    setSelectedFaculty(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEdit = (faculty: FacultyDetailResponse) => {
    setSelectedFaculty(faculty)
    setIsFormModalOpen(true)
  }

  const handleToggleStatus = (faculty: FacultyDetailResponse) => {
    setStatusConfirmFaculty(faculty)
  }

  const handleConfirmStatusChange = () => {
    if (!statusConfirmFaculty) return
    const nextStatus = statusConfirmFaculty.account_status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    statusMutation.mutate({ id: statusConfirmFaculty.faculty_id, status: nextStatus })
  }

  const facultyMembers = data?.items || []
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Members"
        description="Manage academic professors, department assignments, and faculty login accounts."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add Faculty
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
        placeholder="Search by name, username, email or department..."
      >
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={accountStatus}
            onChange={(e) => {
              setAccountStatus(e.target.value)
              setSkip(0)
            }}
            className="w-32 sm:w-36 py-2 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value ? Number(e.target.value) : '')
              setSkip(0)
            }}
            className="w-40 sm:w-48 py-2 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Departments</option>
            {(deptData?.items || []).map((d) => (
              <option key={d.department_id} value={d.department_id}>
                {d.department_name} ({d.department_code})
              </option>
            ))}
          </select>
        </div>
      </SearchFilterBar>

      {/* Table Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" text="Loading faculty members..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorMessage
              title="Failed to load faculty"
              message={getApiErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : facultyMembers.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Briefcase className="w-8 h-8" />}
              title="No Faculty Members Found"
              description={
                search || accountStatus || departmentId
                  ? 'No faculty matched the active filter criteria. Try adjusting your search query.'
                  : 'No faculty profiles registered in the system yet.'
              }
              action={
                search || accountStatus || departmentId
                  ? {
                      label: 'Clear Filters',
                      onClick: () => {
                        setSearch('')
                        setAccountStatus('')
                        setDepartmentId('')
                        setSkip(0)
                      },
                      variant: 'outline',
                    }
                  : {
                      label: 'Add First Faculty',
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
                  <th className="px-4 py-3.5">Faculty Name</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Username</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Account Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {facultyMembers.map((fac) => (
                  <tr key={fac.faculty_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{fac.faculty_name}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="font-medium text-slate-800">{fac.department_name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{fac.username}</td>
                    <td className="px-4 py-3 text-slate-600">{fac.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={fac.account_status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewFaculty(fac)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(fac)}
                          title="Edit Faculty"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(fac)}
                          title={
                            fac.account_status === 'ACTIVE'
                              ? 'Deactivate Account'
                              : 'Activate Account'
                          }
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            fac.account_status === 'ACTIVE'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {fac.account_status === 'ACTIVE' ? (
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
      <FacultyFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        faculty={selectedFaculty}
      />

      {/* Detail Modal */}
      <FacultyDetailModal
        isOpen={!!viewFaculty}
        onClose={() => setViewFaculty(null)}
        faculty={viewFaculty}
      />

      {/* Status Toggle Confirmation */}
      <ConfirmDialog
        isOpen={!!statusConfirmFaculty}
        title={
          statusConfirmFaculty?.account_status === 'ACTIVE'
            ? 'Deactivate Faculty Account'
            : 'Activate Faculty Account'
        }
        message={
          statusConfirmFaculty?.account_status === 'ACTIVE'
            ? `Are you sure you want to deactivate ${statusConfirmFaculty?.faculty_name}? Inactive accounts cannot log in.`
            : `Are you sure you want to activate ${statusConfirmFaculty?.faculty_name}?`
        }
        confirmText={
          statusConfirmFaculty?.account_status === 'ACTIVE' ? 'Deactivate' : 'Activate'
        }
        variant={statusConfirmFaculty?.account_status === 'ACTIVE' ? 'destructive' : 'primary'}
        isLoading={statusMutation.isPending}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setStatusConfirmFaculty(null)}
      />
    </div>
  )
}

export default FacultyListPage

