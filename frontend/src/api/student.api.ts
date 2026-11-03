/**
 * Student API Service.
 * Centralized Axios-based client for Student operations:
 * - Personal dashboard and metrics
 * - Subject-wise attendance breakdown
 * - Chronological attendance trends
 * - Session attendance history and details
 * - Correction request dispute submission and tracking
 */

import apiClient from './axios'
import type {
  StudentDashboardSummaryResponse,
  StudentSubjectPerformanceResponse,
  StudentAttendanceTrendsResponse,
  StudentAttendanceSummaryResponse,
  StudentAttendanceHistoryResponse,
  StudentAttendanceRecordDetailResponse,
  StudentHistoryFilterParams,
  CorrectionRequestCreateRequest,
  StudentCorrectionFilterParams,
} from '../types/student.types'
import type {
  CorrectionRequestListResponse,
  CorrectionRequestDetailResponse,
} from '../types/faculty.types'

export const studentApi = {
  // ==========================================
  // Dashboard & Personal Metrics
  // ==========================================

  getDashboardSummary: async (): Promise<StudentDashboardSummaryResponse> => {
    const response = await apiClient.get<StudentDashboardSummaryResponse>(
      '/api/student/dashboard/summary'
    )
    return response.data
  },

  getSubjectPerformance: async (): Promise<StudentSubjectPerformanceResponse> => {
    const response = await apiClient.get<StudentSubjectPerformanceResponse>(
      '/api/student/dashboard/subject-performance'
    )
    return response.data
  },

  getAttendanceTrends: async (params?: {
    period?: 'daily' | 'weekly' | 'monthly' | string
    start_date?: string
    end_date?: string
    subject_id?: number
  }): Promise<StudentAttendanceTrendsResponse> => {
    const response = await apiClient.get<StudentAttendanceTrendsResponse>(
      '/api/student/dashboard/attendance-trends',
      { params }
    )
    return response.data
  },

  // ==========================================
  // Attendance Summary & History
  // ==========================================

  getAttendanceSummary: async (): Promise<StudentAttendanceSummaryResponse> => {
    const response = await apiClient.get<StudentAttendanceSummaryResponse>(
      '/api/student/attendance/summary'
    )
    return response.data
  },

  getAttendanceHistory: async (
    params?: StudentHistoryFilterParams
  ): Promise<StudentAttendanceHistoryResponse> => {
    const response = await apiClient.get<StudentAttendanceHistoryResponse>(
      '/api/student/attendance/history',
      { params }
    )
    return response.data
  },

  getAttendanceRecordDetail: async (
    attendanceId: number
  ): Promise<StudentAttendanceRecordDetailResponse> => {
    const response = await apiClient.get<StudentAttendanceRecordDetailResponse>(
      `/api/student/attendance/${attendanceId}`
    )
    return response.data
  },

  // ==========================================
  // Correction Requests
  // ==========================================

  getCorrectionRequests: async (
    params?: StudentCorrectionFilterParams
  ): Promise<CorrectionRequestListResponse> => {
    const response = await apiClient.get<CorrectionRequestListResponse>(
      '/api/student/correction-requests',
      { params }
    )
    return response.data
  },

  getCorrectionRequestDetail: async (
    requestId: number
  ): Promise<CorrectionRequestDetailResponse> => {
    const response = await apiClient.get<CorrectionRequestDetailResponse>(
      `/api/student/correction-requests/${requestId}`
    )
    return response.data
  },

  createCorrectionRequest: async (
    data: CorrectionRequestCreateRequest
  ): Promise<CorrectionRequestDetailResponse> => {
    const response = await apiClient.post<CorrectionRequestDetailResponse>(
      '/api/student/correction-requests',
      data
    )
    return response.data
  },
}

export default studentApi
