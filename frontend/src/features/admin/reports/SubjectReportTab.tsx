import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  Search,
  Download,
  CalendarDays,
  Percent,
  RotateCcw,
} from 'lucide-react'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { SubjectAttendanceReportItem } from '../../../types/reports.types'
import { Card, LoadingSpinner, ErrorMessage, EmptyState, Button } from '../../../components/common'
import { Pagination } from '../../../components/tables/Pagination'
import { exportToCsv, getReportTimestamp } from '../../../utils/exportCsv'

export const SubjectReportTab: React.FC = () => {
  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('')
  const [search, setSearch] = useState('')
  const [skip, setSkip] = useState(0)
  const pageSize = 10

  // Load departments for filter dropdown
  const { data: deptData } = useQuery({
    queryKey: ['admin', 'departments', 'list-all'],
    queryFn: () => adminApi.getDepartments({ limit: 100 }),
  })
  const departments = deptData?.items || []

  // Load subject attendance report
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'admin',
      'reports',
      'subjects',
      {
        department_id: selectedDeptId || undefined,
        search: search.trim() || undefined,
        skip,
        limit: pageSize,
      },
    ],
    queryFn: () =>
      adminApi.getSubjectReport({
        department_id: selectedDeptId ? Number(selectedDeptId) : undefined,
        search: search.trim() || undefined,
        skip,
        limit: pageSize,
      }),
  })

  const subjects: SubjectAttendanceReportItem[] = data?.items || []
  const totalItems = data?.total || 0

  const handleResetFilters = () => {
    setSelectedDeptId('')
    setSearch('')
    setSkip(0)
  }

  const handleExportCsv = () => {
    if (!subjects.length) return
    exportToCsv(
      `subject_attendance_report_${getReportTimestamp()}`,
      subjects,
      [
        { header: 'Subject ID', key: 'subject_id' },
        { header: 'Subject Code', key: 'subject_code' },
        { header: 'Subject Name', key: 'subject_name' },
        { header: 'Semester', key: 'semester' },
        { header: 'Class', accessor: (item) => item.class_name || 'All Enrolled' },
        { header: 'Conducted Lectures', key: 'total_submitted_lectures' },
        { header: 'Present Marks', key: 'present_count' },
        { header: 'Absent Marks', key: 'absent_count' },
        {
          header: 'Attendance %',
          accessor: (item) => `${item.attendance_percentage.toFixed(2)}%`,
        },
      ]
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Department Filter */}
          <div className="w-full sm:w-56">
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value ? Number(e.target.value) : '')
                setSkip(0)
              }}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.department_code} - {d.department_name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search subject code, name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSkip(0)
              }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {(selectedDeptId !== '' || search) && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="gap-1.5 text-slate-600">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
            {totalItems} {totalItems === 1 ? 'subject' : 'subjects'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={subjects.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" text="Loading subject attendance report..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorMessage
              title="Failed to load subject report"
              message={getApiErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : subjects.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<BookOpen className="w-8 h-8" />}
              title="No Subjects Found"
              description="No subjects match the applied filters."
            />
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4 text-center">Semester</th>
                    <th className="py-3.5 px-4">Class Context</th>
                    <th className="py-3.5 px-4 text-center">Conducted Lectures</th>
                    <th className="py-3.5 px-4 text-center">Present / Absent</th>
                    <th className="py-3.5 px-4 text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {subjects.map((sub) => {
                    const pct = sub.attendance_percentage
                    const isGood = pct >= 75
                    const isModerate = pct >= 60 && pct < 75
                    return (
                      <tr key={sub.subject_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {sub.subject_code}
                            </span>
                            <span className="font-semibold text-slate-900">{sub.subject_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-medium">Sem {sub.semester}</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {sub.class_name ? sub.class_name : <span className="text-slate-400 italic">All Enrolled</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center font-medium text-slate-900">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                            {sub.total_submitted_lectures}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="text-emerald-700 font-bold">{sub.present_count}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-rose-700 font-bold">{sub.absent_count}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex flex-col items-end gap-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isGood
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isModerate
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <Percent className="w-3 h-3" />
                              {pct.toFixed(2)}%
                            </span>
                            <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isGood ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4">
              <Pagination
                total={totalItems}
                skip={skip}
                limit={pageSize}
                onPageChange={setSkip}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
