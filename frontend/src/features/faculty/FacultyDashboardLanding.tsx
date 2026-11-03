import React from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  BookMarked,
  CalendarDays,
  CheckSquare,
  FileEdit,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, Card } from '../../components/common'

export const FacultyDashboardLanding: React.FC = () => {
  const { currentUser } = useAuth()

  const facultyModules = [
    { label: 'Teaching Assignments', to: '/faculty/teaching-assignments', icon: <BookMarked className="w-5 h-5 text-indigo-600" />, desc: 'Review assigned academic courses, subjects, and division schedules.' },
    { label: 'Lecture Management', to: '/faculty/lectures', icon: <CalendarDays className="w-5 h-5 text-sky-600" />, desc: 'Create draft lectures, update schedules, and track submission statuses.' },
    { label: 'Attendance Marking', to: '/faculty/attendance', icon: <CheckSquare className="w-5 h-5 text-emerald-600" />, desc: 'Mark student attendance on class rosters and submit records atomically.' },
    { label: 'Correction Requests', to: '/faculty/correction-requests', icon: <FileEdit className="w-5 h-5 text-amber-600" />, desc: 'Review student attendance disputes and approve or reject with audit trail.' },
    { label: 'Performance & Reports', to: '/faculty/reports', icon: <BarChart3 className="w-5 h-5 text-purple-600" />, desc: 'Track class attendance trends and student subject performance.' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${currentUser?.username || 'Faculty Member'}`}
        description="Faculty Course Instruction & Attendance Management Portal."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            <Briefcase className="w-3.5 h-3.5" />
            FACULTY
          </span>
        }
      />

      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Faculty Workspace Initialized
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              You are signed in to the Faculty Portal. The shared layout, navigation, and role-based
              security boundaries are active. Course lecture creation, attendance rosters, and
              correction reviews will be fully operational in Phase F4.
            </p>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Faculty Teaching Operations (Phase F4+)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {facultyModules.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-sky-50 transition-colors">
                    {m.icon}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{m.label}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FacultyDashboardLanding

