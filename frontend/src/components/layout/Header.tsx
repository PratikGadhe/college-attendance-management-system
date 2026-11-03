import React, { useState } from 'react'
import { Menu, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../common/Avatar'
import ConfirmDialog from '../common/ConfirmDialog'

export interface HeaderProps {
  onOpenMobileSidebar: () => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar }) => {
  const { currentUser, role, logout } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false)
    logout()
  }

  const roleBadgeStyles: Record<string, string> = {
    ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    FACULTY: 'bg-sky-50 text-sky-700 border-sky-200',
    STUDENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  const roleStyle = role ? roleBadgeStyles[role] || 'bg-slate-100 text-slate-700 border-slate-200' : ''

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
        {/* Left: Mobile Toggle & System Label */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Open sidebar menu"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 hidden sm:inline">
              College Attendance Management System
            </span>
          </div>
        </div>

        {/* Right: User Profile & Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          {currentUser && (
            <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200">
              <Avatar name={currentUser.username} role={currentUser.role} size="md" />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                  {currentUser.username}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded border w-fit ${roleStyle}`}
                >
                  <Shield className="w-2.5 h-2.5" />
                  {currentUser.role}
                </span>
              </div>
            </div>
          )}

          {/* Logout Action */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            title="Log out of demo session"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Log out</span>
          </button>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to end your current demo session? You will be redirected to the login screen."
        confirmText="Log out"
        cancelText="Stay logged in"
        variant="destructive"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  )
}

export default Header

