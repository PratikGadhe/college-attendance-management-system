import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Briefcase,
  Building2,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  PieChart as PieChartIcon,
  BarChart2,
  TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import adminApi from '../../../api/admin.api'
import {
  PageHeader,
  StatCard,
  Card,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  StatusBadge,
} from '../../../components/common'

export const AdminDashboardPage: React.FC = () => {
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // 1. Dashboard Summary
  const {
    data: summary,
    isLoading: isSummaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['admin', 'dashboard', 'summary'],
    queryFn: () => adminApi.getDashboardSummary(),
  })

  // 2. Attendance Distribution
  const {
    data: distribution,
    isLoading: isDistLoading,
    error: distError,
  } = useQuery({
    queryKey: ['admin', 'dashboard', 'distribution'],
    queryFn: () => adminApi.getAttendanceDistribution(),
  })

  // 3. Attendance Trends
  const {
    data: trends,
    isLoading: isTrendsLoading,
    error: trendsError,
  } = useQuery({
    queryKey: ['admin', 'dashboard', 'trends', trendPeriod],
    queryFn: () => adminApi.getAttendanceTrends({ period: trendPeriod }),
  })

  // 4. Recent Lectures
  const {
    data: recentLectures,
    isLoading: isLecturesLoading,
  } = useQuery({
    queryKey: ['admin', 'dashboard', 'recent-lectures'],
    queryFn: () => adminApi.getRecentLectures(5),
  })

  // 5. Pending Corrections
  const {
    data: pendingCorrections,
    isLoading: isCorrectionsLoading,
  } = useQuery({
    queryKey: ['admin', 'dashboard', 'pending-corrections'],
    queryFn: () => adminApi.getPendingCorrections(5),
  })

  const isLoading = isSummaryLoading || isDistLoading

  if (summaryError) {
    return (
      <div className="p-6">
        <ErrorMessage
          title="Failed to load dashboard metrics"
          message="Could not connect to the Admin Dashboard service."
          onRetry={() => refetchSummary()}
        />
      </div>
    )
  }

  // Distribution chart data
  const distData = distribution
    ? [
        { name: 'Present', value: distribution.present_count, color: '#10b981' },
        { name: 'Absent', value: distribution.absent_count, color: '#f43f5e' },
      ]
    : []

  // Trend chart data
  const trendData = trends?.items || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Admin Academic Overview"
        description="Comprehensive real-time institutional metrics, lecture statistics, and attendance analytics."
      />

      {/* Top Stat Cards Grid */}
      {isLoading ? (
        <div className="p-12 flex justify-center">
          <LoadingSpinner size="lg" text="Loading dashboard metrics..." />
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <StatCard
            label="Total Students"
            value={summary.total_students}
            icon={<Users className="w-4 h-4" />}
            variant="primary"
            helperText={`${summary.active_students} active accounts`}
          />
          <StatCard
            label="Total Faculty"
            value={summary.total_faculty}
            icon={<Briefcase className="w-4 h-4" />}
            variant="default"
            helperText={`${summary.active_faculty} active accounts`}
          />
          <StatCard
            label="Departments"
            value={summary.total_departments}
            icon={<Building2 className="w-4 h-4" />}
            variant="default"
            helperText={`${summary.total_classes} academic classes`}
          />
          <StatCard
            label="Subjects"
            value={summary.total_subjects}
            icon={<BookOpen className="w-4 h-4" />}
            variant="default"
            helperText={`${summary.total_teaching_assignments} assignments`}
          />
          <StatCard
            label="Submitted Lectures"
            value={summary.submitted_lectures}
            icon={<CalendarDays className="w-4 h-4" />}
            variant="success"
            helperText={`${summary.total_lectures} total recorded`}
          />
          <StatCard
            label="Attendance Rate"
            value={`${summary.overall_attendance_percentage}%`}
            icon={<TrendingUp className="w-4 h-4" />}
            variant={summary.overall_attendance_percentage >= 75 ? 'success' : 'danger'}
            helperText={`${summary.total_present} P / ${summary.total_absent} A`}
          />
        </div>
      ) : null}

      {/* Second Row: Charts (Attendance Distribution & Attendance Trends) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Distribution Card */}
        <div className="lg:col-span-5">
          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-800">Attendance Distribution</h3>
                </div>
                {distribution && (
                  <span className="text-xs text-slate-500 font-medium">
                    {distribution.total_marked} records
                  </span>
                )}
              </div>
            }
          >
            {isDistLoading ? (
              <div className="h-64 flex items-center justify-center">
                <LoadingSpinner size="md" />
              </div>
            ) : distError || !distribution || distribution.total_marked === 0 ? (
              <EmptyState
                title="No Attendance Data"
                description="No submitted lecture attendance records available yet."
                className="h-64"
              />
            ) : (
              <div className="space-y-4">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {distData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`${val ?? 0} records`, 'Count']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-center">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase">Present</span>
                    <p className="text-lg font-extrabold text-emerald-700">
                      {distribution.present_percentage}%
                    </p>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      {distribution.present_count} marks
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                    <span className="text-[11px] font-bold text-rose-800 uppercase">Absent</span>
                    <p className="text-lg font-extrabold text-rose-700">
                      {distribution.absent_percentage}%
                    </p>
                    <span className="text-[10px] text-rose-600 font-medium">
                      {distribution.absent_count} marks
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Attendance Trends Card */}
        <div className="lg:col-span-7">
          <Card
            header={
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-800">Attendance Trends</h3>
                </div>
                {/* Granularity Selector */}
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
                  {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setTrendPeriod(period)}
                      className={`px-2.5 py-1 rounded-md font-semibold capitalize transition-all cursor-pointer ${
                        trendPeriod === period
                          ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            }
          >
            {isTrendsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <LoadingSpinner size="md" />
              </div>
            ) : trendsError || trendData.length === 0 ? (
              <EmptyState
                title="No Trend Data"
                description={`No submitted lectures recorded for ${trendPeriod} trends.`}
                className="h-64"
              />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} unit="%" />
                    <Tooltip
                      formatter={(val: any) => [`${val ?? 0}%`, 'Attendance Rate']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="attendance_percentage"
                      name="Attendance %"
                      fill="#4f46e5"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Third Row: Recent Lectures & Pending Corrections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Lectures */}
        <div className="lg:col-span-7">
          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-800">Recent Lecture Activity</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Latest sessions</span>
              </div>
            }
            noPadding
          >
            {isLecturesLoading ? (
              <div className="p-8 flex justify-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : !recentLectures || recentLectures.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No recent lecture activity recorded.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Subject / Faculty</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentLectures.map((lec) => (
                      <tr key={lec.lecture_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{lec.subject_name}</span>
                          <span className="text-[11px] text-slate-500">{lec.faculty_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span>{lec.class_name}</span>
                          <span className="text-slate-400 ml-1">({lec.division})</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span>{lec.lecture_date}</span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={lec.lecture_status} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium">
                          <span className="text-emerald-600">{lec.present_count}P</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className="text-rose-600">{lec.absent_count}A</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Pending Corrections & Status Summary */}
        <div className="lg:col-span-5">
          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-800">Pending Correction Requests</h3>
                </div>
                {summary && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    {summary.pending_correction_requests} pending
                  </span>
                )}
              </div>
            }
            noPadding
          >
            {isCorrectionsLoading ? (
              <div className="p-8 flex justify-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : !pendingCorrections || pendingCorrections.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                <span>All attendance correction requests are up to date!</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingCorrections.map((cr) => (
                  <div key={cr.request_id} className="p-3.5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">{cr.student_name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{cr.roll_number}</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">
                      Disputing <span className="font-semibold text-slate-800">{cr.subject_name}</span> on{' '}
                      {cr.lecture_date}
                    </p>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 truncate max-w-[200px]" title={cr.reason}>
                        "{cr.reason}"
                      </span>
                      <div className="flex items-center gap-1 font-semibold text-[10px]">
                        <span className="text-slate-400 line-through">{cr.current_status}</span>
                        <span>&rarr;</span>
                        <span className="text-indigo-600">{cr.requested_status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
