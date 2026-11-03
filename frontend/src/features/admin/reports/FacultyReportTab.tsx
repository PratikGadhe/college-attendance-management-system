import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Briefcase,
  Search,
  Download,
  BookMarked,
  RotateCcw,
  Percent,
} from 'lucide-react'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { FacultyAttendanceReportItem } from '../../../types/reports.types'
import { Card, LoadingSpinner, ErrorMessage, EmptyState, Button } from '../../../components/common'
import { Pagination } from '../../../components/tables/Pagination'
import { exportToCsv, getReportTimestamp } from '../../../utils/exportCsv'

export const FacultyReportTab: React.FC = () => {
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

  // Load faculty attendance report
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'admin',
      'reports',
      'faculty',
      {
        department_id: selectedDeptId || undefined,
        search: search.trim() || undefined,
        skip,
        limit: pageSize,
      },
    ],
    queryFn: () =>
      adminApi.getFacultyReport({
        department_id: selectedDeptId ? Number(selectedDeptId) : undefined,
        search: search.trim() || undefined,
        skip,
        limit: pageSize,
      }),
  })

  const facultyList: FacultyAttendanceReportItem[] = data?.items || []
  const totalItems = data?.total || 0

  const handleResetFilters = () => {
    setSelectedDeptId('')
    setSearch('')
    setSkip(0)
  }

  const handleExportCsv = () => {
    if (!facultyList.length) return
    exportToCsv(
      `faculty_attendance_report_${getReportTimestamp()}`,
      facultyList,
      [
        { header: 'Faculty ID', key: 'faculty_id' },
        { header: 'Faculty Name', key: 'faculty_name' },
        { header: 'Department', key: 'department_name' },
        { header: 'Teaching Assignments', key: 'total_teaching_assignments' },
        { header: 'Total Lectures', key: 'total_lectures' },
        { header: 'Submitted Lectures', key: 'submitted_lectures' },
        { header: 'Draft Lectures', key: 'draft_lectures' },
        { header: 'Cancelled Lectures', key: 'cancelled_lectures' },
        { header: 'Total Present Marks', key: 'total_present' },
        { header: 'Total Absent Marks', key: 'total_absent' },
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
              placeholder="Search faculty name..."
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
            {totalItems} {totalItems === 1 ? 'faculty' : 'faculty'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={facultyList.length === 0}
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
            <LoadingSpinner size="lg" text="Loading faculty teaching report..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorMessage
              title="Failed to load faculty report"
              message={getApiErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : facultyList.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Briefcase className="w-8 h-8" />}
              title="No Faculty Found"
              description="No faculty members match the applied filters."
            />
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4">Faculty Member</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4 text-center">Assignments</th>
                    <th className="py-3.5 px-4 text-center">Lectures Breakdown</th>
                    <th className="py-3.5 px-4 text-center">Present / Absent</th>
                    <th className="py-3.5 px-4 text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {facultyList.map((f) => {
                    const pct = f.attendance_percentage
                    const isGood = pct >= 75
                    const isModerate = pct >= 60 && pct < 75
                    return (
                      <tr key={f.faculty_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {f.faculty_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{f.department_name}</td>
                        <td className="py-3.5 px-4 text-center font-medium text-slate-900">
                          <span className="inline-flex items-center gap-1">
                            <BookMarked className="w-3.5 h-3.5 text-slate-400" />
                            {f.total_teaching_assignments} courses
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 text-xs">
                            <span
                              className="font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
                              title="Submitted Lectures"
                            >
                              {f.submitted_lectures} Sub
                            </span>
                            {f.draft_lectures > 0 && (
                              <span
                                className="font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
                                title="Draft Lectures"
                              >
                                {f.draft_lectures} Draft
                              </span>
                            )}
                            {f.cancelled_lectures > 0 && (
                              <span
                                className="font-medium px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200"
                                title="Cancelled Lectures"
                              >
                                {f.cancelled_lectures} Canc
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="text-emerald-700 font-bold">{f.total_present}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-rose-700 font-bold">{f.total_absent}</span>
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
