
-- ============================================
-- ATTENDANCE MANAGEMENT SYSTEM
-- GROUP 4: LECTURE AND ATTENDANCE TABLES
-- ============================================

USE attendance_management;


-- 1. LECTURES TABLE

CREATE TABLE lectures (
    lecture_id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    lecture_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    lecture_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,

    CONSTRAINT fk_lectures_assignments
        FOREIGN KEY (assignment_id)
        REFERENCES teaching_assignments(assignment_id),

    CONSTRAINT chk_lecture_status
        CHECK (
            lecture_status IN ('DRAFT', 'SUBMITTED', 'CANCELLED')
        ),

    CONSTRAINT chk_lecture_time
        CHECK (end_time > start_time)

) ENGINE=InnoDB;


-- 2. ATTENDANCE RECORDS TABLE

CREATE TABLE attendance_records (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    lecture_id INT NOT NULL,
    student_id INT NOT NULL,
    status VARCHAR(10) NOT NULL,
    marked_by INT NOT NULL,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attendance_lectures
        FOREIGN KEY (lecture_id)
        REFERENCES lectures(lecture_id),

    CONSTRAINT fk_attendance_students
        FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    CONSTRAINT fk_attendance_marked_by
        FOREIGN KEY (marked_by)
        REFERENCES users(user_id),

    CONSTRAINT uq_lecture_student
        UNIQUE (lecture_id, student_id),

    CONSTRAINT chk_attendance_status
        CHECK (status IN ('PRESENT', 'ABSENT'))

) ENGINE=InnoDB;


-- 3. CORRECTION REQUESTS TABLE

CREATE TABLE correction_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_id INT NOT NULL,
    student_id INT NOT NULL,
    requested_status VARCHAR(10) NOT NULL,
    reason TEXT NOT NULL,
    request_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    review_remarks TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_correction_attendance
        FOREIGN KEY (attendance_id)
        REFERENCES attendance_records(attendance_id),

    CONSTRAINT fk_correction_students
        FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    CONSTRAINT fk_correction_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES users(user_id),

    CONSTRAINT chk_requested_status
        CHECK (requested_status IN ('PRESENT', 'ABSENT')),

    CONSTRAINT chk_request_status
        CHECK (
            request_status IN ('PENDING', 'APPROVED', 'REJECTED')
        )

) ENGINE=InnoDB;


-- 4. ATTENDANCE AUDIT LOGS TABLE

CREATE TABLE attendance_audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_id INT NOT NULL,
    old_status VARCHAR(10) NOT NULL,
    new_status VARCHAR(10) NOT NULL,
    changed_by INT NOT NULL,
    change_reason TEXT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_attendance
        FOREIGN KEY (attendance_id)
        REFERENCES attendance_records(attendance_id),

    CONSTRAINT fk_audit_user
        FOREIGN KEY (changed_by)
        REFERENCES users(user_id),

    CONSTRAINT chk_audit_old_status
        CHECK (old_status IN ('PRESENT', 'ABSENT')),

    CONSTRAINT chk_audit_new_status
        CHECK (new_status IN ('PRESENT', 'ABSENT'))

) ENGINE=InnoDB;


-- END OF GROUP 4
