import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Building2,
  School,
  BookOpen,
  Briefcase,
  Users,
  CalendarDays,
  TrendingUp,
} from 'lucide-react'
import { PageHeader } from '../../../components/common'
import { DepartmentReportTab } from './DepartmentReportTab'
import { ClassReportTab } from './ClassReportTab'
import { SubjectReportTab } from './SubjectReportTab'
import { FacultyReportTab } from './FacultyReportTab'
import { StudentReportTab } from './StudentReportTab'
import { LectureReportTab } from './LectureReportTab'
import { DateRangePerformanceTab } from './DateRangePerformanceTab'

export type ReportTabKey =
  | 'departments'
  | 'classes'
  | 'subjects'
  | 'faculty'
  | 'students'
  | 'lectures'
  | 'performance'

export const AdminReportsPage: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>()
  const navigate = useNavigate()

  const validTabs: ReportTabKey[] = [
    'departments',
    'classes',
    'subjects',
    'faculty',
    'students',
    'lectures',
    'performance',
  ]

  const initialTab: ReportTabKey =
    tab && validTabs.includes(tab as ReportTabKey) ? (tab as ReportTabKey) : 'departments'

  const [activeTab, setActiveTab] = useState<ReportTabKey>(initialTab)

  useEffect(() => {
    if (tab && validTabs.includes(tab as ReportTabKey)) {
      setActiveTab(tab as ReportTabKey)
    }
  }, [tab])

  const handleTabChange = (newTab: ReportTabKey) => {
    setActiveTab(newTab)
    navigate(`/admin/reports/${newTab}`)
  }

  const tabsConfig = [
    { id: 'departments', label: 'Departments', icon: <Building2 className="w-4 h-4" /> },
    { id: 'classes', label: 'Classes', icon: <School className="w-4 h-4" /> },
    { id: 'subjects', label: 'Subjects', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'faculty', label: 'Faculty Workload', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'students', label: 'Students & Defaulters', icon: <Users className="w-4 h-4" /> },
    { id: 'lectures', label: 'Lecture Audit Log', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'performance', label: 'Performance Analytics', icon: <TrendingUp className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Attendance Reports"
        description="Comprehensive attendance analytics, department audits, low-attendance alerts, and data exports."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <BarChart3 className="w-3.5 h-3.5" />
            ADMIN AUDIT & ANALYTICS
          </span>
        }
      />

      {/* Tabs navigation */}
      <div className="overflow-x-auto border-b border-slate-200 scrollbar-none">
        <div className="flex items-center gap-1 pb-px min-w-max">
          {tabsConfig.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTabChange(t.id as ReportTabKey)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 -mb-px ${
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panes */}
      <div>
        {activeTab === 'departments' && <DepartmentReportTab />}
        {activeTab === 'classes' && <ClassReportTab />}
        {activeTab === 'subjects' && <SubjectReportTab />}
        {activeTab === 'faculty' && <FacultyReportTab />}
        {activeTab === 'students' && <StudentReportTab />}
        {activeTab === 'lectures' && <LectureReportTab />}
        {activeTab === 'performance' && <DateRangePerformanceTab />}
      </div>
    </div>
  )
}
export default AdminReportsPage

