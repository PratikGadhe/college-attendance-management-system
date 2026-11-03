/**
 * TypeScript interfaces for Student Portal domain models, API requests, and responses.
 * Aligned with FastAPI backend schemas in:
 * - app.schemas.student_dashboard
 * - app.schemas.student_attendance
 * - app.schemas.correction_requests
 */

// ==========================================
// Student Dashboard & Performance
// ==========================================

export interface StudentSubjectAttendanceSummary {
  subject_id: number
  subject_code: string
  subject_name: string
  total_submitted_lectures: number
  present_count: number
  absent_count: number
  attendance_percentage: number
}

export interface StudentDashboardSummaryResponse {
  student_id: number
  student_name: string
  roll_number: string
  active_class_name: string
  department_name: string
  total_subjects: number
  total_submitted_lectures: number
  present_count: number
  absent_count: number
  overall_attendance_percentage: number
  pending_correction_requests: number
  approved_correction_requests: number
  rejected_correction_requests: number
}

export interface StudentSubjectPerformanceResponse {
  student_id: number
  student_name: string
  roll_number: string
  items: StudentSubjectAttendanceSummary[]
}

export interface StudentAttendanceTrendItem {
  period: string
  total_lectures: number
  present_count: number
  absent_count: number
  attendance_percentage: number
}

export interface StudentAttendanceTrendsResponse {
  period_type: 'daily' | 'weekly' | 'monthly'
  total_periods: number
  items: StudentAttendanceTrendItem[]
}

// ==========================================
// Student Attendance Summary & History
// ==========================================

export interface StudentAttendanceSummaryResponse {
  student_id: number
  student_name: string
  roll_number: string
  overall_percentage: number
  subjects: StudentSubjectAttendanceSummary[]
}

export interface StudentAttendanceHistoryItem {
  attendance_id: number
  lecture_id: number
  subject_id: number
  subject_code: string
  subject_name: string
  class_name: string
  division: string
  lecture_date: string
  start_time: string
  end_time: string
  attendance_status: 'PRESENT' | 'ABSENT' | string
  marked_at?: string | null
}

export interface StudentAttendanceHistoryResponse {
  total: number
  skip: number
  limit: number
  items: StudentAttendanceHistoryItem[]
}

export interface StudentHistoryFilterParams {
  subject_id?: number
  attendance_status?: 'PRESENT' | 'ABSENT' | string
  start_date?: string
  end_date?: string
  skip?: number
  limit?: number
}

export interface StudentAttendanceRecordDetailResponse {
  attendance_id: number
  lecture_id: number
  student_id: number
  student_name: string
  roll_number: string
  subject_id: number
  subject_code: string
  subject_name: string
  class_name: string
  division: string
  lecture_date: string
  start_time: string
  end_time: string
  lecture_status: string
  attendance_status: 'PRESENT' | 'ABSENT' | string
  marked_at?: string | null
  submitted_at?: string | null
}

// ==========================================
// Student Correction Requests
// ==========================================

export interface CorrectionRequestCreateRequest {
  attendance_id: number
  requested_status: 'PRESENT' | 'ABSENT'
  reason: string
}

export interface StudentCorrectionFilterParams {
  request_status?: string
  skip?: number
  limit?: number
}
