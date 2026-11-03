
-- ============================================
-- ATTENDANCE MANAGEMENT SYSTEM
-- PHASE 2: CORE TABLE CREATION
-- ============================================

USE attendance_management;


-- 1. ROLES TABLE
-- Stores application roles

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;


-- 2. DEPARTMENTS TABLE
-- Stores academic department information

CREATE TABLE departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB;


-- 3. USERS TABLE
-- Stores login and account information

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_roles
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id),

    CONSTRAINT chk_user_status
        CHECK (account_status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;


-- END OF CORE TABLE CREATION
