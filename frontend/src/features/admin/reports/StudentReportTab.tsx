import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  AlertTriangle,
  Search,
  Download,
  CalendarDays,
  Percent,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type {
  StudentAttendanceReportItem,
  LowAttendanceReportItem,
} from '../../../types/reports.types'
import { Card, LoadingSpinner, ErrorMessage, EmptyState, Button } from '../../../components/common'
import { Pagination } from '../../../components/tables/Pagination'
import { exportToCsv, getReportTimestamp } from '../../../utils/exportCsv'

export const StudentReportTab: React.FC = () => {
  const [subView, setSubView] = useState<'all' | 'defaulters'>('all')

  // Common filters
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('')
  const [search, setSearch] = useState('')

  // Defaulters specific filters
  const [threshold, setThreshold] = useState<number>(75.0)
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('')

  // Pagination states
  const [allSkip, setAllSkip] = useState(0)
  const [defaulterSkip, setDefaulterSkip] = useState(0)
  const pageSize = 15

  // Load classes and subjects for filter dropdowns
  const { data: classData } = useQuery({
    queryKey: ['admin', 'classes', 'list-all'],
    queryFn: () => adminApi.getClasses({ limit: 100 }),
  })
  const classes = classData?.items || []

  const { data: subjectData } = useQuery({
    queryKey: ['admin', 'subjects', 'list-all'],
    queryFn: () => adminApi.getSubjects({ limit: 100 }),
  })
  const subjects = subjectData?.items || []

  // Mode 1: All Students
  const {
    data: allStudentsData,
    isLoading: isAllLoading,
    error: allError,
    refetch: refetchAll,
  } = useQuery({
    queryKey: [
      'admin',
      'reports',
      'students',
      {
        class_id: selectedClassId || undefined,
        search: search.trim() || undefined,
        skip: allSkip,
        limit: pageSize,
      },
    ],
    queryFn: () =>
      adminApi.getStudentReport({
        class_id: selectedClassId ? Number(selectedClassId) : undefined,
        search: search.trim() || undefined,
        skip: allSkip,
        limit: pageSize,
      }),
    enabled: subView === 'all',
  })

  // Mode 2: Defaulters / Low Attendance
  const {
    data: defaultersData,
    isLoading: isDefaultersLoading,
    error: defaultersError,
    refetch: refetchDefaulters,
  } = useQuery({
    queryKey: [
      'admin',
      'reports',
      'low-attendance',
      {
        threshold,
        class_id: selectedClassId || undefined,
        subject_id: selectedSubjectId || undefined,
        skip: defaulterSkip,
        limit: pageSize,
      },
    ],
    queryFn: () =>
      adminApi.getLowAttendanceReport({
        threshold,
        class_id: selectedClassId ? Number(selectedClassId) : undefined,
        subject_id: selectedSubjectId ? Number(selectedSubjectId) : undefined,
        skip: defaulterSkip,
        limit: pageSize,
      }),
    enabled: subView === 'defaulters',
  })

  const studentList: StudentAttendanceReportItem[] = allStudentsData?.items || []
  const allTotal = allStudentsData?.total || 0

  const defaulterList: LowAttendanceReportItem[] = defaultersData?.items || []
  const defaulterTotal = defaultersData?.total || 0

  const handleResetFilters = () => {
    setSelectedClassId('')
    setSelectedSubjectId('')
    setSearch('')
    setAllSkip(0)
    setDefaulterSkip(0)
  }

  const handleExportAllCsv = () => {
    if (!studentList.length) return
    exportToCsv(
      `all_students_attendance_${getReportTimestamp()}`,
      studentList,
      [
        { header: 'Student ID', key: 'student_id' },
        { header: 'Roll Number', key: 'roll_number' },
        { header: 'Student Name', key: 'student_name' },
        { header: 'Class', key: 'class_name' },
        { header: 'Department', key: 'department_name' },
        { header: 'Conducted Lectures', key: 'total_submitted_lectures' },
        { header: 'Attended (Present)', key: 'present_count' },
        { header: 'Missed (Absent)', key: 'absent_count' },
        {
          header: 'Attendance %',
          accessor: (item) => `${item.attendance_percentage.toFixed(2)}%`,
        },
      ]
    )
  }

  const handleExportDefaultersCsv = () => {
    if (!defaulterList.length) return
    exportToCsv(
      `low_attendance_defaulters_${threshold}pct_${getReportTimestamp()}`,
      defaulterList,
      [
        { header: 'Student ID', key: 'student_id' },
        { header: 'Roll Number', key: 'roll_number' },
        { header: 'Student Name', key: 'student_name' },
        { header: 'Class', key: 'class_name' },
        { header: 'Department', key: 'department_name' },
        { header: 'Conducted Lectures', key: 'total_submitted_lectures' },
        { header: 'Present Marks', key: 'present_count' },
        { header: 'Absent Marks', key: 'absent_count' },
        {
          header: 'Attendance %',
          accessor: (item) => `${item.attendance_percentage.toFixed(2)}%`,
        },
        { header: 'Target Threshold %', accessor: (item) => `${item.threshold}%` },
        {
          header: 'Required Present To Reach Threshold',
          key: 'required_present_count_to_reach_threshold',
        },
      ]
    )
  }

  return (
    <div className="space-y-4">
      {/* Sub-view toggle & Quick switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="inline-flex p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setSubView('all')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              subView === 'all'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            All Students Overview
          </button>
          <button
            type="button"
            onClick={() => setSubView('defaulters')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              subView === 'defaulters'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            Low Attendance Warning (Defaulters)
          </button>
        </div>

        {subView === 'defaulters' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Threshold:</span>
            <div className="flex items-center gap-1">
              {[60, 70, 75, 80, 85].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setThreshold(val)
                    setDefaulterSkip(0)
                  }}
                  className={`px-2 py-1 text-xs rounded-md font-bold transition-all ${
                    threshold === val
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
            <div className="flex items-center ml-1">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={threshold}
                onChange={(e) => {
                  setThreshold(Number(e.target.value))
                  setDefaulterSkip(0)
                }}
                className="w-14 px-2 py-1 text-xs border border-slate-200 rounded-md text-center font-bold bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
              <span className="text-xs text-slate-500 font-medium ml-1">%</span>
            </div>
          </div>
        )}
      </div>

      {/* Warning banner in Defaulters Mode */}
      {subView === 'defaulters' && !isDefaultersLoading && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs sm:text-sm text-rose-800">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>
              <strong>{defaulterTotal} students</strong> currently fall below the required{' '}
              <strong>{threshold}%</strong> minimum attendance threshold.
            </span>
          </div>
          <span className="text-xs font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-300">
            Action Recommended
          </span>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Class Filter */}
          <div className="w-full sm:w-52">
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value ? Number(e.target.value) : '')
                setAllSkip(0)
                setDefaulterSkip(0)
              }}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.class_id} value={c.class_id}>
                  {c.class_name} (Div {c.division})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter (in Defaulters mode) */}
          {subView === 'defaulters' && (
            <div className="w-full sm:w-56">
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value ? Number(e.target.value) : '')
                  setDefaulterSkip(0)
                }}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">All Subjects (Cumulative)</option>
                {subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_code} - {s.subject_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Input (in All Students mode) */}
          {subView === 'all' && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student name, roll no..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setAllSkip(0)
                }}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          )}

          {(selectedClassId !== '' || selectedSubjectId !== '' || search) && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="gap-1.5 text-slate-600">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
            {subView === 'all'
              ? `${allTotal} ${allTotal === 1 ? 'student' : 'students'}`
              : `${defaulterTotal} ${defaulterTotal === 1 ? 'defaulter' : 'defaulters'}`}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={subView === 'all' ? handleExportAllCsv : handleExportDefaultersCsv}
            disabled={subView === 'all' ? studentList.length === 0 : defaulterList.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {subView === 'all' ? 'Export CSV' : 'Export Defaulters'}
          </Button>
        </div>
      </div>

      {/* Main Content: All Students View */}
      {subView === 'all' && (
        <Card noPadding>
          {isAllLoading ? (
            <div className="p-16 flex justify-center">
              <LoadingSpinner size="lg" text="Loading student attendance metrics..." />
            </div>
          ) : allError ? (
            <div className="p-8">
              <ErrorMessage
                title="Failed to load student attendance"
                message={getApiErrorMessage(allError)}
                onRetry={() => refetchAll()}
              />
            </div>
          ) : studentList.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<Users className="w-8 h-8" />}
                title="No Students Found"
                description="No students match the selected filter criteria."
              />
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3.5 px-4">Student</th>
                      <th className="py-3.5 px-4">Class</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4 text-center">Conducted Lectures</th>
                      <th className="py-3.5 px-4 text-center">Attended / Missed</th>
                      <th className="py-3.5 px-4 text-right">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {studentList.map((stu) => {
                      const pct = stu.attendance_percentage
                      const isGood = pct >= 75
                      const isModerate = pct >= 60 && pct < 75
                      return (
                        <tr key={stu.student_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div>
                              <span className="font-semibold text-slate-900 block">{stu.student_name}</span>
                              <span className="font-mono text-xs text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                {stu.roll_number}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">{stu.class_name}</td>
                          <td className="py-3.5 px-4 text-slate-600">{stu.department_name}</td>
                          <td className="py-3.5 px-4 text-center font-medium text-slate-900">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                              {stu.total_submitted_lectures}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="text-emerald-700 font-bold">{stu.present_count}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="text-rose-700 font-bold">{stu.absent_count}</span>
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
                  total={allTotal}
                  skip={allSkip}
                  limit={pageSize}
                  onPageChange={setAllSkip}
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Main Content: Defaulters / Low Attendance View */}
      {subView === 'defaulters' && (
        <Card noPadding>
          {isDefaultersLoading ? (
            <div className="p-16 flex justify-center">
              <LoadingSpinner size="lg" text="Scanning low-attendance students..." />
            </div>
          ) : defaultersError ? (
            <div className="p-8">
              <ErrorMessage
                title="Failed to load low-attendance report"
                message={getApiErrorMessage(defaultersError)}
                onRetry={() => refetchDefaulters()}
              />
            </div>
          ) : defaulterList.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<Sparkles className="w-8 h-8 text-emerald-500" />}
                title="No Students Below Threshold"
                description={`Great news! All enrolled students have met or exceeded the ${threshold}% attendance requirement.`}
              />
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3.5 px-4">Student</th>
                      <th className="py-3.5 px-4">Class</th>
                      <th className="py-3.5 px-4 text-center">Conducted</th>
                      <th className="py-3.5 px-4 text-center">Attended / Missed</th>
                      <th className="py-3.5 px-4 text-center">Current %</th>
                      <th className="py-3.5 px-4 text-right">Recovery Target ({threshold}%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {defaulterList.map((stu) => {
                      const needed = stu.required_present_count_to_reach_threshold
                      return (
                        <tr key={stu.student_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div>
                              <span className="font-semibold text-slate-900 block">{stu.student_name}</span>
                              <span className="font-mono text-xs text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                {stu.roll_number}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">{stu.class_name}</td>
                          <td className="py-3.5 px-4 text-center font-medium text-slate-900">
                            {stu.total_submitted_lectures}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="text-emerald-700 font-bold">{stu.present_count}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="text-rose-700 font-bold">{stu.absent_count}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <Percent className="w-3 h-3" />
                              {stu.attendance_percentage.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {needed > 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                Needs +{needed} consecutive
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                At threshold
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4">
                <Pagination
                  total={defaulterTotal}
                  skip={defaulterSkip}
                  limit={pageSize}
                  onPageChange={setDefaulterSkip}
                />
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
