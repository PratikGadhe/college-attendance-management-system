import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookMarked,
  BookOpen,
  CalendarDays,
  PlusCircle,
  Search,
  Info,
} from 'lucide-react'
import facultyApi from '../../../api/faculty.api'
import { getApiErrorMessage } from '../../../api/axios'
import {
  PageHeader,
  Card,
  Button,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
} from '../../../components/common'

export const FacultyTeachingAssignmentsPage: React.FC = () => {
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['faculty', 'teaching-assignments'],
    queryFn: () => facultyApi.getTeachingAssignments(),
  })

  const assignments = data?.items || []

  const filteredAssignments = assignments.filter((item) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      item.subject_name.toLowerCase().includes(q) ||
      item.subject_code.toLowerCase().includes(q) ||
      item.class_name.toLowerCase().includes(q) ||
      item.department_name.toLowerCase().includes(q) ||
      item.division.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Teaching Assignments"
        description="Assigned academic courses, enrolled classes, and scheduled lecture tracks for your faculty account."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <BookMarked className="w-3.5 h-3.5" />
            {assignments.length} COURSES ASSIGNED
          </span>
        }
        actions={
          <Link to="/faculty/lectures">
            <Button variant="outline" size="sm" leftIcon={<CalendarDays className="w-4 h-4" />}>
              All Lectures
            </Button>
          </Link>
        }
      />

      {/* Info notice explaining admin assignment */}
      <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-sky-800 leading-relaxed">
          Teaching assignments are managed by College Administrators. If a course or section is
          missing from your roster, please contact the academic department office.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assignments by subject, code, class or department..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-16 flex justify-center">
          <LoadingSpinner size="lg" text="Loading teaching assignments..." />
        </div>
      ) : error ? (
        <div className="p-6">
          <ErrorMessage
            title="Failed to load assignments"
            message={getApiErrorMessage(error)}
            onRetry={() => refetch()}
          />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookMarked className="w-10 h-10" />}
            title="No Assignments Found"
            description={
              search
                ? `No courses matched your query "${search}". Try searching for another term.`
                : 'You have not been assigned to any course or class section yet.'
            }
            action={
              search
                ? {
                    label: 'Clear Search',
                    onClick: () => setSearch(''),
                  }
                : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.assignment_id} className="flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold font-mono border border-indigo-200">
                      {assignment.subject_code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2 line-clamp-1">
                      {assignment.subject_name}
                    </h3>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-500 shrink-0">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>

                <div className="space-y-2 py-3 border-t border-b border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Class & Division:</span>
                    <span className="font-semibold text-slate-900">
                      {assignment.class_name} • Div {assignment.division}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Semester:</span>
                    <span className="font-semibold text-slate-900">Semester {assignment.semester}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Academic Year:</span>
                    <span className="font-semibold text-slate-900">{assignment.academic_year}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Department:</span>
                    <span className="font-semibold text-slate-900 truncate max-w-[160px]">
                      {assignment.department_name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-2">
                <Link
                  to={`/faculty/lectures?assignment_id=${assignment.assignment_id}`}
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full" leftIcon={<CalendarDays className="w-3.5 h-3.5" />}>
                    View Lectures
                  </Button>
                </Link>
                <Link
                  to={`/faculty/lectures?assignment_id=${assignment.assignment_id}&action=new`}
                  className="flex-1"
                >
                  <Button variant="primary" size="sm" className="w-full" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
                    Schedule
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default FacultyTeachingAssignmentsPage
