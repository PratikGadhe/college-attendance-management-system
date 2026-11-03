import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  FileEdit,
  ArrowRight,
  History,
  ShieldCheck,
  BarChart2,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import studentApi from '../../../api/student.api'
import { getApiErrorMessage } from '../../../api/axios'
import {
  PageHeader,
  Card,
  Button,
  LoadingSpinner,
  ErrorMessage,
} from '../../../components/common'

export const StudentDashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')

  // Queries
  const {
    data: summary,
    isLoading: isSummaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['student', 'dashboard', 'summary'],
    queryFn: () => studentApi.getDashboardSummary(),
  })

  const {
    data: subjectPerf,
    isLoading: isSubjectLoading,
  } = useQuery({
    queryKey: ['student', 'dashboard', 'subject-performance'],
    queryFn: () => studentApi.getSubjectPerformance(),
  })

  const {
    data: trends,
    isLoading: isTrendsLoading,
    error: trendsError,
  } = useQuery({
    queryKey: ['student', 'dashboard', 'trends', period],
    queryFn: () => studentApi.getAttendanceTrends({ period }),
  })

  const {
    data: recentHistory,
    isLoading: isHistoryLoading,
  } = useQuery({
    queryKey: ['student', 'dashboard', 'recent-history'],
    queryFn: () => studentApi.getAttendanceHistory({ limit: 5 }),
  })

  const trendData = trends?.items || []
  const isBelowThreshold = summary ? summary.overall_attendance_percentage < 75 : false

  if (isSummaryLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading student academic profile..." />
      </div>
    )
  }

  if (summaryError) {
    return (
      <div className="p-6">
        <ErrorMessage
          title="Failed to load student dashboard"
          message={getApiErrorMessage(summaryError)}
          onRetry={() => refetchSummary()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={summary?.student_name ? `Welcome, ${summary.student_name}` : 'Student Dashboard'}
        description={`Roll No: ${summary?.roll_number || 'N/A'} • ${summary?.active_class_name || 'Class'} • ${summary?.department_name || 'Academic'} Department`}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <GraduationCap className="w-3.5 h-3.5" />
            STUDENT PORTAL
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/student/attendance">
              <Button variant="outline" size="sm" leftIcon={<BookOpen className="w-4 h-4" />}>
                Subject Attendance
              </Button>
            </Link>
            <Link to="/student/history">
              <Button variant="primary" size="sm" leftIcon={<History className="w-4 h-4" />}>
                Attendance History
              </Button>
            </Link>
          </div>
        }
      />

      {/* Institutional 75% Requirement Alert Banner */}
      {summary && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-all shadow-2xs ${
            isBelowThreshold
              ? 'bg-amber-50/80 border-amber-300 text-amber-900'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
          }`}
        >
          {isBelowThreshold ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs sm:text-sm">
            <p className="font-bold">
              {isBelowThreshold
                ? 'Low Attendance Warning — Below 75% Requirement'
                : 'Good Academic Standing — Minimum 75% Requirement Met'}
            </p>
            <p className="mt-0.5 opacity-90 leading-relaxed">
              {isBelowThreshold
                ? `Your cumulative attendance rate is ${summary.overall_attendance_percentage}%. Institutional academic regulations require a minimum of 75% attendance in each semester to qualify for final examinations. Attend upcoming lectures to recover eligibility.`
                : `Your cumulative attendance rate is ${summary.overall_attendance_percentage}%. You have satisfied the institutional exam eligibility requirement.`}
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Percentage */}
        <Card className="relative overflow-hidden border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Overall Attendance
            </p>
            <div
              className={`p-2 rounded-xl ${
                isBelowThreshold
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3
              className={`text-2xl sm:text-3xl font-extrabold ${
                isBelowThreshold ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {summary?.overall_attendance_percentage}%
            </h3>
            <span className="text-xs font-medium text-slate-500">cumulative</span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isBelowThreshold ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, summary?.overall_attendance_percentage || 0))}%` }}
            />
          </div>
        </Card>

        {/* Lectures Attended */}
        <Card className="relative overflow-hidden border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Lectures Attended
            </p>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {summary?.present_count ?? 0}
            </h3>
            <span className="text-xs text-slate-500">
              of {summary?.total_submitted_lectures ?? 0} conducted
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Recorded as PRESENT in finalized lectures
          </p>
        </Card>

        {/* Lectures Missed */}
        <Card className="relative overflow-hidden border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Lectures Missed
            </p>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {summary?.absent_count ?? 0}
            </h3>
            <span className="text-xs text-slate-500">sessions</span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Recorded as ABSENT in finalized lectures
          </p>
        </Card>

        {/* Correction Disputes */}
        <Card className="relative overflow-hidden border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Correction Requests
            </p>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FileEdit className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {summary?.pending_correction_requests ?? 0}
            </h3>
            <span className="text-xs text-slate-500">pending review</span>
          </div>
          <div className="mt-2">
            <Link
              to="/student/correction-requests"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
            >
              Track requests <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Attendance Trends Bar Chart */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              My Attendance Trends
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personal attendance rate percentage over chronological time buckets
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all capitalize ${
                  period === p
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {isTrendsLoading ? (
          <div className="h-64 flex items-center justify-center">
            <LoadingSpinner size="md" text="Loading trends chart..." />
          </div>
        ) : trendsError ? (
          <div className="h-64 flex items-center justify-center">
            <ErrorMessage message={getApiErrorMessage(trendsError)} />
          </div>
        ) : trendData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6">
            <CalendarDays className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No trend history available</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Attendance records will generate trend insights as faculty conduct and submit lectures.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
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
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Two Column Grid: Subject Performance & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-wise Attendance Cards */}
        <Card noPadding>
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Subject-wise Attendance
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Enrolled semester courses</p>
            </div>
            <Link
              to="/student/attendance"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isSubjectLoading ? (
            <div className="p-8 flex justify-center">
              <LoadingSpinner size="sm" text="Loading subjects..." />
            </div>
          ) : !subjectPerf?.items || subjectPerf.items.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No subjects registered for your enrollment.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {subjectPerf.items.map((sub) => {
                const subBelow = sub.attendance_percentage < 75
                return (
                  <div key={sub.subject_id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {sub.subject_code}
                        </span>
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                          {sub.subject_name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Attended {sub.present_count} of {sub.total_submitted_lectures} lectures ({sub.absent_count} missed)
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          subBelow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {sub.attendance_percentage}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Recent Attendance Activity */}
        <Card noPadding>
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-sky-600" />
                Recent Attendance Sessions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest marked lecture sessions</p>
            </div>
            <Link
              to="/student/history"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              Full log <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isHistoryLoading ? (
            <div className="p-8 flex justify-center">
              <LoadingSpinner size="sm" text="Loading history..." />
            </div>
          ) : !recentHistory?.items || recentHistory.items.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No recent attendance records found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentHistory.items.map((rec) => (
                <div key={rec.attendance_id} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate block">
                      {rec.subject_code} • {rec.subject_name}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {rec.lecture_date} • {rec.start_time.slice(0, 5)} - {rec.end_time.slice(0, 5)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {rec.attendance_status === 'PRESENT' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        PRESENT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        <XCircle className="w-3 h-3" />
                        ABSENT
                      </span>
                    )}

                    {rec.attendance_status === 'ABSENT' && (
                      <Link to={`/student/correction-requests?attendance_id=${rec.attendance_id}`}>
                        <Button variant="ghost" size="sm" className="text-amber-700 hover:bg-amber-50">
                          Dispute
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default StudentDashboardPage
