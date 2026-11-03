
-- ============================================
-- ATTENDANCE MANAGEMENT SYSTEM
-- PHASE 3: SAMPLE MASTER DATA
-- ============================================

USE attendance_management;

START TRANSACTION;


-- 1. INSERT ROLES

INSERT INTO roles (role_name)
VALUES
('ADMIN'),
('FACULTY'),
('STUDENT');


-- 2. INSERT DEPARTMENT

INSERT INTO departments (department_name, department_code)
VALUES
('Computer Engineering', 'COMP');


-- 3. INSERT USERS

INSERT INTO users (role_id, username, email)
SELECT role_id, 'admin', 'admin@example.com'
FROM roles WHERE role_name = 'ADMIN';

INSERT INTO users (role_id, username, email)
SELECT role_id, 'faculty1', 'faculty1@example.com'
FROM roles WHERE role_name = 'FACULTY';

INSERT INTO users (role_id, username, email)
SELECT role_id, 'faculty2', 'faculty2@example.com'
FROM roles WHERE role_name = 'FACULTY';


-- Insert 12 student accounts

INSERT INTO users (role_id, username, email)
SELECT role_id, student_username, student_email
FROM roles
CROSS JOIN (
    SELECT 'student01' AS student_username, 'student01@example.com' AS student_email
    UNION ALL SELECT 'student02', 'student02@example.com'
    UNION ALL SELECT 'student03', 'student03@example.com'
    UNION ALL SELECT 'student04', 'student04@example.com'
    UNION ALL SELECT 'student05', 'student05@example.com'
    UNION ALL SELECT 'student06', 'student06@example.com'
    UNION ALL SELECT 'student07', 'student07@example.com'
    UNION ALL SELECT 'student08', 'student08@example.com'
    UNION ALL SELECT 'student09', 'student09@example.com'
    UNION ALL SELECT 'student10', 'student10@example.com'
    UNION ALL SELECT 'student11', 'student11@example.com'
    UNION ALL SELECT 'student12', 'student12@example.com'
) AS student_data
WHERE roles.role_name = 'STUDENT';


-- 4. INSERT CLASS

INSERT INTO classes (
    department_id,
    class_name,
    academic_year,
    division,
    semester
)
SELECT
    department_id,
    'SY Computer Engineering',
    '2026-27',
    'A',
    3
FROM departments
WHERE department_code = 'COMP';


-- 5. INSERT SUBJECTS

INSERT INTO subjects (subject_code, subject_name, semester)
VALUES
('DBMS', 'Database Management System', 3),
('OS', 'Operating Systems', 3),
('ML', 'Machine Learning', 3),
('CN', 'Computer Networks', 3);


-- 6. INSERT STUDENT PROFILES

INSERT INTO students (user_id, roll_number, student_name)
SELECT
    users.user_id,
    student_data.username,
    student_data.student_name
FROM users
JOIN (
    SELECT 'student01' AS username, 'Aarav Patil' AS student_name
    UNION ALL SELECT 'student02', 'Isha Sharma'
    UNION ALL SELECT 'student03', 'Rohan Deshmukh'
    UNION ALL SELECT 'student04', 'Ananya Joshi'
    UNION ALL SELECT 'student05', 'Kabir Shah'
    UNION ALL SELECT 'student06', 'Sneha Kulkarni'
    UNION ALL SELECT 'student07', 'Aditya More'
    UNION ALL SELECT 'student08', 'Meera Pawar'
    UNION ALL SELECT 'student09', 'Arjun Jadhav'
    UNION ALL SELECT 'student10', 'Sana Khan'
    UNION ALL SELECT 'student11', 'Omkar Patil'
    UNION ALL SELECT 'student12', 'Priya Desai'
) AS student_data
ON users.username = student_data.username;


-- 7. INSERT FACULTY PROFILES

INSERT INTO faculty (user_id, department_id, faculty_name)
SELECT
    users.user_id,
    departments.department_id,
    faculty_data.faculty_name
FROM users
CROSS JOIN departments
JOIN (
    SELECT 'faculty1' AS username, 'Faculty A' AS faculty_name
    UNION ALL SELECT 'faculty2', 'Faculty B'
) AS faculty_data
ON users.username = faculty_data.username
WHERE departments.department_code = 'COMP';


-- 8. INSERT STUDENT ENROLLMENTS

INSERT INTO enrollments (
    student_id,
    class_id,
    enrollment_date
)
SELECT
    students.student_id,
    classes.class_id,
    '2026-07-01'
FROM students
CROSS JOIN classes;


-- 9. INSERT TEACHING ASSIGNMENTS

-- Faculty A: DBMS and Operating Systems

INSERT INTO teaching_assignments (
    faculty_id,
    subject_id,
    class_id
)
SELECT
    faculty.faculty_id,
    subjects.subject_id,
    classes.class_id
FROM faculty
CROSS JOIN subjects
CROSS JOIN classes
WHERE faculty.faculty_name = 'Faculty A'
AND subjects.subject_code IN ('DBMS', 'OS');


-- Faculty B: Machine Learning and Computer Networks

INSERT INTO teaching_assignments (
    faculty_id,
    subject_id,
    class_id
)
SELECT
    faculty.faculty_id,
    subjects.subject_id,
    classes.class_id
FROM faculty
CROSS JOIN subjects
CROSS JOIN classes
WHERE faculty.faculty_name = 'Faculty B'
AND subjects.subject_code IN ('ML', 'CN');


COMMIT;


-- END OF MASTER DATA INSERTION
