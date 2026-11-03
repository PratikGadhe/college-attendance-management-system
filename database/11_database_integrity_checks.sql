USE attendance_management;

-- 1. Check attendance records for students
-- who are not enrolled in the lecture's class.

SELECT
    ar.attendance_id,
    ar.student_id,
    ar.lecture_id
FROM attendance_records ar
JOIN lectures l
    ON ar.lecture_id = l.lecture_id
JOIN teaching_assignments ta
    ON l.assignment_id = ta.assignment_id
LEFT JOIN enrollments e
    ON e.student_id = ar.student_id
    AND e.class_id = ta.class_id
    AND e.enrollment_status = 'ACTIVE'
WHERE e.enrollment_id IS NULL;


-- 2. Check whether attendance was marked by
-- the faculty assigned to that lecture.

SELECT
    ar.attendance_id,
    ar.marked_by,
    l.lecture_id
FROM attendance_records ar
JOIN lectures l
    ON ar.lecture_id = l.lecture_id
JOIN teaching_assignments ta
    ON l.assignment_id = ta.assignment_id
JOIN faculty f
    ON ta.faculty_id = f.faculty_id
WHERE ar.marked_by <> f.user_id;


-- 3. Check whether correction requests belong
-- to the same student as the attendance record.

SELECT
    cr.request_id,
    cr.student_id AS request_student,
    ar.student_id AS attendance_student
FROM correction_requests cr
JOIN attendance_records ar
    ON cr.attendance_id = ar.attendance_id
WHERE cr.student_id <> ar.student_id;


-- 4. Check approved corrections without audit logs.

SELECT
    cr.request_id,
    cr.attendance_id
FROM correction_requests cr
WHERE cr.request_status = 'APPROVED'
AND NOT EXISTS (
    SELECT 1
    FROM attendance_audit_logs al
    WHERE al.attendance_id = cr.attendance_id
);


-- 5. Check submitted lectures with missing
-- attendance records for active enrolled students.

SELECT
    l.lecture_id,
    COUNT(e.student_id) AS missing_attendance_count
FROM lectures l
JOIN teaching_assignments ta
    ON l.assignment_id = ta.assignment_id
JOIN enrollments e
    ON ta.class_id = e.class_id
    AND e.enrollment_status = 'ACTIVE'
LEFT JOIN attendance_records ar
    ON l.lecture_id = ar.lecture_id
    AND e.student_id = ar.student_id
WHERE l.lecture_status = 'SUBMITTED'
AND ar.attendance_id IS NULL
GROUP BY l.lecture_id;