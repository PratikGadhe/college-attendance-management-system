import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  School,
  Plus,
  Eye,
  Edit2,
  Users,
} from 'lucide-react'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { ClassDetailResponse } from '../../../types/admin.types'
import {
  PageHeader,
  Button,
  Card,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
} from '../../../components/common'
import { Pagination, SearchFilterBar } from '../../../components/tables'
import ClassFormModal from './ClassFormModal'
import ClassDetailModal from './ClassDetailModal'

export const ClassListPage: React.FC = () => {
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState<number | ''>('')
  const [semester, setSemester] = useState<number | ''>('')
  const [skip, setSkip] = useState(0)
  const limit = 10

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassDetailResponse | null>(null)
  const [viewClass, setViewClass] = useState<ClassDetailResponse | null>(null)

  // Fetch departments for filter dropdown
  const { data: deptData } = useQuery({
    queryKey: ['admin', 'departments', 'dropdown'],
    queryFn: () => adminApi.getDepartments({ limit: 100 }),
  })

  // Fetch classes
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'classes', { search, department_id: departmentId, semester, skip, limit }],
    queryFn: () =>
      adminApi.getClasses({
        search: search.trim() || undefined,
        department_id: departmentId !== '' ? Number(departmentId) : undefined,
        semester: semester !== '' ? Number(semester) : undefined,
        skip,
        limit,
      }),
  })

  const handleOpenCreate = () => {
    setSelectedClass(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEdit = (cls: ClassDetailResponse) => {
    setSelectedClass(cls)
    setIsFormModalOpen(true)
  }

  const classes = data?.items || []
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Classes"
        description="Configure class batches, academic divisions, semester associations, and monitor enrolled student rosters."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Class
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
        placeholder="Search classes by name, year, or division..."
      >
        <div className="flex items-center gap-2">
          {/* Department Filter */}
          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value ? Number(e.target.value) : '')
              setSkip(0)
            }}
            className="w-36 sm:w-44 py-2 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Departments</option>
            {(deptData?.items || []).map((d) => (
              <option key={d.department_id} value={d.department_id}>
                {d.department_name} ({d.department_code})
              </option>
            ))}
          </select>

          {/* Semester Filter */}
          <select
            value={semester}
            onChange={(e) => {
              setSemester(e.target.value ? Number(e.target.value) : '')
              setSkip(0)
            }}
            className="w-28 sm:w-32 py-2 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Sem {s}
              </option>
            ))}
          </select>
        </div>
      </SearchFilterBar>

      {/* Table Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" text="Loading classes..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorMessage
              title="Failed to load classes"
              message={getApiErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : classes.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<School className="w-8 h-8" />}
              title="No Classes Found"
              description={
                search || departmentId || semester
                  ? 'No class matched the active filter criteria. Try adjusting your filters.'
                  : 'No academic classes configured in the system yet.'
              }
              action={
                search || departmentId || semester
                  ? {
                      label: 'Clear Filters',
                      onClick: () => {
                        setSearch('')
                        setDepartmentId('')
                        setSemester('')
                        setSkip(0)
                      },
                      variant: 'outline',
                    }
                  : {
                      label: 'Create First Class',
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
                  <th className="px-4 py-3.5">Class Name</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Academic Year</th>
                  <th className="px-4 py-3.5">Div / Sem</th>
                  <th className="px-4 py-3.5">Enrolled Students</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {classes.map((cls) => (
                  <tr key={cls.class_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{cls.class_name}</td>
                    <td className="px-4 py-3 text-slate-700">{cls.department_name}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{cls.academic_year}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800">
                        Div {cls.division} • Sem {cls.semester}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1.5 font-bold text-indigo-700">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{cls.total_enrolled_students}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewClass(cls)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cls)}
                          title="Edit Class"
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
      <ClassFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        classItem={selectedClass}
      />

      {/* Detail Modal */}
      <ClassDetailModal
        isOpen={!!viewClass}
        onClose={() => setViewClass(null)}
        classItem={viewClass}
      />
    </div>
  )
}

export default ClassListPage

