import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookMarked,
  CalendarDays,
  TrendingUp,
  FileEdit,
  CheckCircle2,
  ArrowRight,
  CheckSquare,
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
import facultyApi from '../../../api/faculty.api'
import { getApiErrorMessage } from '../../../api/axios'
import {
  PageHeader,
  Card,
  Button,
  StatusBadge,
  LoadingSpinner,
  ErrorMessage,
} from '../../../components/common'

export const FacultyDashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')

  // Queries
  const {
    data: summary,
    isLoading: isSummaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['faculty', 'dashboard', 'summary'],
    queryFn: () => facultyApi.getDashboardSummary(),
  })

  const {
    data: trends,
    isLoading: isTrendsLoading,
    error: trendsError,
  } = useQuery({
    queryKey: ['faculty', 'dashboard', 'trends', period],
    queryFn: () => facultyApi.getAttendanceTrends({ period }),
  })

  const {
    data: recentLectures,
    isLoading: isLecturesLoading,
  } = useQuery({
    queryKey: ['faculty', 'dashboard', 'recent-lectures'],
    queryFn: () => facultyApi.getLectures({ limit: 5 }),
  })

  const {
    data: pendingCorrections,
    isLoading: isCorrectionsLoading,
  } = useQuery({
    queryKey: ['faculty', 'dashboard', 'pending-corrections'],
    queryFn: () => facultyApi.getCorrectionRequests({ request_status: 'PENDING', limit: 5 }),
  })

  const trendData = trends?.items || []

  if (isSummaryLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading faculty workspace metrics..." />
      </div>
    )
  }

  if (summaryError) {
    return (
      <div className="p-6">
        <ErrorMessage
          title="Failed to load faculty dashboard"
          message={getApiErrorMessage(summaryError)}
          onRetry={() => refetchSummary()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={summary?.faculty_name ? `Welcome, Prof. ${summary.faculty_name}` : 'Faculty Dashboard'}
        description={`${summary?.department_name || 'Academic'} Department • Course Instruction & Attendance Workspace`}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            <BookMarked className="w-3.5 h-3.5" />
            FACULTY PORTAL
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/faculty/lectures">
              <Button variant="outline" size="sm" leftIcon={<CalendarDays className="w-4 h-4" />}>
                My Lectures
              </Button>
            </Link>
            <Link to="/faculty/attendance">
              <Button variant="primary" size="sm" leftIcon={<CheckSquare className="w-4 h-4" />}>
                Mark Attendance
              </Button>
            </Link>
          </div>
        }
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assigned Courses */}
        <Card className="relative overflow-hidden border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Teaching Courses
            </p>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <BookMarked className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {summary?.total_teaching_assignments ?? 0}
            </h3>
            <span className="text-xs text-slate-500">active sections</span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Serving {summary?.total_students_across_active_classes ?? 0} enrolled students
          </p>
        </Card>

        {/* Total Lectures */}
        <Card className="relative overflow-hidden border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Lectures Conducted
            </p>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {summary?.total_lectures ?? 0}
            </h3>
            <span className="text-xs text-slate-500">total created</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-emerald-700 font-semibold">{summary?.submitted_lectures ?? 0} submitted</span>
            <span>•</span>
            <span className="text-amber-700 font-semibold">{summary?.draft_lectures ?? 0} draft</span>
          </div>
        </Card>

        {/* Overall Attendance Rate */}
        <Card className="relative overflow-hidden border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg Attendance Rate
            </p>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {summary?.overall_attendance_percentage != null
                ? `${summary.overall_attendance_percentage}%`
                : 'N/A'}
            </h3>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            {summary?.present_count ?? 0} Present / {summary?.absent_count ?? 0} Absent marks
          </p>
        </Card>

        {/* Pending Correction Requests */}
        <Card className="relative overflow-hidden border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Corrections
            </p>
            <div
              className={`p-2 rounded-xl ${
                (summary?.pending_correction_requests ?? 0) > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <FileEdit className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {summary?.pending_correction_requests ?? 0}
            </h3>
            <span className="text-xs text-slate-500">requests</span>
          </div>
          <div className="mt-2">
            {(summary?.pending_correction_requests ?? 0) > 0 ? (
              <Link
                to="/faculty/correction-requests"
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1"
              >
                Review requests now <ArrowRight className="w-3 h-3" />
              </Link>
            ) : (
              <span className="text-xs text-slate-500">All student disputes resolved</span>
            )}
          </div>
        </Card>
      </div>

      {/* Attendance Trends Bar Chart */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-sky-600" />
              Lecture Attendance Trends
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Attendance percentage over time for your submitted lectures
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
            <ErrorMessage message={getApiErrorMessage(trendsError, 'Failed to load attendance trends')} />
          </div>
        ) : trendData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6">
            <CalendarDays className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No trend data available</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Submit attendance for completed lectures to visualize attendance trends across time buckets.
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
                  fill="#0284c7"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Two Column Grid: Recent Lectures & Pending Corrections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Lectures */}
        <Card noPadding>
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-sky-600" />
                Recent & Upcoming Lectures
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Quick access to mark or review</p>
            </div>
            <Link
              to="/faculty/lectures"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLecturesLoading ? (
            <div className="p-8 flex justify-center">
              <LoadingSpinner size="sm" text="Loading lectures..." />
            </div>
          ) : !recentLectures?.items || recentLectures.items.length === 0 ? (
            <div className="p-8 text-center">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No lectures scheduled yet.</p>
              <Link to="/faculty/lectures" className="mt-3 inline-block">
                <Button variant="outline" size="sm">
                  Schedule Lecture
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentLectures.items.map((lec) => (
                <div key={lec.lecture_id} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                        {lec.subject_code} • {lec.subject_name}
                      </span>
                      <StatusBadge status={lec.lecture_status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span>{lec.class_name} (Div {lec.division})</span>
                      <span>•</span>
                      <span>{lec.lecture_date}</span>
                      <span>•</span>
                      <span>{lec.start_time.slice(0, 5)} - {lec.end_time.slice(0, 5)}</span>
                    </p>
                  </div>

                  <div>
                    {lec.lecture_status === 'DRAFT' ? (
                      <Link to={`/faculty/attendance?lecture_id=${lec.lecture_id}`}>
                        <Button variant="primary" size="sm" leftIcon={<CheckSquare className="w-3.5 h-3.5" />}>
                          Mark
                        </Button>
                      </Link>
                    ) : (
                      <Link to={`/faculty/attendance?lecture_id=${lec.lecture_id}`}>
                        <Button variant="outline" size="sm">
                          Roster
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pending Correction Requests */}
        <Card noPadding>
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-amber-600" />
                Correction Requests Queue
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Disputed attendance records awaiting review</p>
            </div>
            <Link
              to="/faculty/correction-requests"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isCorrectionsLoading ? (
            <div className="p-8 flex justify-center">
              <LoadingSpinner size="sm" text="Loading pending requests..." />
            </div>
          ) : !pendingCorrections?.items || pendingCorrections.items.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">All caught up!</p>
              <p className="text-xs text-slate-500 mt-0.5">No pending correction requests from students.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingCorrections.items.map((req) => (
                <div key={req.request_id} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                        {req.student_name} ({req.roll_number})
                      </span>
                      <StatusBadge status={req.request_status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {req.subject_code} • Lecture on {req.lecture_date}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 truncate italic">
                      &quot;{req.reason}&quot;
                    </p>
                  </div>

                  <Link to={`/faculty/correction-requests?request_id=${req.request_id}`}>
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default FacultyDashboardPage
