
-- ============================================
-- ATTENDANCE MANAGEMENT SYSTEM
-- GROUP 3: RELATIONSHIP TABLES
-- ============================================

USE attendance_management;


-- 1. ENROLLMENTS TABLE

CREATE TABLE enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    enrollment_date DATE NOT NULL,
    enrollment_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT fk_enrollments_students
        FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    CONSTRAINT fk_enrollments_classes
        FOREIGN KEY (class_id)
        REFERENCES classes(class_id),

    CONSTRAINT uq_student_class
        UNIQUE (student_id, class_id),

    CONSTRAINT chk_enrollment_status
        CHECK (enrollment_status IN ('ACTIVE', 'INACTIVE'))

) ENGINE=InnoDB;


-- 2. TEACHING ASSIGNMENTS TABLE

CREATE TABLE teaching_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    subject_id INT NOT NULL,
    class_id INT NOT NULL,

    CONSTRAINT fk_assignments_faculty
        FOREIGN KEY (faculty_id)
        REFERENCES faculty(faculty_id),

    CONSTRAINT fk_assignments_subjects
        FOREIGN KEY (subject_id)
        REFERENCES subjects(subject_id),

    CONSTRAINT fk_assignments_classes
        FOREIGN KEY (class_id)
        REFERENCES classes(class_id),

    CONSTRAINT uq_faculty_subject_class
        UNIQUE (faculty_id, subject_id, class_id)

) ENGINE=InnoDB;


-- END OF GROUP 3
