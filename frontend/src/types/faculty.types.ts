/**
 * TypeScript interfaces for Faculty Portal domain models, API requests, and responses.
 * Aligned with FastAPI backend schemas in:
 * - app.schemas.faculty_dashboard
 * - app.schemas.faculty_lectures
 * - app.schemas.faculty_attendance
 * - app.schemas.correction_requests
 */

// ==========================================
// Teaching Assignments
// ==========================================

export interface FacultyTeachingAssignmentResponse {
  assignment_id: number
  subject_id: number
  subject_code: string
  subject_name: string
  class_id: number
  class_name: string
  academic_year: string
  division: string
  semester: number
  department_name: string
}

export interface FacultyTeachingAssignmentListResponse {
  total: number
  items: FacultyTeachingAssignmentResponse[]
}

// ==========================================
// Lectures
// ==========================================

export type LectureStatus = 'DRAFT' | 'SUBMITTED' | 'CANCELLED'

export interface LectureCreateRequest {
  assignment_id: number
  lecture_date: string // YYYY-MM-DD
  start_time: string // HH:MM:SS or HH:MM
  end_time: string // HH:MM:SS or HH:MM
}

export interface LectureUpdateRequest {
  lecture_date?: string
  start_time?: string
  end_time?: string
}

export interface LectureDetailResponse {
  lecture_id: number
  assignment_id: number
  lecture_date: string
  start_time: string
  end_time: string
  lecture_status: LectureStatus | string
  created_at?: string | null
  submitted_at?: string | null

  // Linked academic details
  subject_id: number
  subject_code: string
  subject_name: string
  class_id: number
  class_name: string
  academic_year: string
  division: string
  semester: number
  department_name: string

  // Attendance metrics
  total_enrolled_students: number
  marked_students: number
  unmarked_students: number
  present_count: number
  absent_count: number
}

export interface FacultyLectureListItem {
  lecture_id: number
  assignment_id: number
  subject_name: string
  subject_code: string
  class_name: string
  division: string
  lecture_date: string
  start_time: string
  end_time: string
  lecture_status: LectureStatus | string
  created_at?: string | null
  submitted_at?: string | null
}

export interface FacultyLectureListResponse {
  total: number
  skip: number
  limit: number
  items: FacultyLectureListItem[]
}

export interface LectureFilterParams {
  assignment_id?: number
  lecture_date?: string
  status?: string
  start_date?: string
  end_date?: string
  skip?: number
  limit?: number
}

// ==========================================
// Attendance Roster & Marking
// ==========================================

export type AttendanceStatus = 'PRESENT' | 'ABSENT'

export interface AttendanceMarkItem {
  student_id: number
  status: AttendanceStatus
}

export interface AttendanceMarkRequest {
  records: AttendanceMarkItem[]
}

export interface RosterStudentItem {
  student_id: number
  student_name: string
  roll_number: string
  attendance_id?: number | null
  attendance_status?: AttendanceStatus | null
  marked_at?: string | null
}

export interface LectureAttendanceRosterResponse {
  lecture_id: number
  lecture_status: LectureStatus | string
  class_id: number
  class_name: string
  total_enrolled_students: number
  marked_students: number
  unmarked_students: number
  present_count: number
  absent_count: number
  students: RosterStudentItem[]
}

export interface LectureSubmissionResponse {
  lecture_id: number
  lecture_status: string
  submitted_at: string
  total_students_marked: number
  present_count: number
  absent_count: number
  message: string
}

// ==========================================
// Correction Requests
// ==========================================

export type CorrectionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface CorrectionRequestReviewRequest {
  decision: 'APPROVED' | 'REJECTED'
  review_remarks?: string | null
}

export interface CorrectionRequestDetailResponse {
  request_id: number
  attendance_id: number
  student_id: number
  student_name: string
  roll_number: string
  subject_id: number
  subject_code: string
  subject_name: string
  class_name: string
  division: string
  lecture_date: string
  current_status: string
  requested_status: string
  reason: string
  request_status: CorrectionRequestStatus | string
  reviewed_by?: number | null
  reviewer_name?: string | null
  reviewed_at?: string | null
  review_remarks?: string | null
  created_at?: string | null
}

export interface CorrectionRequestListResponse {
  total: number
  skip: number
  limit: number
  items: CorrectionRequestDetailResponse[]
}

export interface CorrectionRequestFilterParams {
  request_status?: string
  subject_id?: number
  start_date?: string
  end_date?: string
  skip?: number
  limit?: number
}

// ==========================================
// Faculty Dashboard & Reports
// ==========================================

export interface FacultyDashboardSummaryResponse {
  faculty_id: number
  faculty_name: string
  department_name: string
  total_teaching_assignments: number
  total_lectures: number
  submitted_lectures: number
  draft_lectures: number
  cancelled_lectures: number
  total_students_across_active_classes: number
  pending_correction_requests: number
  present_count: number
  absent_count: number
  overall_attendance_percentage: number
}

export interface FacultyAttendanceTrendItem {
  period: string
  submitted_lectures: number
  present_count: number
  absent_count: number
  attendance_percentage: number
}

export interface FacultyAttendanceTrendsResponse {
  period_type: 'daily' | 'weekly' | 'monthly'
  total_periods: number
  items: FacultyAttendanceTrendItem[]
}

export interface FacultyPerformanceReportItem {
  assignment_id: number
  subject_name: string
  subject_code: string
  class_name: string
  division: string
  total_submitted_lectures: number
  total_students: number
  present_count: number
  absent_count: number
  attendance_percentage: number
}

export interface FacultyPerformanceReportResponse {
  total: number
  skip: number
  limit: number
  items: FacultyPerformanceReportItem[]
}

export interface FacultyStudentAttendanceItem {
  student_id: number
  student_name: string
  roll_number: string
  class_name: string
  subject_name: string
  total_submitted_lectures: number
  present_count: number
  absent_count: number
  attendance_percentage: number
}

export interface FacultyStudentAttendanceResponse {
  total: number
  skip: number
  limit: number
  items: FacultyStudentAttendanceItem[]
}

export interface FacultyStudentReportFilterParams {
  assignment_id?: number
  class_id?: number
  subject_id?: number
  search?: string
  skip?: number
  limit?: number
}

