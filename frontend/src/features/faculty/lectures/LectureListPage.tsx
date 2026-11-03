import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  PlusCircle,
  Eye,
  Edit2,
  CheckSquare,
  Ban,
} from 'lucide-react'
import facultyApi from '../../../api/faculty.api'
import { getApiErrorMessage } from '../../../api/axios'
import type {
  FacultyLectureListItem,
  FacultyTeachingAssignmentResponse,
} from '../../../types/faculty.types'
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
import { Pagination } from '../../../components/tables/Pagination'
import LectureFormModal from './LectureFormModal'
import LectureDetailModal from './LectureDetailModal'

export const LectureListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  // Filter states
  const assignmentParam = searchParams.get('assignment_id')
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | ''>(
    assignmentParam ? Number(assignmentParam) : ''
  )
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [skip, setSkip] = useState(0)
  const limit = 10

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingLecture, setEditingLecture] = useState<FacultyLectureListItem | null>(null)
  const [viewLectureId, setViewLectureId] = useState<number | null>(null)
  const [cancelLectureItem, setCancelLectureItem] = useState<FacultyLectureListItem | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Fetch teaching assignments for filter dropdown and create modal
  const { data: assignmentsData } = useQuery({
    queryKey: ['faculty', 'teaching-assignments'],
    queryFn: () => facultyApi.getTeachingAssignments(),
  })
  const assignments: FacultyTeachingAssignmentResponse[] = assignmentsData?.items || []

  // Check URL params for action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsFormModalOpen(true)
      // Clean up param
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('action')
      setSearchParams(nextParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Lectures Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'faculty',
      'lectures',
      {
        assignment_id: selectedAssignmentId || undefined,
        status: statusFilter || undefined,
        lecture_date: dateFilter || undefined,
        skip,
        limit,
      },
    ],
    queryFn: () =>
      facultyApi.getLectures({
        assignment_id: selectedAssignmentId ? Number(selectedAssignmentId) : undefined,
        status: statusFilter || undefined,
        lecture_date: dateFilter || undefined,
        skip,
        limit,
      }),
  })

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (lectureId: number) => facultyApi.cancelLecture(lectureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty', 'lectures'] })
      queryClient.invalidateQueries({ queryKey: ['faculty', 'dashboard'] })
      setCancelLectureItem(null)
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, 'Failed to cancel lecture session.'))
      setCancelLectureItem(null)
    },
  })

  const lectures = data?.items || []
  const total = data?.total || 0

  const handleOpenCreate = () => {
    setEditingLecture(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEdit = (lec: FacultyLectureListItem) => {
    setEditingLecture(lec)
    setIsFormModalOpen(true)
  }

  const handleClearFilters = () => {
    setSelectedAssignmentId('')
    setStatusFilter('')
    setDateFilter('')
    setSkip(0)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lecture Management"
        description="Schedule course sessions, manage class time slots, and initiate attendance recording."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            <CalendarDays className="w-3.5 h-3.5" />
            {total} SESSIONS
          </span>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Schedule Lecture
          </Button>
        }
      />

      {actionError && (
        <ErrorMessage message={actionError} onDismiss={() => setActionError(null)} className="mb-4" />
      )}

      {/* Filter Bar */}
      <Card noPadding className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Assignment Dropdown */}
          <div className="w-full md:w-64">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Course / Class
            </label>
            <select
              value={selectedAssignmentId}
              onChange={(e) => {
                setSelectedAssignmentId(e.target.value ? Number(e.target.value) : '')
                setSkip(0)
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            >
              <option value="">All Courses & Classes</option>
              {assignments.map((a) => (
                <option key={a.assignment_id} value={a.assignment_id}>
                  {a.subject_code} • {a.class_name} ({a.division})
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="w-full md:w-44">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setSkip(0)
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Specific Date Filter */}
          <div className="w-full md:w-44">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Lecture Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value)
                setSkip(0)
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            />
          </div>

          {/* Clear Filters */}
          {(selectedAssignmentId !== '' || statusFilter !== '' || dateFilter !== '') && (
            <div className="w-full md:w-auto md:self-end">
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Table Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" text="Loading scheduled lectures..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorMessage
              title="Failed to load lectures"
              message={getApiErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : lectures.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<CalendarDays className="w-8 h-8" />}
              title="No Lectures Found"
              description={
                selectedAssignmentId || statusFilter || dateFilter
                  ? 'No lectures matched your active filter criteria. Try clearing or relaxing filters.'
                  : 'You have not scheduled any lectures yet. Click "Schedule Lecture" to begin.'
              }
              action={{
                label: selectedAssignmentId || statusFilter || dateFilter ? 'Clear Filters' : 'Schedule Lecture',
                onClick: selectedAssignmentId || statusFilter || dateFilter ? handleClearFilters : handleOpenCreate,
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Time Slot</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {lectures.map((lec) => (
                  <tr key={lec.lecture_id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Subject */}
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {lec.subject_code}
                        </span>
                        <span className="truncate max-w-[180px] sm:max-w-[240px]">
                          {lec.subject_name}
                        </span>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {lec.class_name} <span className="text-slate-400 font-normal">(Div {lec.division})</span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-900">
                      {lec.lecture_date}
                    </td>

                    {/* Time Slot */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      {lec.start_time.slice(0, 5)} - {lec.end_time.slice(0, 5)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={lec.lecture_status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Attendance Action */}
                        {lec.lecture_status === 'DRAFT' && (
                          <Link to={`/faculty/attendance?lecture_id=${lec.lecture_id}`}>
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<CheckSquare className="w-3.5 h-3.5" />}
                            >
                              Mark
                            </Button>
                          </Link>
                        )}
                        {lec.lecture_status === 'SUBMITTED' && (
                          <Link to={`/faculty/attendance?lecture_id=${lec.lecture_id}`}>
                            <Button variant="outline" size="sm">
                              Roster
                            </Button>
                          </Link>
                        )}

                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => setViewLectureId(lec.lecture_id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit (Draft only) */}
                        {lec.lecture_status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(lec)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="Edit Schedule"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Cancel (Draft only) */}
                        {lec.lecture_status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => setCancelLectureItem(lec)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Cancel Lecture"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > limit && (
          <div className="border-t border-slate-100">
            <Pagination
              skip={skip}
              limit={limit}
              total={total}
              onPageChange={(newSkip) => setSkip(newSkip)}
            />
          </div>
        )}
      </Card>

      {/* Form Modal (Create / Edit) */}
      <LectureFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setEditingLecture(null)
        }}
        lectureToEdit={editingLecture}
        assignments={assignments}
        preselectedAssignmentId={selectedAssignmentId ? Number(selectedAssignmentId) : null}
      />

      {/* Detail Modal */}
      <LectureDetailModal
        isOpen={viewLectureId !== null}
        onClose={() => setViewLectureId(null)}
        lectureId={viewLectureId}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={cancelLectureItem !== null}
        onCancel={() => setCancelLectureItem(null)}
        onConfirm={() => {
          if (cancelLectureItem) {
            cancelMutation.mutate(cancelLectureItem.lecture_id)
          }
        }}
        title="Cancel Lecture Session"
        message={`Are you sure you want to cancel the scheduled lecture for ${cancelLectureItem?.subject_code} (${cancelLectureItem?.class_name}) on ${cancelLectureItem?.lecture_date}? Once cancelled, attendance cannot be recorded for this session.`}
        confirmText="Cancel Lecture"
        variant="destructive"
        isLoading={cancelMutation.isPending}
      />
    </div>
  )
}

export default LectureListPage
