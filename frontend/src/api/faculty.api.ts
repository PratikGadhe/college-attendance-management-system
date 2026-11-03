/**
 * Faculty API Service.
 * Centralized Axios-based client for Faculty operations, course instruction,
 * lecture scheduling, attendance roster marking, submission, and correction reviews.
 */

import apiClient from './axios'
import type {
  FacultyDashboardSummaryResponse,
  FacultyAttendanceTrendsResponse,
  FacultyTeachingAssignmentListResponse,
  FacultyLectureListResponse,
  LectureDetailResponse,
  LectureCreateRequest,
  LectureUpdateRequest,
  LectureFilterParams,
  LectureAttendanceRosterResponse,
  AttendanceMarkRequest,
  LectureSubmissionResponse,
  CorrectionRequestListResponse,
  CorrectionRequestDetailResponse,
  CorrectionRequestReviewRequest,
  CorrectionRequestFilterParams,
  FacultyPerformanceReportResponse,
  FacultyStudentAttendanceResponse,
  FacultyStudentReportFilterParams,
} from '../types/faculty.types'

export const facultyApi = {
  // ==========================================
  // Dashboard & Metrics
  // ==========================================

  getDashboardSummary: async (): Promise<FacultyDashboardSummaryResponse> => {
    const response = await apiClient.get<FacultyDashboardSummaryResponse>('/api/faculty/dashboard/summary')
    return response.data
  },

  getAttendanceTrends: async (params?: {
    period?: 'daily' | 'weekly' | 'monthly' | string
    start_date?: string
    end_date?: string
  }): Promise<FacultyAttendanceTrendsResponse> => {
    const response = await apiClient.get<FacultyAttendanceTrendsResponse>(
      '/api/faculty/dashboard/attendance-trends',
      { params }
    )
    return response.data
  },

  // ==========================================
  // Teaching Assignments
  // ==========================================

  getTeachingAssignments: async (): Promise<FacultyTeachingAssignmentListResponse> => {
    const response = await apiClient.get<FacultyTeachingAssignmentListResponse>(
      '/api/faculty/teaching-assignments'
    )
    return response.data
  },

  // ==========================================
  // Lectures Management
  // ==========================================

  getLectures: async (params?: LectureFilterParams): Promise<FacultyLectureListResponse> => {
    const response = await apiClient.get<FacultyLectureListResponse>('/api/faculty/lectures', { params })
    return response.data
  },

  getLectureDetails: async (lectureId: number): Promise<LectureDetailResponse> => {
    const response = await apiClient.get<LectureDetailResponse>(`/api/faculty/lectures/${lectureId}`)
    return response.data
  },

  createLecture: async (data: LectureCreateRequest): Promise<LectureDetailResponse> => {
    const response = await apiClient.post<LectureDetailResponse>('/api/faculty/lectures', data)
    return response.data
  },

  updateLecture: async (lectureId: number, data: LectureUpdateRequest): Promise<LectureDetailResponse> => {
    const response = await apiClient.put<LectureDetailResponse>(`/api/faculty/lectures/${lectureId}`, data)
    return response.data
  },

  cancelLecture: async (lectureId: number): Promise<LectureDetailResponse> => {
    const response = await apiClient.patch<LectureDetailResponse>(`/api/faculty/lectures/${lectureId}/cancel`)
    return response.data
  },

  // ==========================================
  // Attendance Roster & Marking
  // ==========================================

  getLectureRoster: async (lectureId: number): Promise<LectureAttendanceRosterResponse> => {
    const response = await apiClient.get<LectureAttendanceRosterResponse>(
      `/api/faculty/lectures/${lectureId}/roster`
    )
    return response.data
  },

  saveAttendance: async (
    lectureId: number,
    data: AttendanceMarkRequest
  ): Promise<LectureAttendanceRosterResponse> => {
    const response = await apiClient.put<LectureAttendanceRosterResponse>(
      `/api/faculty/lectures/${lectureId}/attendance`,
      data
    )
    return response.data
  },

  submitAttendance: async (lectureId: number): Promise<LectureSubmissionResponse> => {
    const response = await apiClient.post<LectureSubmissionResponse>(
      `/api/faculty/lectures/${lectureId}/submit`
    )
    return response.data
  },

  // ==========================================
  // Correction Requests Review
  // ==========================================

  getCorrectionRequests: async (
    params?: CorrectionRequestFilterParams
  ): Promise<CorrectionRequestListResponse> => {
    const response = await apiClient.get<CorrectionRequestListResponse>(
      '/api/faculty/correction-requests',
      { params }
    )
    return response.data
  },

  getCorrectionRequestDetails: async (requestId: number): Promise<CorrectionRequestDetailResponse> => {
    const response = await apiClient.get<CorrectionRequestDetailResponse>(
      `/api/faculty/correction-requests/${requestId}`
    )
    return response.data
  },

  reviewCorrectionRequest: async (
    requestId: number,
    data: CorrectionRequestReviewRequest
  ): Promise<CorrectionRequestDetailResponse> => {
    const response = await apiClient.patch<CorrectionRequestDetailResponse>(
      `/api/faculty/correction-requests/${requestId}/review`,
      data
    )
    return response.data
  },

  // ==========================================
  // Faculty Performance Reports
  // ==========================================

  getPerformanceReport: async (params?: {
    skip?: number
    limit?: number
  }): Promise<FacultyPerformanceReportResponse> => {
    const response = await apiClient.get<FacultyPerformanceReportResponse>(
      '/api/faculty/reports/performance',
      { params }
    )
    return response.data
  },

  getStudentAttendanceReport: async (
    params?: FacultyStudentReportFilterParams
  ): Promise<FacultyStudentAttendanceResponse> => {
    const response = await apiClient.get<FacultyStudentAttendanceResponse>(
      '/api/faculty/reports/students',
      { params }
    )
    return response.data
  },
}

export default facultyApi
