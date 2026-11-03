USE attendance_management;

START TRANSACTION;

-- ==========================================
-- STEP 1: INSERT 8 SAMPLE LECTURES
-- ==========================================

-- DBMS: 2 lectures
INSERT INTO lectures (
    assignment_id, lecture_date, start_time,
    end_time, lecture_status, submitted_at
)
SELECT assignment_id, '2026-10-20', '09:00:00',
       '10:00:00', 'SUBMITTED', NOW()
FROM teaching_assignments
JOIN subjects USING (subject_id)
WHERE subject_code = 'DBMS';

INSERT INTO lectures (
    assignment_id, lecture_date, start_time,
    end_time, lecture_status, submitted_at
)
SELECT assignment_id, '2026-10-22', '09:00:00',
       '10:00:00', 'SUBMITTED', NOW()
FROM teaching_assignments
JOIN subjects USING (subject_id)
WHERE subject_code = 'DBMS';


-- OS: 2 lectures
INSERT INTO lectures (
    assignment_id, lecture_date, start_time,
    end_time, lecture_status, submitted_at
)
SELECT assignment_id, '2026-10-20', '10:15:00',
       '11:15:00', 'SUBMITTED', NOW()
FROM teaching_assignments
JOIN subjects USING (subject_id)
WHERE subject_code = 'OS';

INSERT INTO lectures (
    assignment_id, lecture_date, start_time,
    end_time, lecture_status, submitted_at
)
SELECT assignment_id, '2026-10-22', '10:15:00',
       '11:15:00', 'SUBMITTED', NOW()
FROM teaching_assignments
JOIN subjects USING (subject_id)
WHERE subject_code = 'OS';


-- ML: 2 lectures
INSERT INTO lectures (
    assignment_id, lecture_date, start_time,
    end_time, lecture_status, submitted_at
)
SELECT assignment_id, '2026-10-21', '11:30:00',
       '12:30:00', 'SUBMITTED', NOW()
FROM teaching_assignments
JOIN subjects USING (subject_id)
WHERE subject_code = 'ML';

INSERT INTO lectures (
    assignment_id, lecture_date, start_time,
    end_time, lecture_status, submitted_at
)
SELECT assignment_id, '2026-10-23', '11:30:00',
       '12:30:00', 'SUBMITTED', NOW()
FROM teaching_assignments
JOIN subjects USING (subject_id)
WHERE subject_code = 'ML';


-- CN: 2 lectures
INSERT INTO lectures (
    assignment_id, lecture_date, start_time,
    end_time, lecture_status, submitted_at
)
SELECT assignment_id, '2026-10-21', '13:00:00',
       '14:00:00', 'SUBMITTED', NOW()
FROM teaching_assignments
JOIN subjects USING (subject_id)
WHERE subject_code = 'CN';

INSERT INTO lectures (
    assignment_id, lecture_date, start_time,
    end_time, lecture_status, submitted_at
)
SELECT assignment_id, '2026-10-23', '13:00:00',
       '14:00:00', 'SUBMITTED', NOW()
FROM teaching_assignments
JOIN subjects USING (subject_id)
WHERE subject_code = 'CN';


-- ==========================================
-- STEP 2: INSERT ATTENDANCE RECORDS
-- ==========================================

INSERT INTO attendance_records (
    lecture_id,
    student_id,
    status,
    marked_by
)
SELECT
    lectures.lecture_id,
    students.student_id,

    CASE
        WHEN MOD(students.student_id + lectures.lecture_id, 5)
             IN (0, 1)
        THEN 'ABSENT'
        ELSE 'PRESENT'
    END,

    faculty.user_id

FROM lectures

JOIN teaching_assignments
    ON lectures.assignment_id = teaching_assignments.assignment_id

JOIN faculty
    ON teaching_assignments.faculty_id = faculty.faculty_id

JOIN enrollments
    ON teaching_assignments.class_id = enrollments.class_id

JOIN students
    ON enrollments.student_id = students.student_id

WHERE lectures.lecture_status = 'SUBMITTED'
AND enrollments.enrollment_status = 'ACTIVE';


COMMIT;