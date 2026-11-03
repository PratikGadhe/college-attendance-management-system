import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  BookOpen,
  Users,
  Search,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
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
import type { FacultyTeachingAssignmentResponse } from '../../../types/faculty.types'
import {
  PageHeader,
  Card,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
} from '../../../components/common'
import { Pagination } from '../../../components/tables/Pagination'

export const FacultyReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'students' | 'trends'>('courses')

  // Teaching assignments for dropdown
  const { data: assignmentsData } = useQuery({
    queryKey: ['faculty', 'teaching-assignments'],
    queryFn: () => facultyApi.getTeachingAssignments(),
  })
  const assignments: FacultyTeachingAssignmentResponse[] = assignmentsData?.items || []

  // Tab 1: Course Performance
  const [courseSkip, setCourseSkip] = useState(0)
  const courseLimit = 10
  const {
    data: performanceData,
    isLoading: isPerfLoading,
    error: perfError,
    refetch: refetchPerf,
  } = useQuery({
    queryKey: ['faculty', 'reports', 'performance', { skip: courseSkip, limit: courseLimit }],
    queryFn: () => facultyApi.getPerformanceReport({ skip: courseSkip, limit: courseLimit }),
    enabled: activeTab === 'courses',
  })

  // Tab 2: Student Attendance
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | ''>('')
  const [studentSkip, setStudentSkip] = useState(0)
  const studentLimit = 15
  const {
    data: studentData,
    isLoading: isStudentLoading,
    error: studentError,
    refetch: refetchStudent,
  } = useQuery({
    queryKey: [
      'faculty',
      'reports',
      'students',
      {
        assignment_id: selectedAssignmentId || undefined,
        search: studentSearch.trim() || undefined,
        skip: studentSkip,
        limit: studentLimit,
      },
    ],
    queryFn: () =>
      facultyApi.getStudentAttendanceReport({
        assignment_id: selectedAssignmentId ? Number(selectedAssignmentId) : undefined,
        search: studentSearch.trim() || undefined,
        skip: studentSkip,
        limit: studentLimit,
      }),
    enabled: activeTab === 'students',
  })

  // Tab 3: Trends
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const {
    data: trendsData,
    isLoading: isTrendsLoading,
    error: trendsError,
  } = useQuery({
    queryKey: ['faculty', 'reports', 'trends', trendPeriod],
    queryFn: () => facultyApi.getAttendanceTrends({ period: trendPeriod }),
    enabled: activeTab === 'trends',
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Academic Reports"
        description="Comprehensive attendance analytics, section-wise performance, and student tracking."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <BarChart3 className="w-3.5 h-3.5" />
            ANALYTICS & METRICS
          </span>
        }
      />

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'courses', label: 'Course Performance', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'students', label: 'Student Attendance Tracking', icon: <Users className="w-4 h-4" /> },
          { id: 'trends', label: 'Attendance Trends', icon: <TrendingUp className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Course Performance */}
      {activeTab === 'courses' && (
        <Card noPadding>
          {isPerfLoading ? (
            <div className="p-16 flex justify-center">
              <LoadingSpinner size="lg" text="Loading course performance metrics..." />
            </div>
          ) : perfError ? (
            <div className="p-8">
              <ErrorMessage
                title="Failed to load performance report"
                message={getApiErrorMessage(perfError)}
                onRetry={() => refetchPerf()}
              />
            </div>
          ) : !performanceData?.items || performanceData.items.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<BookOpen className="w-8 h-8" />}
                title="No Course Data Available"
                description="No submitted lecture records found for your assigned courses yet."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Class & Div</th>
                    <th className="py-3.5 px-4 text-center">Submitted Lectures</th>
                    <th className="py-3.5 px-4 text-center">Enrolled Students</th>
                    <th className="py-3.5 px-4 text-center">Present / Absent</th>
                    <th className="py-3.5 px-4 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {performanceData.items.map((item) => {
                    const isGood = item.attendance_percentage >= 75
                    return (
                      <tr key={item.assignment_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 mr-2">
                            {item.subject_code}
                          </span>
                          {item.subject_name}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.class_name} (Div {item.division})
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-900">
                          {item.total_submitted_lectures}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-900">
                          {item.total_students}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="text-emerald-700 font-bold">{item.present_count}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-rose-700 font-bold">{item.absent_count}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              isGood
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.attendance_percentage}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {performanceData && performanceData.total > courseLimit && (
            <div className="border-t border-slate-100">
              <Pagination
                skip={courseSkip}
                limit={courseLimit}
                total={performanceData.total}
                onPageChange={(newSkip) => setCourseSkip(newSkip)}
              />
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: Student Attendance Tracking */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card noPadding className="p-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value)
                    setStudentSkip(0)
                  }}
                  placeholder="Search students by name or roll number..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                />
              </div>

              <div className="w-full sm:w-64">
                <select
                  value={selectedAssignmentId}
                  onChange={(e) => {
                    setSelectedAssignmentId(e.target.value ? Number(e.target.value) : '')
                    setStudentSkip(0)
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                >
                  <option value="">All Assigned Courses</option>
                  {assignments.map((a) => (
                    <option key={a.assignment_id} value={a.assignment_id}>
                      {a.subject_code} • {a.class_name} ({a.division})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Student Table */}
          <Card noPadding>
            {isStudentLoading ? (
              <div className="p-16 flex justify-center">
                <LoadingSpinner size="lg" text="Loading student attendance data..." />
              </div>
            ) : studentError ? (
              <div className="p-8">
                <ErrorMessage
                  title="Failed to load student reports"
                  message={getApiErrorMessage(studentError)}
                  onRetry={() => refetchStudent()}
                />
              </div>
            ) : !studentData?.items || studentData.items.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<Users className="w-8 h-8" />}
                  title="No Student Records"
                  description={
                    studentSearch || selectedAssignmentId
                      ? 'No students found matching your search and filter criteria.'
                      : 'No student attendance records recorded yet.'
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3.5 px-4">Roll Number</th>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Class</th>
                      <th className="py-3.5 px-4">Course Subject</th>
                      <th className="py-3.5 px-4 text-center">Attended / Total</th>
                      <th className="py-3.5 px-4 text-right">Attendance Rate</th>
                      <th className="py-3.5 px-4 text-center">Eligibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {studentData.items.map((row, idx) => {
                      const isLow = row.attendance_percentage < 75
                      return (
                        <tr key={`${row.student_id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {row.roll_number}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-900">
                            {row.student_name}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                            {row.class_name}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                            {row.subject_name}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap font-medium">
                            <span className="text-emerald-700">{row.present_count}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span>{row.total_submitted_lectures}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                            {row.attendance_percentage}%
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Below 75%
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Eligible
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {studentData && studentData.total > studentLimit && (
              <div className="border-t border-slate-100">
                <Pagination
                  skip={studentSkip}
                  limit={studentLimit}
                  total={studentData.total}
                  onPageChange={(newSkip) => setStudentSkip(newSkip)}
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: Attendance Trends */}
      {activeTab === 'trends' && (
        <Card>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Chronological Attendance Trends</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Attendance rate percentages over time for your course lectures
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTrendPeriod(p)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all capitalize ${
                    trendPeriod === p
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
              <LoadingSpinner size="md" text="Loading trends..." />
            </div>
          ) : trendsError ? (
            <div className="h-64 flex items-center justify-center">
              <ErrorMessage message={getApiErrorMessage(trendsError)} />
            </div>
          ) : !trendsData?.items || trendsData.items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6">
              <CalendarDays className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No trend history available</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Conduct and submit course lectures to see chronological attendance patterns.
              </p>
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendsData.items}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
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
                    fill="#7c3aed"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default FacultyReportsPage
