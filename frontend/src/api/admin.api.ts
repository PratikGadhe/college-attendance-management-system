import apiClient from './axios'
import type {
  DashboardSummaryResponse,
  RecentLectureResponse,
  PendingCorrectionResponse,
  AttendanceDistributionResponse,
  AttendanceTrendsResponse,
  StudentCreateRequest,
  StudentUpdateRequest,
  StudentStatusUpdateRequest,
  StudentDetailResponse,
  StudentListResponse,
  FacultyCreateRequest,
  FacultyUpdateRequest,
  FacultyStatusUpdateRequest,
  FacultyDetailResponse,
  FacultyListResponse,
  DepartmentCreateRequest,
  DepartmentUpdateRequest,
  DepartmentDetailResponse,
  DepartmentListResponse,
  ClassCreateRequest,
  ClassUpdateRequest,
  ClassDetailResponse,
  ClassListResponse,
  SubjectCreateRequest,
  SubjectUpdateRequest,
  SubjectDetailResponse,
  SubjectListResponse,
  EnrollmentCreateRequest,
  EnrollmentStatusUpdateRequest,
  EnrollmentDetailResponse,
  EnrollmentListResponse,
  TeachingAssignmentCreateRequest,
  TeachingAssignmentUpdateRequest,
  TeachingAssignmentDetailResponse,
  TeachingAssignmentListResponse,
} from '../types/admin.types'
import type {
  DepartmentAttendanceReportResponse,
  DepartmentReportParams,
  ClassAttendanceReportResponse,
  ClassReportParams,
  SubjectAttendanceReportResponse,
  SubjectReportParams,
  FacultyAttendanceReportResponse,
  FacultyReportParams,
  StudentAttendanceReportResponse,
  StudentReportParams,
  LowAttendanceReportResponse,
  LowAttendanceReportParams,
  LectureReportResponse,
  LectureReportParams,
  DateRangeAttendanceReportResponse,
  DateRangeAttendanceReportParams,
} from '../types/reports.types'

export const adminApi = {
  // ==========================================
  // Dashboard APIs
  // ==========================================
  async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    const response = await apiClient.get<DashboardSummaryResponse>('/api/admin/dashboard/summary')
    return response.data
  },

  async getRecentLectures(limit = 10): Promise<RecentLectureResponse[]> {
    const response = await apiClient.get<RecentLectureResponse[]>('/api/admin/dashboard/recent-lectures', {
      params: { limit },
    })
    return response.data
  },

  async getPendingCorrections(limit = 10): Promise<PendingCorrectionResponse[]> {
    const response = await apiClient.get<PendingCorrectionResponse[]>('/api/admin/dashboard/pending-corrections', {
      params: { limit },
    })
    return response.data
  },

  async getAttendanceDistribution(): Promise<AttendanceDistributionResponse> {
    const response = await apiClient.get<AttendanceDistributionResponse>(
      '/api/admin/dashboard/attendance-distribution'
    )
    return response.data
  },

  async getAttendanceTrends(params?: {
    period?: 'daily' | 'weekly' | 'monthly'
    start_date?: string
    end_date?: string
  }): Promise<AttendanceTrendsResponse> {
    const response = await apiClient.get<AttendanceTrendsResponse>('/api/admin/dashboard/attendance-trends', {
      params,
    })
    return response.data
  },

  // ==========================================
  // Student Management APIs
  // ==========================================
  async getStudents(params?: {
    search?: string
    account_status?: string
    skip?: number
    limit?: number
  }): Promise<StudentListResponse> {
    const response = await apiClient.get<StudentListResponse>('/api/admin/students', { params })
    return response.data
  },

  async getStudentById(studentId: number): Promise<StudentDetailResponse> {
    const response = await apiClient.get<StudentDetailResponse>(`/api/admin/students/${studentId}`)
    return response.data
  },

  async createStudent(payload: StudentCreateRequest): Promise<StudentDetailResponse> {
    const response = await apiClient.post<StudentDetailResponse>('/api/admin/students', payload)
    return response.data
  },

  async updateStudent(studentId: number, payload: StudentUpdateRequest): Promise<StudentDetailResponse> {
    const response = await apiClient.put<StudentDetailResponse>(`/api/admin/students/${studentId}`, payload)
    return response.data
  },

  async updateStudentStatus(
    studentId: number,
    payload: StudentStatusUpdateRequest
  ): Promise<StudentDetailResponse> {
    const response = await apiClient.patch<StudentDetailResponse>(
      `/api/admin/students/${studentId}/status`,
      payload
    )
    return response.data
  },

  // ==========================================
  // Faculty Management APIs
  // ==========================================
  async getFaculty(params?: {
    search?: string
    account_status?: string
    department_id?: number
    skip?: number
    limit?: number
  }): Promise<FacultyListResponse> {
    const response = await apiClient.get<FacultyListResponse>('/api/admin/faculty', { params })
    return response.data
  },

  async getFacultyById(facultyId: number): Promise<FacultyDetailResponse> {
    const response = await apiClient.get<FacultyDetailResponse>(`/api/admin/faculty/${facultyId}`)
    return response.data
  },

  async createFaculty(payload: FacultyCreateRequest): Promise<FacultyDetailResponse> {
    const response = await apiClient.post<FacultyDetailResponse>('/api/admin/faculty', payload)
    return response.data
  },

  async updateFaculty(facultyId: number, payload: FacultyUpdateRequest): Promise<FacultyDetailResponse> {
    const response = await apiClient.put<FacultyDetailResponse>(`/api/admin/faculty/${facultyId}`, payload)
    return response.data
  },

  async updateFacultyStatus(
    facultyId: number,
    payload: FacultyStatusUpdateRequest
  ): Promise<FacultyDetailResponse> {
    const response = await apiClient.patch<FacultyDetailResponse>(
      `/api/admin/faculty/${facultyId}/status`,
      payload
    )
    return response.data
  },

  // ==========================================
  // Department Management APIs
  // ==========================================
  async getDepartments(params?: {
    search?: string
    skip?: number
    limit?: number
  }): Promise<DepartmentListResponse> {
    const response = await apiClient.get<DepartmentListResponse>('/api/admin/departments', { params })
    return response.data
  },

  async getDepartmentById(departmentId: number): Promise<DepartmentDetailResponse> {
    const response = await apiClient.get<DepartmentDetailResponse>(`/api/admin/departments/${departmentId}`)
    return response.data
  },

  async createDepartment(payload: DepartmentCreateRequest): Promise<DepartmentDetailResponse> {
    const response = await apiClient.post<DepartmentDetailResponse>('/api/admin/departments', payload)
    return response.data
  },

  async updateDepartment(
    departmentId: number,
    payload: DepartmentUpdateRequest
  ): Promise<DepartmentDetailResponse> {
    const response = await apiClient.put<DepartmentDetailResponse>(
      `/api/admin/departments/${departmentId}`,
      payload
    )
    return response.data
  },

  // ==========================================
  // Class Management APIs
  // ==========================================
  async getClasses(params?: {
    search?: string
    department_id?: number
    semester?: number
    skip?: number
    limit?: number
  }): Promise<ClassListResponse> {
    const response = await apiClient.get<ClassListResponse>('/api/admin/classes', { params })
    return response.data
  },

  async getClassById(classId: number): Promise<ClassDetailResponse> {
    const response = await apiClient.get<ClassDetailResponse>(`/api/admin/classes/${classId}`)
    return response.data
  },

  async createClass(payload: ClassCreateRequest): Promise<ClassDetailResponse> {
    const response = await apiClient.post<ClassDetailResponse>('/api/admin/classes', payload)
    return response.data
  },

  async updateClass(classId: number, payload: ClassUpdateRequest): Promise<ClassDetailResponse> {
    const response = await apiClient.put<ClassDetailResponse>(`/api/admin/classes/${classId}`, payload)
    return response.data
  },

  // ==========================================
  // Subject Management APIs
  // ==========================================
  async getSubjects(params?: {
    search?: string
    semester?: number
    skip?: number
    limit?: number
  }): Promise<SubjectListResponse> {
    const response = await apiClient.get<SubjectListResponse>('/api/admin/subjects', { params })
    return response.data
  },

  async getSubjectById(subjectId: number): Promise<SubjectDetailResponse> {
    const response = await apiClient.get<SubjectDetailResponse>(`/api/admin/subjects/${subjectId}`)
    return response.data
  },

  async createSubject(payload: SubjectCreateRequest): Promise<SubjectDetailResponse> {
    const response = await apiClient.post<SubjectDetailResponse>('/api/admin/subjects', payload)
    return response.data
  },

  async updateSubject(subjectId: number, payload: SubjectUpdateRequest): Promise<SubjectDetailResponse> {
    const response = await apiClient.put<SubjectDetailResponse>(`/api/admin/subjects/${subjectId}`, payload)
    return response.data
  },

  // ==========================================
  // Student Enrollment APIs
  // ==========================================
  async getEnrollments(params?: {
    class_id?: number
    student_id?: number
    enrollment_status?: string
    search?: string
    skip?: number
    limit?: number
  }): Promise<EnrollmentListResponse> {
    const response = await apiClient.get<EnrollmentListResponse>('/api/admin/enrollments', { params })
    return response.data
  },

  async getEnrollmentById(enrollmentId: number): Promise<EnrollmentDetailResponse> {
    const response = await apiClient.get<EnrollmentDetailResponse>(`/api/admin/enrollments/${enrollmentId}`)
    return response.data
  },

  async createEnrollment(payload: EnrollmentCreateRequest): Promise<EnrollmentDetailResponse> {
    const response = await apiClient.post<EnrollmentDetailResponse>('/api/admin/enrollments', payload)
    return response.data
  },

  async updateEnrollmentStatus(
    enrollmentId: number,
    payload: EnrollmentStatusUpdateRequest
  ): Promise<EnrollmentDetailResponse> {
    const response = await apiClient.patch<EnrollmentDetailResponse>(
      `/api/admin/enrollments/${enrollmentId}/status`,
      payload
    )
    return response.data
  },

  // ==========================================
  // Teaching Assignment APIs
  // ==========================================
  async getTeachingAssignments(params?: {
    faculty_id?: number
    class_id?: number
    subject_id?: number
    skip?: number
    limit?: number
  }): Promise<TeachingAssignmentListResponse> {
    const response = await apiClient.get<TeachingAssignmentListResponse>(
      '/api/admin/teaching-assignments',
      { params }
    )
    return response.data
  },

  async getTeachingAssignmentById(assignmentId: number): Promise<TeachingAssignmentDetailResponse> {
    const response = await apiClient.get<TeachingAssignmentDetailResponse>(
      `/api/admin/teaching-assignments/${assignmentId}`
    )
    return response.data
  },

  async createTeachingAssignment(
    payload: TeachingAssignmentCreateRequest
  ): Promise<TeachingAssignmentDetailResponse> {
    const response = await apiClient.post<TeachingAssignmentDetailResponse>(
      '/api/admin/teaching-assignments',
      payload
    )
    return response.data
  },

  async updateTeachingAssignment(
    assignmentId: number,
    payload: TeachingAssignmentUpdateRequest
  ): Promise<TeachingAssignmentDetailResponse> {
    const response = await apiClient.put<TeachingAssignmentDetailResponse>(
      `/api/admin/teaching-assignments/${assignmentId}`,
      payload
    )
    return response.data
  },

  async deleteTeachingAssignment(assignmentId: number): Promise<void> {
    await apiClient.delete(`/api/admin/teaching-assignments/${assignmentId}`)
  },

  // ==========================================
  // Institutional Reports APIs (Phase F6)
  // ==========================================
  async getDepartmentReport(
    params?: DepartmentReportParams
  ): Promise<DepartmentAttendanceReportResponse> {
    const response = await apiClient.get<DepartmentAttendanceReportResponse>(
      '/api/admin/reports/departments',
      { params }
    )
    return response.data
  },

  async getClassReport(params?: ClassReportParams): Promise<ClassAttendanceReportResponse> {
    const response = await apiClient.get<ClassAttendanceReportResponse>(
      '/api/admin/reports/classes',
      { params }
    )
    return response.data
  },

  async getSubjectReport(params?: SubjectReportParams): Promise<SubjectAttendanceReportResponse> {
    const response = await apiClient.get<SubjectAttendanceReportResponse>(
      '/api/admin/reports/subjects',
      { params }
    )
    return response.data
  },

  async getFacultyReport(params?: FacultyReportParams): Promise<FacultyAttendanceReportResponse> {
    const response = await apiClient.get<FacultyAttendanceReportResponse>(
      '/api/admin/reports/faculty',
      { params }
    )
    return response.data
  },

  async getStudentReport(params?: StudentReportParams): Promise<StudentAttendanceReportResponse> {
    const response = await apiClient.get<StudentAttendanceReportResponse>(
      '/api/admin/reports/students',
      { params }
    )
    return response.data
  },

  async getLowAttendanceReport(
    params?: LowAttendanceReportParams
  ): Promise<LowAttendanceReportResponse> {
    const response = await apiClient.get<LowAttendanceReportResponse>(
      '/api/admin/reports/low-attendance',
      { params }
    )
    return response.data
  },

  async getLectureReport(params?: LectureReportParams): Promise<LectureReportResponse> {
    const response = await apiClient.get<LectureReportResponse>(
      '/api/admin/reports/lectures',
      { params }
    )
    return response.data
  },

  async getDateRangeAttendanceReport(
    params?: DateRangeAttendanceReportParams
  ): Promise<DateRangeAttendanceReportResponse> {
    const response = await apiClient.get<DateRangeAttendanceReportResponse>(
      '/api/admin/reports/attendance',
      { params }
    )
    return response.data
  },
}

export default adminApi
