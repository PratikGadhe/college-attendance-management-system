import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  Plus,
  Eye,
  Edit2,
  School,
  Users,
} from 'lucide-react'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { DepartmentDetailResponse } from '../../../types/admin.types'
import {
  PageHeader,
  Button,
  Card,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
} from '../../../components/common'
import { Pagination, SearchFilterBar } from '../../../components/tables'
import DepartmentFormModal from './DepartmentFormModal'
import DepartmentDetailModal from './DepartmentDetailModal'

export const DepartmentListPage: React.FC = () => {
  const [search, setSearch] = useState('')
  const [skip, setSkip] = useState(0)
  const limit = 10

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDetailResponse | null>(null)
  const [viewDepartment, setViewDepartment] = useState<DepartmentDetailResponse | null>(null)

  // Fetch departments list
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'departments', { search, skip, limit }],
    queryFn: () =>
      adminApi.getDepartments({
        search: search.trim() || undefined,
        skip,
        limit,
      }),
  })

  const handleOpenCreate = () => {
    setSelectedDepartment(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEdit = (dept: DepartmentDetailResponse) => {
    setSelectedDepartment(dept)
    setIsFormModalOpen(true)
  }

  const departments = data?.items || []
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Departments"
        description="Configure academic departments, institutional codes, and review linked classes and faculty."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Department
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <SearchFilterBar
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val)
          setSkip(0)
        }}
        placeholder="Search departments by name or code..."
      />

      {/* Table Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" text="Loading departments..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorMessage
              title="Failed to load departments"
              message={getApiErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : departments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Building2 className="w-8 h-8" />}
              title="No Departments Found"
              description={
                search
                  ? 'No department matched your search query. Try adjusting your keywords.'
                  : 'No academic departments configured in the system yet.'
              }
              action={
                search
                  ? {
                      label: 'Clear Search',
                      onClick: () => {
                        setSearch('')
                        setSkip(0)
                      },
                      variant: 'outline',
                    }
                  : {
                      label: 'Create First Department',
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
                  <th className="px-4 py-3.5">Code</th>
                  <th className="px-4 py-3.5">Department Name</th>
                  <th className="px-4 py-3.5">Classes</th>
                  <th className="px-4 py-3.5">Faculty Members</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {departments.map((dept) => (
                  <tr key={dept.department_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                        {dept.department_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {dept.department_name}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="inline-flex items-center gap-1.5 font-medium">
                        <School className="w-3.5 h-3.5 text-slate-400" />
                        <span>{dept.total_classes} classes</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="inline-flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{dept.total_faculty} faculty</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewDepartment(dept)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(dept)}
                          title="Edit Department"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
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
      <DepartmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        department={selectedDepartment}
      />

      {/* Detail Modal */}
      <DepartmentDetailModal
        isOpen={!!viewDepartment}
        onClose={() => setViewDepartment(null)}
        department={viewDepartment}
      />
    </div>
  )
}

export default DepartmentListPage

