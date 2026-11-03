import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Shield,
  ArrowRight,
  UserCheck,
  BookOpen,
  Info,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, ErrorMessage } from '../../components/common'
import { getApiErrorMessage } from '../../api/axios'

interface DemoAccountGroup {
  roleLabel: string
  roleName: 'ADMIN' | 'FACULTY' | 'STUDENT'
  badgeBg: string
  usernames: string[]
}

const DEMO_GROUPS: DemoAccountGroup[] = [
  {
    roleLabel: 'Administrator',
    roleName: 'ADMIN',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    usernames: ['admin'],
  },
  {
    roleLabel: 'Faculty Members',
    roleName: 'FACULTY',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
    usernames: ['faculty1', 'faculty2'],
  },
  {
    roleLabel: 'Students',
    roleName: 'STUDENT',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    usernames: [
      'student01',
      'student02',
      'student03',
      'student04',
      'student05',
      'student06',
      'student07',
      'student08',
      'student09',
      'student10',
      'student11',
      'student12',
    ],
  },
]

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated, role } = useAuth()

  const [username, setUsername] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && role) {
      const redirectPath =
        role === 'ADMIN' ? '/admin' : role === 'FACULTY' ? '/faculty' : '/student'
      navigate(redirectPath, { replace: true })
    }
  }, [isAuthenticated, role, navigate])

  const handleLogin = async (e?: React.FormEvent, customUsername?: string) => {
    if (e) e.preventDefault()
    const targetUsername = (customUsername ?? username).trim()

    if (!targetUsername) {
      setErrorMessage('Please enter a valid demo username.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const user = await login(targetUsername)
      const targetRoute =
        user.role === 'ADMIN'
          ? '/admin'
          : user.role === 'FACULTY'
          ? '/faculty'
          : '/student'
      navigate(targetRoute, { replace: true })
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err, 'Failed to authenticate demo user.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectDemoAccount = (selectedUsername: string) => {
    setUsername(selectedUsername)
    setErrorMessage(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Banner */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-slate-900 tracking-tight block">
              College Attendance Management System
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              Prototype Authentication Portal
            </span>
          </div>
        </div>
        <div className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          <span>Development Identity Mode</span>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="max-w-4xl mx-auto w-full my-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Login Form */}
          <div className="md:col-span-6 bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200">
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Sign In to Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Enter your assigned college username to continue
              </p>
            </div>

            {errorMessage && (
              <ErrorMessage
                message={errorMessage}
                onDismiss={() => setErrorMessage(null)}
                className="mb-5"
              />
            )}

            <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
              <Input
                label="Username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (errorMessage) setErrorMessage(null)
                }}
                placeholder="e.g. admin, faculty1, student01"
                leftIcon={<UserCheck className="w-4 h-4" />}
                required
                disabled={isSubmitting}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Enter Portal
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Prototype authentication uses backend database identity verification via{' '}
                <code className="font-mono text-[11px] bg-white px-1 py-0.5 rounded border border-slate-200">
                  X-Demo-User-ID
                </code>
                . No password required for development.
              </p>
            </div>
          </div>

          {/* Right Column: Demo Account Selector */}
          <div className="md:col-span-6 space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Quick Demo Accounts
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Select an account below to populate the username automatically:
              </p>

              <div className="space-y-4">
                {DEMO_GROUPS.map((group) => (
                  <div key={group.roleName} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        {group.roleLabel}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${group.badgeBg}`}
                      >
                        {group.roleName}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {group.usernames.map((u) => {
                        const isSelected = username === u
                        return (
                          <button
                            key={u}
                            type="button"
                            onClick={() => handleSelectDemoAccount(u)}
                            className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            {u}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center py-3 border-t border-slate-200 text-xs text-slate-400">
        <span>College Attendance Management System • Phase F2 Shared UI & Authentication</span>
      </footer>
    </div>
  )
}

export default LoginPage

