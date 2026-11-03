import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BookMarked,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { TeachingAssignmentDetailResponse } from '../../../types/admin.types'
import {
  PageHeader,
  Button,
  Card,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  ConfirmDialog,
} from '../../../components/common'
import { Pagination, SearchFilterBar } from '../../../components/tables'
import TeachingAssignmentFormModal from './TeachingAssignmentFormModal'

export const TeachingAssignmentListPage: React.FC = () => {
  const queryClient = useQueryClient()

  const [facultyId, setFacultyId] = useState<number | ''>('')
  const [classId, setClassId] = useState<number | ''>('')
  const [subjectId, setSubjectId] = useState<number | ''>('')
  const [skip, setSkip] = useState(0)
  const limit = 10

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] =
    useState<TeachingAssignmentDetailResponse | null>(null)
  const [deleteAssignment, setDeleteAssignment] =
    useState<TeachingAssignmentDetailResponse | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Fetch dropdown options for filters
  const { data: facultyData } = useQuery({
    queryKey: ['admin', 'faculty', 'dropdown'],
    queryFn: () => adminApi.getFaculty({ limit: 100 }),
  })

  const { data: classesData } = useQuery({
    queryKey: ['admin', 'classes', 'dropdown'],
    queryFn: () => adminApi.getClasses({ limit: 100 }),
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['admin', 'subjects', 'dropdown'],
    queryFn: () => adminApi.getSubjects({ limit: 100 }),
  })

  // Fetch teaching assignments
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'admin',
      'teaching-assignments',
      { faculty_id: facultyId, class_id: classId, subject_id: subjectId, skip, limit },
    ],
    queryFn: () =>
      adminApi.getTeachingAssignments({
        faculty_id: facultyId !== '' ? Number(facultyId) : undefined,
        class_id: classId !== '' ? Number(classId) : undefined,
        subject_id: subjectId !== '' ? Number(subjectId) : undefined,
        skip,
        limit,
      }),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (assignmentId: number) => adminApi.deleteTeachingAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teaching-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      setDeleteAssignment(null)
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, 'Failed to delete teaching assignment.'))
      setDeleteAssignment(null)
    },
  })

  const handleOpenCreate = () => {
    setSelectedAssignment(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEdit = (assignment: TeachingAssignmentDetailResponse) => {
    setSelectedAssignment(assignment)
    setIsFormModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!deleteAssignment) return
    deleteMutation.mutate(deleteAssignment.assignment_id)
  }

  const assignments = data?.items || []
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Teaching Assignments"
        description="Assign faculty professors to curriculum courses and academic class divisions."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Assign Course
          </Button>
        }
      />

      {actionError && (
        <ErrorMessage message={actionError} onDismiss={() => setActionError(null)} className="mb-4" />
      )}

      {/* Filter Bar */}
      <SearchFilterBar
        searchQuery=""
        onSearchChange={() => {}}
        placeholder="Filter assignments by criteria..."
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Faculty Filter */}
          <select
            value={facultyId}
            onChange={(e) => {
              setFacultyId(e.target.value ? Number(e.target.value) : '')
              setSkip(0)
            }}
            className="w-36 sm:w-44 py-2 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Faculty</option>
            {(facultyData?.items || []).map((f) => (
              <option key={f.faculty_id} value={f.faculty_id}>
                {f.faculty_name}
              </option>
            ))}
          </select>

          {/* Subject Filter */}
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value ? Number(e.target.value) : '')
              setSkip(0)
            }}
            className="w-32 sm:w-36 py-2 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Subjects</option>
            {(subjectsData?.items || []).map((s) => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.subject_code}
              </option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value ? Number(e.target.value) : '')
              setSkip(0)
            }}
            className="w-36 sm:w-44 py-2 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Classes</option>
            {(classesData?.items || []).map((c) => (
              <option key={c.class_id} value={c.class_id}>
                {c.class_name} ({c.division})
              </option>
            ))}
          </select>
        </div>
      </SearchFilterBar>

      {/* Table Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" text="Loading teaching assignments..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorMessage
              title="Failed to load teaching assignments"
              message={getApiErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<BookMarked className="w-8 h-8" />}
              title="No Teaching Assignments Found"
              description={
                facultyId || subjectId || classId
                  ? 'No teaching assignment matched your active filters.'
                  : 'No faculty teaching assignments configured in the system yet.'
              }
              action={
                facultyId || subjectId || classId
                  ? {
                      label: 'Clear Filters',
                      onClick: () => {
                        setFacultyId('')
                        setSubjectId('')
                        setClassId('')
                        setSkip(0)
                      },
                      variant: 'outline',
                    }
                  : {
                      label: 'Create First Assignment',
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
                  <th className="px-4 py-3.5">Assigned Faculty</th>
                  <th className="px-4 py-3.5">Subject Course</th>
                  <th className="px-4 py-3.5">Target Class</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {assignments.map((ta) => (
                  <tr key={ta.assignment_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{ta.faculty_name}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-indigo-700 block">{ta.subject_name}</span>
                      <span className="text-[11px] font-mono text-slate-400">({ta.subject_code})</span>
                    </td>
                    <td className="px-4 py-3 text-slate-800">
                      <span className="font-semibold block">{ta.class_name}</span>
                      <span className="text-[11px] text-slate-500">
                        Div {ta.division} • {ta.academic_year}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{ta.department_name}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ta)}
                          title="Edit Assignment"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteAssignment(ta)}
                          title="Remove Assignment"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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
      <TeachingAssignmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        assignment={selectedAssignment}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteAssignment}
        title="Remove Teaching Assignment"
        message={`Are you sure you want to remove ${deleteAssignment?.faculty_name}'s assignment for ${deleteAssignment?.subject_name} (${deleteAssignment?.class_name})? If lectures have already been recorded for this course, deletion will be rejected.`}
        confirmText="Remove Assignment"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteAssignment(null)}
      />
    </div>
  )
}

export default TeachingAssignmentListPage

