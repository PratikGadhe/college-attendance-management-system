import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingScreen } from '../components/common'
import { AppLayout, ProtectedRoute, RoleGuard } from '../components/layout'
import { LoginPage } from '../features/auth'
import {
  AdminDashboardPage,
  StudentListPage,
  FacultyListPage,
  DepartmentListPage,
  ClassListPage,
  SubjectListPage,
  EnrollmentListPage,
  TeachingAssignmentListPage,
  AdminReportsPage,
  AdminLectureOversightPage,
} from '../features/admin'
import {
  FacultyDashboardPage,
  FacultyTeachingAssignmentsPage,
  LectureListPage,
  AttendanceMarkingPage,
  CorrectionRequestListPage,
  FacultyReportsPage,
} from '../features/faculty'
import {
  StudentDashboardPage,
  StudentSubjectAttendancePage,
  StudentAttendanceHistoryPage,
  StudentCorrectionRequestsPage,
} from '../features/student'

/**
 * Root Index Redirection Component.
 * Intelligently directs users based on their active authenticated role.
 */
const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading, role } = useAuth()

  if (isLoading) {
    return <LoadingScreen message="Initializing application..." />
  }

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />
  }

  if (role === 'ADMIN') return <Navigate to="/admin" replace />
  if (role === 'FACULTY') return <Navigate to="/faculty" replace />
  if (role === 'STUDENT') return <Navigate to="/student" replace />

  return <Navigate to="/login" replace />
}

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Root Route */}
      <Route path="/" element={<RootRedirect />} />

      {/* Protected Layout Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Admin Portal Routes */}
          <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/students" element={<StudentListPage />} />
            <Route path="/admin/faculty" element={<FacultyListPage />} />
            <Route path="/admin/departments" element={<DepartmentListPage />} />
            <Route path="/admin/classes" element={<ClassListPage />} />
            <Route path="/admin/subjects" element={<SubjectListPage />} />
            <Route path="/admin/enrollments" element={<EnrollmentListPage />} />
            <Route path="/admin/teaching-assignments" element={<TeachingAssignmentListPage />} />
            <Route path="/admin/lectures" element={<AdminLectureOversightPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/reports/:tab" element={<AdminReportsPage />} />
          </Route>

          {/* Faculty Portal Routes */}
          <Route element={<RoleGuard allowedRoles={['FACULTY']} />}>
            <Route path="/faculty" element={<FacultyDashboardPage />} />
            <Route
              path="/faculty/teaching-assignments"
              element={<FacultyTeachingAssignmentsPage />}
            />
            <Route path="/faculty/lectures" element={<LectureListPage />} />
            <Route path="/faculty/attendance" element={<AttendanceMarkingPage />} />
            <Route
              path="/faculty/correction-requests"
              element={<CorrectionRequestListPage />}
            />
            <Route path="/faculty/reports" element={<FacultyReportsPage />} />
          </Route>

          {/* Student Portal Routes */}
          <Route element={<RoleGuard allowedRoles={['STUDENT']} />}>
            <Route path="/student" element={<StudentDashboardPage />} />
            <Route path="/student/attendance" element={<StudentSubjectAttendancePage />} />
            <Route path="/student/history" element={<StudentAttendanceHistoryPage />} />
            <Route
              path="/student/correction-requests"
              element={<StudentCorrectionRequestsPage />}
            />
          </Route>
        </Route>
      </Route>

      {/* Catch-all 404 route: redirect to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRouter
