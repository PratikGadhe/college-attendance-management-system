import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingUp,
  ShieldCheck,
  CalendarDays,
} from 'lucide-react'
import studentApi from '../../../api/student.api'
import { getApiErrorMessage } from '../../../api/axios'
import {
  PageHeader,
  Card,
  Button,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
} from '../../../components/common'

export const StudentSubjectAttendancePage: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['student', 'attendance-summary'],
    queryFn: () => studentApi.getAttendanceSummary(),
  })

  const subjects = data?.subjects || []
  const overallPercentage = data?.overall_percentage ?? 0
  const isOverallLow = overallPercentage < 75

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subject-wise Attendance"
        description="Detailed course breakdown and lecture attendance tracking for enrolled semester subjects."
        badge={
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${
              isOverallLow
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            CUMULATIVE: {overallPercentage}%
          </span>
        }
        actions={
          <Link to="/student/history">
            <Button variant="primary" size="sm" leftIcon={<History className="w-4 h-4" />}>
              Full History Log
            </Button>
          </Link>
        }
      />

      {/* Threshold Explanation Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs sm:text-sm text-slate-700">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Attendance calculations only incorporate finalized, submitted lectures. Draft or
          cancelled sessions are excluded from calculations. Academic regulations require a minimum
          threshold of <strong>75% attendance</strong> per course subject to qualify for final
          semester examinations.
        </p>
      </div>

      {/* Subject Cards */}
      {isLoading ? (
        <div className="p-16 flex justify-center">
          <LoadingSpinner size="lg" text="Loading subject attendance performance..." />
        </div>
      ) : error ? (
        <div className="p-6">
          <ErrorMessage
            title="Failed to load subject attendance"
            message={getApiErrorMessage(error)}
            onRetry={() => refetch()}
          />
        </div>
      ) : subjects.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen className="w-10 h-10" />}
            title="No Courses Enrolled"
            description="You do not have any enrolled courses with submitted attendance records yet."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subjects.map((sub) => {
            const isLow = sub.attendance_percentage < 75
            return (
              <Card
                key={sub.subject_id}
                className={`flex flex-col justify-between transition-all shadow-xs border ${
                  isLow ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Bar: Code, Name, Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                        {sub.subject_code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2 line-clamp-1">
                        {sub.subject_name}
                      </h3>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                        isLow
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isLow ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Debarment Risk
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Eligible
                        </>
                      )}
                    </span>
                  </div>

                  {/* Percentage & Progress Bar */}
                  <div className="my-4">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        Attendance Rate
                      </span>
                      <span
                        className={`text-xl font-extrabold ${
                          isLow ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {sub.attendance_percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLow ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, sub.attendance_percentage))}%` }}
                      />
                    </div>
                  </div>

                  {/* Lecture Stat Numbers */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-slate-100 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-50">
                      <span className="text-slate-400 block text-[11px]">Conducted</span>
                      <span className="font-bold text-slate-900 mt-0.5 block">
                        {sub.total_submitted_lectures}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
                      <span className="text-emerald-600 block text-[11px]">Attended</span>
                      <span className="font-bold mt-0.5 block">{sub.present_count}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-800">
                      <span className="text-rose-600 block text-[11px]">Missed</span>
                      <span className="font-bold mt-0.5 block">{sub.absent_count}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-4 mt-auto">
                  <Link to={`/student/history?subject_id=${sub.subject_id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      leftIcon={<CalendarDays className="w-3.5 h-3.5" />}
                    >
                      View Session History
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StudentSubjectAttendancePage
