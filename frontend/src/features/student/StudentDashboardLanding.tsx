import React from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  CheckSquare,
  History,
  FileEdit,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, Card } from '../../components/common'

export const StudentDashboardLanding: React.FC = () => {
  const { currentUser } = useAuth()

  const studentModules = [
    { label: 'Subject Attendance', to: '/student/attendance', icon: <CheckSquare className="w-5 h-5 text-emerald-600" />, desc: 'View current attendance percentages across all enrolled subjects.' },
    { label: 'Attendance History', to: '/student/history', icon: <History className="w-5 h-5 text-indigo-600" />, desc: 'Review individual submitted lecture records and timestamps.' },
    { label: 'Correction Requests', to: '/student/correction-requests', icon: <FileEdit className="w-5 h-5 text-amber-600" />, desc: 'Submit and track attendance correction requests to subject faculty.' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${currentUser?.username || 'Student'}`}
        description="Student Academic Attendance & Records Portal."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <GraduationCap className="w-3.5 h-3.5" />
            STUDENT
          </span>
        }
      />

      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Student Dashboard Initialized
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              You are signed in to the Student Portal. Personal attendance analytics, subject-wise
              breakdown, and correction request dispute workflows will be available in Phase F5.
            </p>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Student Academic Services (Phase F5+)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {studentModules.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                    {m.icon}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
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

export default StudentDashboardLanding

