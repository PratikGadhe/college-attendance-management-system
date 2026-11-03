import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  School,
  BookOpen,
  UserPlus,
  BookMarked,
  CalendarDays,
  CheckSquare,
  History,
  FileEdit,
  BarChart3,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../types/auth.types'

export interface NavItemConfig {
  label: string
  to: string
  icon: React.ReactNode
  exact?: boolean
}

export interface SidebarProps {
  isMobileOpen: boolean
  onCloseMobile: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export const getNavItemsForRole = (role: UserRole | null): NavItemConfig[] => {
  if (role === 'ADMIN') {
    return [
      { label: 'Dashboard', to: '/admin', icon: <LayoutDashboard className="w-5 h-5" />, exact: true },
      { label: 'Students', to: '/admin/students', icon: <Users className="w-5 h-5" /> },
      { label: 'Faculty', to: '/admin/faculty', icon: <Briefcase className="w-5 h-5" /> },
      { label: 'Departments', to: '/admin/departments', icon: <Building2 className="w-5 h-5" /> },
      { label: 'Classes', to: '/admin/classes', icon: <School className="w-5 h-5" /> },
      { label: 'Subjects', to: '/admin/subjects', icon: <BookOpen className="w-5 h-5" /> },
      { label: 'Enrollments', to: '/admin/enrollments', icon: <UserPlus className="w-5 h-5" /> },
      { label: 'Teaching Assign.', to: '/admin/teaching-assignments', icon: <BookMarked className="w-5 h-5" /> },
      { label: 'Lectures', to: '/admin/lectures', icon: <CalendarDays className="w-5 h-5" /> },
      { label: 'Reports', to: '/admin/reports', icon: <BarChart3 className="w-5 h-5" /> },
    ]
  }

  if (role === 'FACULTY') {
    return [
      { label: 'Dashboard', to: '/faculty', icon: <LayoutDashboard className="w-5 h-5" />, exact: true },
      { label: 'Teaching Assign.', to: '/faculty/teaching-assignments', icon: <BookMarked className="w-5 h-5" /> },
      { label: 'Lectures', to: '/faculty/lectures', icon: <CalendarDays className="w-5 h-5" /> },
      { label: 'Attendance', to: '/faculty/attendance', icon: <CheckSquare className="w-5 h-5" /> },
      { label: 'Correction Req.', to: '/faculty/correction-requests', icon: <FileEdit className="w-5 h-5" /> },
      { label: 'Reports', to: '/faculty/reports', icon: <BarChart3 className="w-5 h-5" /> },
    ]
  }

  if (role === 'STUDENT') {
    return [
      { label: 'Dashboard', to: '/student', icon: <LayoutDashboard className="w-5 h-5" />, exact: true },
      { label: 'Subject Attendance', to: '/student/attendance', icon: <CheckSquare className="w-5 h-5" /> },
      { label: 'Attendance History', to: '/student/history', icon: <History className="w-5 h-5" /> },
      { label: 'Correction Req.', to: '/student/correction-requests', icon: <FileEdit className="w-5 h-5" /> },
    ]
  }

  return []
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { role } = useAuth()
  const navItems = getNavItemsForRole(role)

  const roleLabels: Record<string, { title: string; badge: string; badgeBg: string }> = {
    ADMIN: { title: 'Admin Portal', badge: 'ADMINISTRATOR', badgeBg: 'bg-indigo-100 text-indigo-800' },
    FACULTY: { title: 'Faculty Portal', badge: 'FACULTY', badgeBg: 'bg-sky-100 text-sky-800' },
    STUDENT: { title: 'Student Portal', badge: 'STUDENT', badgeBg: 'bg-emerald-100 text-emerald-800' },
  }

  const roleMeta = role ? roleLabels[role] : { title: 'College Portal', badge: 'PORTAL', badgeBg: 'bg-slate-100 text-slate-800' }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 ease-in-out border-r border-slate-800
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Branding & Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-sm text-white tracking-tight truncate">
                  Attendance MS
                </span>
                <span className="text-[11px] font-semibold text-slate-400 truncate">
                  {roleMeta.title}
                </span>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal Role Badge */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-4 py-2.5 bg-slate-800/40 border-b border-slate-800/50 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Authenticated Role
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${roleMeta.badgeBg}`}>
              {roleMeta.badge}
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onCloseMobile}
              title={isCollapsed && !isMobileOpen ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : ''}`
              }
            >
              <span className="shrink-0">{item.icon}</span>
              {(!isCollapsed || isMobileOpen) && (
                <span className="truncate">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Collapse Toggle */}
        <div className="hidden md:flex items-center justify-end p-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs gap-2"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

