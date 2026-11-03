import React from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  Users,
  Briefcase,
  Building2,
  School,
  BookOpen,
  UserPlus,
  BookMarked,
  CalendarDays,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, Card } from '../../components/common'

export const AdminDashboardLanding: React.FC = () => {
  const { currentUser } = useAuth()

  const adminModules = [
    { label: 'Student Management', to: '/admin/students', icon: <Users className="w-5 h-5 text-indigo-600" />, desc: 'Manage student records, rolls, and active enrollment states.' },
    { label: 'Faculty Management', to: '/admin/faculty', icon: <Briefcase className="w-5 h-5 text-sky-600" />, desc: 'Configure faculty profiles, department associations, and accounts.' },
    { label: 'Departments', to: '/admin/departments', icon: <Building2 className="w-5 h-5 text-amber-600" />, desc: 'Manage academic departments and institutional divisions.' },
    { label: 'Academic Classes', to: '/admin/classes', icon: <School className="w-5 h-5 text-emerald-600" />, desc: 'Configure classes, semesters, sections, and class capacities.' },
    { label: 'Curriculum Subjects', to: '/admin/subjects', icon: <BookOpen className="w-5 h-5 text-violet-600" />, desc: 'Manage academic subjects, codes, and department semester credits.' },
    { label: 'Student Enrollments', to: '/admin/enrollments', icon: <UserPlus className="w-5 h-5 text-teal-600" />, desc: 'Enroll students into classes and track active rosters.' },
    { label: 'Teaching Assignments', to: '/admin/teaching-assignments', icon: <BookMarked className="w-5 h-5 text-blue-600" />, desc: 'Assign faculty members to subject courses and divisions.' },
    { label: 'Lecture Oversight', to: '/admin/lectures', icon: <CalendarDays className="w-5 h-5 text-purple-600" />, desc: 'Institutional lecture records, submitted attendance, and roster marks.' },
    { label: 'Attendance & Reports', to: '/admin/reports', icon: <BarChart3 className="w-5 h-5 text-rose-600" />, desc: 'Institutional analytics, department summaries, and low attendance alerts.' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${currentUser?.username || 'Administrator'}`}
        description="Admin Academic Operations & Institutional Oversight Portal."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Shield className="w-3.5 h-3.5" />
            ADMINISTRATOR
          </span>
        }
      />

      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Phase F2 Application Shell Active
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              You are signed in as an institutional administrator. The shared layout, navigation,
              and authenticated backend session are active. Interactive administration CRUD
              modules and reporting views will be connected in Phase F3.
            </p>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Available Administrative Modules (Phase F3+)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminModules.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                    {m.icon}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
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

export default AdminDashboardLanding

