USE attendance_management;

SELECT
    students.roll_number,
    students.student_name,
    subjects.subject_name,
    COUNT(attendance_records.attendance_id) AS total_lectures,
    SUM(
        CASE WHEN attendance_records.status = 'PRESENT'
        THEN 1 ELSE 0 END
    ) AS attended_lectures,
    ROUND(
        SUM(CASE WHEN attendance_records.status = 'PRESENT'
        THEN 1 ELSE 0 END) * 100.0 /
        NULLIF(COUNT(attendance_records.attendance_id), 0),
        2
    ) AS attendance_percentage

FROM students

JOIN enrollments
    ON students.student_id = enrollments.student_id

JOIN teaching_assignments
    ON enrollments.class_id = teaching_assignments.class_id

JOIN subjects
    ON teaching_assignments.subject_id = subjects.subject_id

JOIN lectures
    ON teaching_assignments.assignment_id = lectures.assignment_id
    AND lectures.lecture_status = 'SUBMITTED'

JOIN attendance_records
    ON lectures.lecture_id = attendance_records.lecture_id
    AND students.student_id = attendance_records.student_id

WHERE enrollments.enrollment_status = 'ACTIVE'

GROUP BY
    students.student_id,
    students.roll_number,
    students.student_name,
    subjects.subject_id,
    subjects.subject_name

ORDER BY students.roll_number, subjects.subject_name;


SELECT
    students.roll_number,
    students.student_name,
    COUNT(attendance_records.attendance_id) AS total_lectures,
    SUM(CASE
        WHEN attendance_records.status = 'PRESENT'
        THEN 1 ELSE 0
    END) AS attended_lectures,

    ROUND(
        SUM(CASE
            WHEN attendance_records.status = 'PRESENT'
            THEN 1 ELSE 0
        END) * 100.0 /
        NULLIF(COUNT(attendance_records.attendance_id), 0),
        2
    ) AS attendance_percentage

FROM students

JOIN enrollments
    ON students.student_id = enrollments.student_id

JOIN teaching_assignments
    ON enrollments.class_id = teaching_assignments.class_id

JOIN lectures
    ON teaching_assignments.assignment_id = lectures.assignment_id
    AND lectures.lecture_status = 'SUBMITTED'

JOIN attendance_records
    ON lectures.lecture_id = attendance_records.lecture_id
    AND students.student_id = attendance_records.student_id

WHERE enrollments.enrollment_status = 'ACTIVE'

GROUP BY
    students.student_id,
    students.roll_number,
    students.student_name

ORDER BY attendance_percentage DESC;

SELECT
    subjects.subject_code,
    subjects.subject_name,
    COUNT(attendance_records.attendance_id) AS total_records,

    SUM(CASE
        WHEN attendance_records.status = 'PRESENT'
        THEN 1 ELSE 0
    END) AS present_count,

    SUM(CASE
        WHEN attendance_records.status = 'ABSENT'
        THEN 1 ELSE 0
    END) AS absent_count,

    ROUND(
        SUM(CASE
            WHEN attendance_records.status = 'PRESENT'
            THEN 1 ELSE 0
        END) * 100.0 /
        NULLIF(COUNT(attendance_records.attendance_id), 0),
        2
    ) AS attendance_percentage

FROM subjects

JOIN teaching_assignments
    ON subjects.subject_id = teaching_assignments.subject_id

JOIN lectures
    ON teaching_assignments.assignment_id = lectures.assignment_id
    AND lectures.lecture_status = 'SUBMITTED'

JOIN attendance_records
    ON lectures.lecture_id = attendance_records.lecture_id

GROUP BY subjects.subject_id, subjects.subject_code, subjects.subject_name
ORDER BY subjects.subject_name;

SELECT
    students.roll_number,
    students.student_name,
    subjects.subject_name,

    ROUND(
        SUM(CASE
            WHEN attendance_records.status = 'PRESENT'
            THEN 1 ELSE 0
        END) * 100.0 /
        NULLIF(COUNT(attendance_records.attendance_id), 0),
        2
    ) AS attendance_percentage

FROM students

JOIN enrollments
    ON students.student_id = enrollments.student_id

JOIN teaching_assignments
    ON enrollments.class_id = teaching_assignments.class_id

JOIN subjects
    ON teaching_assignments.subject_id = subjects.subject_id

JOIN lectures
    ON teaching_assignments.assignment_id = lectures.assignment_id
    AND lectures.lecture_status = 'SUBMITTED'

JOIN attendance_records
    ON lectures.lecture_id = attendance_records.lecture_id
    AND students.student_id = attendance_records.student_id

WHERE enrollments.enrollment_status = 'ACTIVE'

GROUP BY
    students.student_id,
    students.roll_number,
    students.student_name,
    subjects.subject_id,
    subjects.subject_name

HAVING attendance_percentage < 75

ORDER BY attendance_percentage ASC;

SELECT
    lectures.lecture_id,
    subjects.subject_name,
    lectures.lecture_date,
    lectures.start_time,

    COUNT(attendance_records.attendance_id) AS total_students,

    SUM(CASE
        WHEN attendance_records.status = 'PRESENT'
        THEN 1 ELSE 0
    END) AS present_students,

    SUM(CASE
        WHEN attendance_records.status = 'ABSENT'
        THEN 1 ELSE 0
    END) AS absent_students

FROM lectures

JOIN teaching_assignments
    ON lectures.assignment_id = teaching_assignments.assignment_id

JOIN subjects
    ON teaching_assignments.subject_id = subjects.subject_id

LEFT JOIN attendance_records
    ON lectures.lecture_id = attendance_records.lecture_id

WHERE lectures.lecture_status = 'SUBMITTED'

GROUP BY
    lectures.lecture_id,
    subjects.subject_name,
    lectures.lecture_date,
    lectures.start_time

ORDER BY lectures.lecture_date, lectures.start_time;

SELECT
    students.roll_number,
    students.student_name,
    subjects.subject_name,
    lectures.lecture_date,
    lectures.start_time,
    attendance_records.status

FROM students

JOIN users
    ON students.user_id = users.user_id

JOIN attendance_records
    ON students.student_id = attendance_records.student_id

JOIN lectures
    ON attendance_records.lecture_id = lectures.lecture_id

JOIN teaching_assignments
    ON lectures.assignment_id = teaching_assignments.assignment_id

JOIN subjects
    ON teaching_assignments.subject_id = subjects.subject_id

WHERE users.username = 'student01'
AND lectures.lecture_status = 'SUBMITTED'

ORDER BY lectures.lecture_date DESC;

SELECT
    faculty.faculty_name,
    subjects.subject_name,
    classes.class_name,
    classes.division,
    lectures.lecture_date,
    lectures.start_time,
    lectures.end_time,
    lectures.lecture_status

FROM faculty

JOIN teaching_assignments
    ON faculty.faculty_id = teaching_assignments.faculty_id

JOIN subjects
    ON teaching_assignments.subject_id = subjects.subject_id

JOIN classes
    ON teaching_assignments.class_id = classes.class_id

JOIN lectures
    ON teaching_assignments.assignment_id = lectures.assignment_id

ORDER BY lectures.lecture_date DESC;

SELECT
    correction_requests.request_id,
    students.roll_number,
    students.student_name,
    subjects.subject_name,
    lectures.lecture_date,
    attendance_records.status AS current_status,
    correction_requests.requested_status,
    correction_requests.reason,
    correction_requests.created_at

FROM correction_requests

JOIN students
    ON correction_requests.student_id = students.student_id

JOIN attendance_records
    ON correction_requests.attendance_id = attendance_records.attendance_id

JOIN lectures
    ON attendance_records.lecture_id = lectures.lecture_id

JOIN teaching_assignments
    ON lectures.assignment_id = teaching_assignments.assignment_id

JOIN subjects
    ON teaching_assignments.subject_id = subjects.subject_id

WHERE correction_requests.request_status = 'PENDING'

ORDER BY correction_requests.created_at DESC;

SELECT
    correction_requests.request_id,
    correction_requests.requested_status,
    correction_requests.request_status,
    correction_requests.reason,
    correction_requests.review_remarks,
    correction_requests.created_at,
    correction_requests.reviewed_at

FROM correction_requests

JOIN students
    ON correction_requests.student_id = students.student_id

JOIN users
    ON students.user_id = users.user_id

WHERE users.username = 'student01'

ORDER BY correction_requests.created_at DESC;

SELECT
    lectures.lecture_date,
    subjects.subject_name,

    COUNT(attendance_records.attendance_id) AS total_students,

    SUM(CASE
        WHEN attendance_records.status = 'PRESENT'
        THEN 1 ELSE 0
    END) AS present_students,

    SUM(CASE
        WHEN attendance_records.status = 'ABSENT'
        THEN 1 ELSE 0
    END) AS absent_students

FROM lectures

JOIN teaching_assignments
    ON lectures.assignment_id = teaching_assignments.assignment_id

JOIN subjects
    ON teaching_assignments.subject_id = subjects.subject_id

JOIN attendance_records
    ON lectures.lecture_id = attendance_records.lecture_id

WHERE lectures.lecture_date = '2026-10-20'
AND lectures.lecture_status = 'SUBMITTED'

GROUP BY lectures.lecture_id, lectures.lecture_date, subjects.subject_name;