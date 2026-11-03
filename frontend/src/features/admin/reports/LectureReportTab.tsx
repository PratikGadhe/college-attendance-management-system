import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarDays,
  Clock,
  Download,
  RotateCcw,
  Percent,
} from 'lucide-react'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { LectureReportItem } from '../../../types/reports.types'
import { Card, LoadingSpinner, ErrorMessage, EmptyState, Button, StatusBadge } from '../../../components/common'
import { Pagination } from '../../../components/tables/Pagination'
import { exportToCsv, getReportTimestamp } from '../../../utils/exportCsv'

export const LectureReportTab: React.FC = () => {
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('')
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | ''>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const [skip, setSkip] = useState(0)
  const pageSize = 15

  // Load dropdown resources
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

  const { data: facultyData } = useQuery({
    queryKey: ['admin', 'faculty', 'list-all'],
    queryFn: () => adminApi.getFaculty({ limit: 100 }),
  })
  const facultyMembers = facultyData?.items || []

  // Load lecture report
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'admin',
      'reports',
      'lectures',
      {
        class_id: selectedClassId || undefined,
        subject_id: selectedSubjectId || undefined,
        faculty_id: selectedFacultyId || undefined,
        lecture_status: selectedStatus || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        skip,
        limit: pageSize,
      },
    ],
    queryFn: () =>
      adminApi.getLectureReport({
        class_id: selectedClassId ? Number(selectedClassId) : undefined,
        subject_id: selectedSubjectId ? Number(selectedSubjectId) : undefined,
        faculty_id: selectedFacultyId ? Number(selectedFacultyId) : undefined,
        lecture_status: selectedStatus || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        skip,
        limit: pageSize,
      }),
  })

  const lectures: LectureReportItem[] = data?.items || []
  const totalItems = data?.total || 0

  const handleResetFilters = () => {
    setSelectedClassId('')
    setSelectedSubjectId('')
    setSelectedFacultyId('')
    setSelectedStatus('')
    setStartDate('')
    setEndDate('')
    setSkip(0)
  }

  const handleExportCsv = () => {
    if (!lectures.length) return
    exportToCsv(
      `lectures_audit_report_${getReportTimestamp()}`,
      lectures,
      [
        { header: 'Lecture ID', key: 'lecture_id' },
        { header: 'Date', key: 'lecture_date' },
        { header: 'Start Time', key: 'start_time' },
        { header: 'End Time', key: 'end_time' },
        { header: 'Subject Code', key: 'subject_code' },
        { header: 'Subject Name', key: 'subject_name' },
        { header: 'Class', key: 'class_name' },
        { header: 'Division', key: 'division' },
        { header: 'Faculty', key: 'faculty_name' },
        { header: 'Status', key: 'lecture_status' },
        { header: 'Total Students', key: 'total_students' },
        { header: 'Present', key: 'present_count' },
        { header: 'Absent', key: 'absent_count' },
        {
          header: 'Attendance %',
          accessor: (item) =>
            item.total_students > 0
              ? `${((item.present_count / item.total_students) * 100).toFixed(1)}%`
              : 'N/A',
        },
      ]
    )
  }

  const hasActiveFilters =
    selectedClassId !== '' ||
    selectedSubjectId !== '' ||
    selectedFacultyId !== '' ||
    selectedStatus !== '' ||
    startDate !== '' ||
    endDate !== ''

  return (
    <div className="space-y-4">
      {/* Advanced Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Class Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value ? Number(e.target.value) : '')
                setSkip(0)
              }}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.class_id} value={c.class_id}>
                  {c.class_name} (Div {c.division})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value ? Number(e.target.value) : '')
                setSkip(0)
              }}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.subject_id} value={s.subject_id}>
                  {s.subject_code} - {s.subject_name}
                </option>
              ))}
            </select>
          </div>

          {/* Faculty Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Faculty</label>
            <select
              value={selectedFacultyId}
              onChange={(e) => {
                setSelectedFacultyId(e.target.value ? Number(e.target.value) : '')
                setSkip(0)
              }}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Faculty</option>
              {facultyMembers.map((f) => (
                <option key={f.faculty_id} value={f.faculty_id}>
                  {f.faculty_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setSkip(0)
              }}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        {/* Date Range and Reset row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setSkip(0)
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setSkip(0)
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="gap-1 text-xs text-slate-600 h-7"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filters
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
              {totalItems} {totalItems === 1 ? 'lecture' : 'lectures'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={lectures.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" text="Loading lecture report records..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorMessage
              title="Failed to load lecture report"
              message={getApiErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : lectures.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<CalendarDays className="w-8 h-8" />}
              title="No Lectures Found"
              description="No lectures match the specified criteria and date range."
            />
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Class & Div</th>
                    <th className="py-3.5 px-4">Faculty</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Headcount</th>
                    <th className="py-3.5 px-4 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {lectures.map((lec) => {
                    const isSubmitted = lec.lecture_status === 'SUBMITTED'
                    const rate =
                      lec.total_students > 0
                        ? (lec.present_count / lec.total_students) * 100
                        : 0
                    return (
                      <tr key={lec.lecture_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{lec.lecture_date}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {lec.start_time.slice(0, 5)} - {lec.end_time.slice(0, 5)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 mr-1.5">
                            {lec.subject_code}
                          </span>
                          <span className="font-semibold text-slate-900">{lec.subject_name}</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {lec.class_name} (Div {lec.division})
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800">
                          {lec.faculty_name}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <StatusBadge status={lec.lecture_status} />
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {isSubmitted ? (
                            <span className="font-medium text-slate-900">
                              <span className="text-emerald-700 font-bold">{lec.present_count}</span>
                              <span className="text-slate-400 mx-1">/</span>
                              <span>{lec.total_students}</span>
                              <span className="text-xs text-rose-600 ml-1.5">({lec.absent_count} abs)</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not submitted</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {isSubmitted ? (
                            <span
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                                rate >= 75
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : rate >= 60
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <Percent className="w-3 h-3" />
                              {rate.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
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
