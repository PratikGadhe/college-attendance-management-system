import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  Plus,
  Eye,
  Edit2,
} from 'lucide-react'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { SubjectDetailResponse } from '../../../types/admin.types'
import {
  PageHeader,
  Button,
  Card,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
} from '../../../components/common'
import { Pagination, SearchFilterBar } from '../../../components/tables'
import SubjectFormModal from './SubjectFormModal'
import SubjectDetailModal from './SubjectDetailModal'

export const SubjectListPage: React.FC = () => {
  const [search, setSearch] = useState('')
  const [semester, setSemester] = useState<number | ''>('')
  const [skip, setSkip] = useState(0)
  const limit = 10

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<SubjectDetailResponse | null>(null)
  const [viewSubject, setViewSubject] = useState<SubjectDetailResponse | null>(null)

  // Fetch subjects
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'subjects', { search, semester, skip, limit }],
    queryFn: () =>
      adminApi.getSubjects({
        search: search.trim() || undefined,
        semester: semester !== '' ? Number(semester) : undefined,
        skip,
        limit,
      }),
  })

  const handleOpenCreate = () => {
    setSelectedSubject(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEdit = (subject: SubjectDetailResponse) => {
    setSelectedSubject(subject)
    setIsFormModalOpen(true)
  }

  const subjects = data?.items || []
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Curriculum Subjects"
        description="Manage academic course subjects, semester allocations, and course syllabus codes."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Subject
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
        placeholder="Search subjects by code or full name..."
      >
        <div className="w-36 sm:w-44 shrink-0">
          <select
            value={semester}
            onChange={(e) => {
              setSemester(e.target.value ? Number(e.target.value) : '')
              setSkip(0)
            }}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>
      </SearchFilterBar>

      {/* Table Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" text="Loading subjects..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorMessage
              title="Failed to load subjects"
              message={getApiErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : subjects.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<BookOpen className="w-8 h-8" />}
              title="No Subjects Found"
              description={
                search || semester
                  ? 'No subject matched the active filter criteria. Try adjusting your search query.'
                  : 'No curriculum subjects registered in the system yet.'
              }
              action={
                search || semester
                  ? {
                      label: 'Clear Filters',
                      onClick: () => {
                        setSearch('')
                        setSemester('')
                        setSkip(0)
                      },
                      variant: 'outline',
                    }
                  : {
                      label: 'Create First Subject',
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
                  <th className="px-4 py-3.5">Subject Code</th>
                  <th className="px-4 py-3.5">Subject Full Name</th>
                  <th className="px-4 py-3.5">Academic Semester</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {subjects.map((sub) => (
                  <tr key={sub.subject_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                        {sub.subject_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{sub.subject_name}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">Semester {sub.semester}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewSubject(sub)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(sub)}
                          title="Edit Subject"
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
      <SubjectFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        subject={selectedSubject}
      />

      {/* Detail Modal */}
      <SubjectDetailModal
        isOpen={!!viewSubject}
        onClose={() => setViewSubject(null)}
        subject={viewSubject}
      />
    </div>
  )
}

export default SubjectListPage

