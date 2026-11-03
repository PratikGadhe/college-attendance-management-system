/**
 * TypeScript types and interfaces for Admin Institutional Reports.
 * Matches backend schemas from backend/app/schemas/admin_reports.py
 */

// 1. Department-wise Attendance Report
export interface DepartmentAttendanceReportItem {
  department_id: number
  department_name: string
  department_code: string
  total_classes: number
  total_active_students: number
  total_submitted_lectures: number
  present_count: number
  absent_count: number
  attendance_percentage: number
}

export interface DepartmentAttendanceReportResponse {
  total: number
  items: DepartmentAttendanceReportItem[]
}

// 2. Class-wise Attendance Report
export interface ClassAttendanceReportItem {
  class_id: number
  class_name: string
  department_name: string
  academic_year: string
  division: string
  semester: number
  total_active_students: number
  total_submitted_lectures: number
  present_count: number
  absent_count: number
  attendance_percentage: number
}

export interface ClassAttendanceReportResponse {
  total: number
  skip: number
  limit: number
  items: ClassAttendanceReportItem[]
}

// 3. Subject-wise Attendance Report
export interface SubjectAttendanceReportItem {
  subject_id: number
  subject_code: string
  subject_name: string
  semester: number
  class_id: number | null
  class_name: string | null
  total_submitted_lectures: number
  present_count: number
  absent_count: number
  attendance_percentage: number
}

export interface SubjectAttendanceReportResponse {
  total: number
  skip: number
  limit: number
  items: SubjectAttendanceReportItem[]
}

// 4. Faculty-wise Teaching and Attendance Report
export interface FacultyAttendanceReportItem {
  faculty_id: number
  faculty_name: string
  department_name: string
  total_teaching_assignments: number
  total_lectures: number
  submitted_lectures: number
  draft_lectures: number
  cancelled_lectures: number
  total_present: number
  total_absent: number
  attendance_percentage: number
}

export interface FacultyAttendanceReportResponse {
  total: number
  skip: number
  limit: number
  items: FacultyAttendanceReportItem[]
}

// 5. Student-wise Attendance Report
export interface StudentAttendanceReportItem {
  student_id: number
  student_name: string
  roll_number: string
  class_name: string
  department_name: string
  total_submitted_lectures: number
  present_count: number
  absent_count: number
  attendance_percentage: number
}

export interface StudentAttendanceReportResponse {
  total: number
  skip: number
  limit: number
  items: StudentAttendanceReportItem[]
}

// 6. Low Attendance Report
export interface LowAttendanceReportItem {
  student_id: number
  student_name: string
  roll_number: string
  class_name: string
  department_name: string
  total_submitted_lectures: number
  present_count: number
  absent_count: number
  attendance_percentage: number
  threshold: number
  required_present_count_to_reach_threshold: number
}

export interface LowAttendanceReportResponse {
  threshold: number
  total: number
  skip: number
  limit: number
  items: LowAttendanceReportItem[]
}

// 7. Lecture Report
export interface LectureReportItem {
  lecture_id: number
  lecture_date: string
  start_time: string
  end_time: string
  lecture_status: 'DRAFT' | 'SUBMITTED' | 'CANCELLED' | string
  subject_name: string
  subject_code: string
  faculty_name: string
  class_name: string
  division: string
  total_students: number
  present_count: number
  absent_count: number
}

export interface LectureReportResponse {
  total: number
  skip: number
  limit: number
  items: LectureReportItem[]
}

// 8. Date Range Attendance Performance Report
export interface DateRangeAttendanceReportResponse {
  start_date: string | null
  end_date: string | null
  total_lectures: number
  total_records: number
  present_count: number
  absent_count: number
  attendance_percentage: number
  items: LectureReportItem[]
}

// Query Filter Parameters
export interface DepartmentReportParams {
  search?: string
  skip?: number
  limit?: number
}

export interface ClassReportParams {
  department_id?: number
  search?: string
  skip?: number
  limit?: number
}

export interface SubjectReportParams {
  department_id?: number
  search?: string
  skip?: number
  limit?: number
}

export interface FacultyReportParams {
  department_id?: number
  search?: string
  skip?: number
  limit?: number
}

export interface StudentReportParams {
  class_id?: number
  search?: string
  skip?: number
  limit?: number
}

export interface LowAttendanceReportParams {
  threshold?: number
  class_id?: number
  subject_id?: number
  skip?: number
  limit?: number
}

export interface LectureReportParams {
  class_id?: number
  subject_id?: number
  faculty_id?: number
  lecture_status?: string
  start_date?: string
  end_date?: string
  skip?: number
  limit?: number
}

export interface DateRangeAttendanceReportParams {
  start_date?: string
  end_date?: string
  class_id?: number
  subject_id?: number
}

