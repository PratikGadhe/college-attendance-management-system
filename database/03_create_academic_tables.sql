
-- ============================================
-- ATTENDANCE MANAGEMENT SYSTEM
-- PHASE 2: ACADEMIC TABLE CREATION
-- ============================================

USE attendance_management;


-- 1. STUDENTS TABLE
-- Stores student profile information

CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    roll_number VARCHAR(20) NOT NULL UNIQUE,
    student_name VARCHAR(100) NOT NULL,

    CONSTRAINT fk_students_users
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)

) ENGINE=InnoDB;


-- 2. FACULTY TABLE
-- Stores faculty profile information

CREATE TABLE faculty (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    department_id INT NOT NULL,
    faculty_name VARCHAR(100) NOT NULL,

    CONSTRAINT fk_faculty_users
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_faculty_departments
        FOREIGN KEY (department_id)
        REFERENCES departments(department_id)

) ENGINE=InnoDB;


-- 3. CLASSES TABLE
-- Stores academic class information

CREATE TABLE classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    division VARCHAR(10) NOT NULL,
    semester INT NOT NULL,

    CONSTRAINT fk_classes_departments
        FOREIGN KEY (department_id)
        REFERENCES departments(department_id),

    CONSTRAINT chk_class_semester
        CHECK (semester BETWEEN 1 AND 8),

    CONSTRAINT uq_class_details
        UNIQUE (department_id, academic_year, class_name, division, semester)

) ENGINE=InnoDB;


-- 4. SUBJECTS TABLE
-- Stores subject information

CREATE TABLE subjects (
    subject_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(20) NOT NULL UNIQUE,
    subject_name VARCHAR(100) NOT NULL,
    semester INT NOT NULL,

    CONSTRAINT chk_subject_semester
        CHECK (semester BETWEEN 1 AND 8)

) ENGINE=InnoDB;


-- END OF ACADEMIC TABLE CREATION
