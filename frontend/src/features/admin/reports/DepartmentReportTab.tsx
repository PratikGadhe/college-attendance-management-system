import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  Search,
  Download,
  Users,
  School,
  CalendarDays,
  Percent,
} from 'lucide-react'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { DepartmentAttendanceReportItem } from '../../../types/reports.types'
import { Card, LoadingSpinner, ErrorMessage, EmptyState, Button } from '../../../components/common'
import { exportToCsv, getReportTimestamp } from '../../../utils/exportCsv'

export const DepartmentReportTab: React.FC = () => {
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'reports', 'departments', { search: search.trim() || undefined }],
    queryFn: () => adminApi.getDepartmentReport({ search: search.trim() || undefined }),
  })

  const departments: DepartmentAttendanceReportItem[] = data?.items || []

  const handleExportCsv = () => {
    if (!departments.length) return
    exportToCsv(
      `department_attendance_report_${getReportTimestamp()}`,
      departments,
      [
        { header: 'Dept ID', key: 'department_id' },
        { header: 'Dept Code', key: 'department_code' },
        { header: 'Department Name', key: 'department_name' },
        { header: 'Total Classes', key: 'total_classes' },
        { header: 'Active Students', key: 'total_active_students' },
        { header: 'Submitted Lectures', key: 'total_submitted_lectures' },
        { header: 'Total Present', key: 'present_count' },
        { header: 'Total Absent', key: 'absent_count' },
        {
          header: 'Attendance %',
          accessor: (item) => `${item.attendance_percentage.toFixed(2)}%`,
        },
      ]
    )
  }

  return (
    <div className="space-y-4">
      {/* Action / Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by department name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">
            {departments.length} {departments.length === 1 ? 'department' : 'departments'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={departments.length === 0}
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
            <LoadingSpinner size="lg" text="Loading department attendance report..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorMessage
              title="Failed to load department report"
              message={getApiErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : departments.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Building2 className="w-8 h-8" />}
              title="No Departments Found"
              description={search ? `No departments match "${search}".` : 'No department records exist.'}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4 text-center">Classes</th>
                  <th className="py-3.5 px-4 text-center">Active Students</th>
                  <th className="py-3.5 px-4 text-center">Conducted Lectures</th>
                  <th className="py-3.5 px-4 text-center">Present / Absent</th>
                  <th className="py-3.5 px-4 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {departments.map((dept) => {
                  const pct = dept.attendance_percentage
                  const isGood = pct >= 75
                  const isModerate = pct >= 60 && pct < 75
                  return (
                    <tr key={dept.department_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {dept.department_code}
                          </span>
                          <span className="font-semibold text-slate-900">{dept.department_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-900">
                        <span className="inline-flex items-center gap-1">
                          <School className="w-3.5 h-3.5 text-slate-400" />
                          {dept.total_classes}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-900">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {dept.total_active_students}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-900">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          {dept.total_submitted_lectures}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="text-emerald-700 font-bold">{dept.present_count}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-rose-700 font-bold">{dept.absent_count}</span>
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
        )}
      </Card>
    </div>
  )
}

