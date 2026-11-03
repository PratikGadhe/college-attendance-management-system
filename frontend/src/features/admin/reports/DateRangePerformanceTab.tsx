import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Percent,
  Download,
  RotateCcw,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import adminApi from '../../../api/admin.api'
import { getApiErrorMessage } from '../../../api/axios'
import type { LectureReportItem } from '../../../types/reports.types'
import {
  Card,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  Button,
  StatCard,
} from '../../../components/common'
import { exportToCsv, getReportTimestamp } from '../../../utils/exportCsv'

export const DateRangePerformanceTab: React.FC = () => {
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('')

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

  // Load performance report
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'admin',
      'reports',
      'attendance-performance',
      {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        class_id: selectedClassId || undefined,
        subject_id: selectedSubjectId || undefined,
      },
    ],
    queryFn: () =>
      adminApi.getDateRangeAttendanceReport({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        class_id: selectedClassId ? Number(selectedClassId) : undefined,
        subject_id: selectedSubjectId ? Number(selectedSubjectId) : undefined,
      }),
  })

  const lectures: LectureReportItem[] = data?.items || []
  const overallRate = data?.attendance_percentage ?? 0
  const isGood = overallRate >= 75

  const handleResetFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedClassId('')
    setSelectedSubjectId('')
  }

  const handleExportCsv = () => {
    if (!lectures.length) return
    exportToCsv(
      `attendance_performance_range_${startDate || 'start'}_to_${endDate || 'end'}_${getReportTimestamp()}`,
      lectures,
      [
        { header: 'Lecture ID', key: 'lecture_id' },
        { header: 'Date', key: 'lecture_date' },
        { header: 'Subject Code', key: 'subject_code' },
        { header: 'Subject Name', key: 'subject_name' },
        { header: 'Class', key: 'class_name' },
        { header: 'Division', key: 'division' },
        { header: 'Faculty', key: 'faculty_name' },
        { header: 'Present Marks', key: 'present_count' },
        { header: 'Absent Marks', key: 'absent_count' },
        { header: 'Total Students', key: 'total_students' },
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

  // Prepare chart data (chronological)
  const chartData = [...lectures]
    .reverse()
    .slice(0, 10)
    .map((lec) => ({
      name: `${lec.subject_code} (${lec.lecture_date.slice(5)})`,
      present: lec.present_count,
      absent: lec.absent_count,
      rate: lec.total_students > 0 ? (lec.present_count / lec.total_students) * 100 : 0,
    }))

  return (
    <div className="space-y-6">
      {/* Date Range & Dimension Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Class Filter</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : '')}
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Filter</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : '')}
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
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {(startDate || endDate || selectedClassId !== '' || selectedSubjectId !== '') ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="gap-1 text-xs text-slate-600 h-7"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </Button>
          ) : (
            <span className="text-xs text-slate-400">All available dates</span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={lectures.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export Range Data
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 flex justify-center bg-white rounded-xl border border-slate-200">
          <LoadingSpinner size="lg" text="Calculating date range performance metrics..." />
        </div>
      ) : error ? (
        <div className="p-8 bg-white rounded-xl border border-slate-200">
          <ErrorMessage
            title="Failed to load performance metrics"
            message={getApiErrorMessage(error)}
            onRetry={() => refetch()}
          />
        </div>
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <StatCard
              label="Lectures Conducted"
              value={data?.total_lectures ?? 0}
              icon={<CalendarDays className="w-5 h-5" />}
              variant="primary"
            />
            <StatCard
              label="Total Marks"
              value={data?.total_records ?? 0}
              icon={<TrendingUp className="w-5 h-5" />}
              variant="default"
            />
            <StatCard
              label="Present Marks"
              value={data?.present_count ?? 0}
              icon={<CheckCircle2 className="w-5 h-5" />}
              variant="success"
            />
            <StatCard
              label="Absent Marks"
              value={data?.absent_count ?? 0}
              icon={<XCircle className="w-5 h-5" />}
              variant="danger"
            />
            <StatCard
              label="Attendance Rate"
              value={`${overallRate.toFixed(2)}%`}
              icon={<Percent className="w-5 h-5" />}
              variant={isGood ? 'success' : 'danger'}
              trend={{
                value: isGood ? 'Above 75%' : 'Below 75%',
                isPositive: isGood,
              }}
            />
          </div>

          {/* Visual Chart */}
          {chartData.length > 0 && (
            <Card title="Attendance Volume & Distribution in Range">
              <div className="h-64 sm:h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '0.5rem',
                        border: '1px solid #E2E8F0',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="present" name="Present Students" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" name="Absent Students" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Breakdown Table */}
          <Card title="Conducted Lectures in Range" noPadding>
            {lectures.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<CalendarDays className="w-8 h-8" />}
                  title="No Lectures Recorded"
                  description="No submitted lecture records found in this date range."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Faculty</th>
                      <th className="py-3 px-4 text-center">Present / Absent</th>
                      <th className="py-3 px-4 text-right">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {lectures.map((lec) => {
                      const rate =
                        lec.total_students > 0
                          ? (lec.present_count / lec.total_students) * 100
                          : 0
                      return (
                        <tr key={lec.lecture_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                            {lec.lecture_date}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded mr-1.5 border border-indigo-200">
                              {lec.subject_code}
                            </span>
                            {lec.subject_name}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">{lec.class_name} (Div {lec.division})</td>
                          <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">{lec.faculty_name}</td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="text-emerald-700 font-bold">{lec.present_count}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="text-rose-700 font-bold">{lec.absent_count}</span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                            {rate.toFixed(1)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
