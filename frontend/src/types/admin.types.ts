/**
 * TypeScript types and interfaces matching the FastAPI Admin backend contracts.
 */

// ==========================================
// Dashboard Types
// ==========================================

export interface DashboardSummaryResponse {
  // Academic structure
  total_students: number
  active_students: number
  inactive_students: number
  total_faculty: number
  active_faculty: number
  inactive_faculty: number
  total_departments: number
  total_classes: number
  total_subjects: number
  total_enrollments: number
  active_enrollments: number
  total_teaching_assignments: number

  // Lecture statistics
  total_lectures: number
  submitted_lectures: number
  draft_lectures: number
  cancelled_lectures: number

  // Attendance statistics (SUBMITTED lectures only)
  total_attendance_records_for_submitted_lectures: number
  total_present: number
  total_absent: number
  overall_attendance_percentage: number

  // Correction statistics
  total_correction_requests: number
  pending_correction_requests: number
  approved_correction_requests: number
  rejected_correction_requests: number
}

export interface RecentLectureResponse {
  lecture_id: number
  subject_name: string
  faculty_name: string
  class_name: string
  division: string
  lecture_date: string
  start_time: string
  end_time: string
  lecture_status: 'DRAFT' | 'SUBMITTED' | 'CANCELLED' | string
  present_count: number
  absent_count: number
}

export interface PendingCorrectionResponse {
  request_id: number
  student_name: string
  roll_number: string
  subject_name: string
  lecture_date: string
  current_status: 'PRESENT' | 'ABSENT' | string
  requested_status: 'PRESENT' | 'ABSENT' | string
  reason: string
  created_at?: string | null
}

export interface AttendanceDistributionResponse {
  present_count: number
  absent_count: number
  total_marked: number
  present_percentage: number
  absent_percentage: number
}

export interface AttendanceTrendItem {
  period: string
  total_lectures: number
  present_count: number
  absent_count: number
  attendance_percentage: number
}

export interface AttendanceTrendsResponse {
  period_type: 'daily' | 'weekly' | 'monthly'
  total_periods: number
  items: AttendanceTrendItem[]
}

// ==========================================
// Student Types
// ==========================================

export interface StudentCreateRequest {
  student_name: string
  roll_number: string
  username: string
  email: string
}

export interface StudentUpdateRequest {
  student_name?: string
  roll_number?: string
  username?: string
  email?: string
}

export interface StudentStatusUpdateRequest {
  account_status: 'ACTIVE' | 'INACTIVE'
}

export interface StudentDetailResponse {
  student_id: number
  user_id: number
  student_name: string
  roll_number: string
  username: string
  email: string
  account_status: 'ACTIVE' | 'INACTIVE' | string
}

export interface StudentListResponse {
  total: number
  skip: number
  limit: number
  items: StudentDetailResponse[]
}

// ==========================================
// Faculty Types
// ==========================================

export interface FacultyCreateRequest {
  faculty_name: string
  username: string
  email: string
  department_id: number
}

export interface FacultyUpdateRequest {
  faculty_name?: string
  username?: string
  email?: string
  department_id?: number
}

export interface FacultyStatusUpdateRequest {
  account_status: 'ACTIVE' | 'INACTIVE'
}

export interface FacultyDetailResponse {
  faculty_id: number
  user_id: number
  faculty_name: string
  username: string
  email: string
  department_id: number
  department_name: string
  account_status: 'ACTIVE' | 'INACTIVE' | string
}

export interface FacultyListResponse {
  total: number
  skip: number
  limit: number
  items: FacultyDetailResponse[]
}

// ==========================================
// Department Types
// ==========================================

export interface DepartmentCreateRequest {
  department_name: string
  department_code: string
}

export interface DepartmentUpdateRequest {
  department_name?: string
  department_code?: string
}

export interface DepartmentDetailResponse {
  department_id: number
  department_name: string
  department_code: string
  total_classes: number
  total_faculty: number
}

export interface DepartmentListResponse {
  total: number
  skip: number
  limit: number
  items: DepartmentDetailResponse[]
}

// ==========================================
// Class Types
// ==========================================

export interface ClassCreateRequest {
  department_id: number
  class_name: string
  academic_year: string
  division: string
  semester: number
}

export interface ClassUpdateRequest {
  department_id?: number
  class_name?: string
  academic_year?: string
  division?: string
  semester?: number
}

export interface ClassDetailResponse {
  class_id: number
  department_id: number
  department_name: string
  class_name: string
  academic_year: string
  division: string
  semester: number
  total_enrolled_students: number
}

export interface ClassListResponse {
  total: number
  skip: number
  limit: number
  items: ClassDetailResponse[]
}

// ==========================================
// Subject Types
// ==========================================

export interface SubjectCreateRequest {
  subject_code: string
  subject_name: string
  semester: number
}

export interface SubjectUpdateRequest {
  subject_code?: string
  subject_name?: string
  semester?: number
}

export interface SubjectDetailResponse {
  subject_id: number
  subject_code: string
  subject_name: string
  semester: number
}

export interface SubjectListResponse {
  total: number
  skip: number
  limit: number
  items: SubjectDetailResponse[]
}

// ==========================================
// Student Enrollment Types
// ==========================================

export interface EnrollmentCreateRequest {
  student_id: number
  class_id: number
  enrollment_date: string // YYYY-MM-DD
}

export interface EnrollmentStatusUpdateRequest {
  enrollment_status: 'ACTIVE' | 'INACTIVE'
}

export interface EnrollmentDetailResponse {
  enrollment_id: number
  student_id: number
  student_name: string
  roll_number: string
  class_id: number
  class_name: string
  academic_year: string
  division: string
  department_name: string
  enrollment_date: string
  enrollment_status: 'ACTIVE' | 'INACTIVE' | string
}

export interface EnrollmentListResponse {
  total: number
  skip: number
  limit: number
  items: EnrollmentDetailResponse[]
}

// ==========================================
// Teaching Assignment Types
// ==========================================

export interface TeachingAssignmentCreateRequest {
  faculty_id: number
  subject_id: number
  class_id: number
}

export interface TeachingAssignmentUpdateRequest {
  faculty_id?: number
  subject_id?: number
  class_id?: number
}

export interface TeachingAssignmentDetailResponse {
  assignment_id: number
  faculty_id: number
  faculty_name: string
  subject_id: number
  subject_code: string
  subject_name: string
  class_id: number
  class_name: string
  academic_year: string
  division: string
  department_id: number
  department_name: string
}

export interface TeachingAssignmentListResponse {
  total: number
  skip: number
  limit: number
  items: TeachingAssignmentDetailResponse[]
}
