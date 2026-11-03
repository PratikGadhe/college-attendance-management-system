# College Attendance Management System

A full-stack, enterprise-grade **College Attendance Management System** designed for higher education institutions. The platform provides unified role-based workflows for **Administrators**, **Faculty**, and **Students**, featuring real-time attendance marking, correction request adjudication, low-attendance alerts with automated recovery calculations, and comprehensive institutional reporting.

---

## Architecture Overview

```
college-attendance-management-system/
├── backend/                  # FastAPI REST API & SQLAlchemy ORM
│   ├── app/
│   │   ├── core/             # Configuration & security settings
│   │   ├── database/         # Database connection & session pooling
│   │   ├── dependencies/     # Dependency injection & RBAC guards
│   │   ├── models/           # SQLAlchemy 2.x declarative ORM models
│   │   ├── routers/          # API route definitions by role and module
│   │   ├── schemas/          # Pydantic schemas for request/response validation
│   │   └── services/         # Business logic layer
│   ├── tests/                # Automated verification suites
│   ├── .env.example          # Sample environment configuration
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # React 19 + Vite + TypeScript SPA
│   ├── src/
│   │   ├── api/              # Axios HTTP client & API service modules
│   │   ├── app/              # Router, App root, and Providers
│   │   ├── components/       # Common reusable UI components & tables
│   │   ├── context/          # React AuthContext & role session management
│   │   ├── features/         # Role-specific modules (Admin, Faculty, Student)
│   │   ├── types/            # TypeScript interfaces aligned with backend schemas
│   │   └── utils/            # RFC-4180 CSV export with UTF-8 BOM
│   ├── index.html            # Single page app entry HTML
│   └── package.json          # Node dependencies & scripts
│
└── database/                 # Normalized MySQL 8.0 database scripts (DDL & Seeds)
    ├── 01_create_database.sql
    ├── 02_create_tables.sql
    ├── 03_create_academic_tables.sql
    ├── 04_create_relationship_tables.sql
    ├── 05_create_attendance_tables.sql
    ├── 06_insert_master_data.sql
    ├── 07_insert_attendance_data.sql
    ├── 08_insert_correction_requests.sql
    ├── 09_attendance_reports.sql
    ├── 10_attendance_transactions.sql
    └── 11_database_integrity_checks.sql
```

---

## Technology Stack

- **Backend**: Python 3.13, FastAPI, SQLAlchemy 2.x, Pydantic, PyMySQL, Uvicorn
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Lucide React, Recharts, TanStack Query
- **Database**: MySQL 8.0 (13 normalized relational tables with foreign keys, indexes, and audit logging)
- **Authentication**: Prototype demo authentication with role-based identity header (`X-Demo-User-ID`)

---

## Key Features

### 1. Administrator Portal
- **Dashboard & Analytics**: Real-time KPI summaries, attendance distributions, and recent lecture activity.
- **Academic Structure Management**: CRUD operations for Departments, Classes, Subjects, Enrollments, and Teaching Assignments.
- **Institutional Reporting Center (`/admin/reports`)**:
  - Department-wise aggregate attendance
  - Class-wise performance and division breakdown
  - Subject-level lecture records and metrics
  - Faculty teaching workload and attendance performance
  - Student cumulative attendance tracking
  - Low-attendance defaulter warnings with automated recovery calculations
  - Granular lecture audit logs with date-range filters
- **Data Export**: RFC-4180 compliant CSV export with UTF-8 BOM encoding for direct compatibility with Microsoft Excel, Apple Numbers, and Google Sheets.
- **Lecture Oversight (`/admin/lectures`)**: Centralized institutional lecture status tracking and attendance audit inspection.

### 2. Faculty Portal
- **Course Instructional Allocations**: View assigned subjects, classes, and divisions.
- **Lecture Scheduling & Management**: Create, edit, and cancel lecture sessions.
- **Interactive Attendance Marking**: Bulk roster attendance marking with present/absent toggling and validation.
- **Correction Request Adjudication**: Review student attendance correction disputes with approval/rejection workflows, reviewer remarks, and audit trail generation.
- **Faculty Analytics & Reports**: Section-level attendance rates, student tracking, and weekly lecture volume charts.

### 3. Student Portal
- **Personalized Attendance Dashboard**: Subject-wise attendance percentages with prominent minimum 75% threshold status indicator.
- **Attendance History Log**: Chronological record of all conducted sessions, status breakdown, and lecture details.
- **Attendance Correction Requests**: Create dispute requests for misrecorded sessions with reason tracking and status monitoring (Pending, Approved, Rejected).

---

## Database Schema (13 Normalized Tables)

1. `roles` — System roles (ADMIN, FACULTY, STUDENT)
2. `users` — User credentials and account statuses
3. `departments` — Academic departments
4. `classes` — Classes, divisions, semesters, and academic years
5. `subjects` — Academic subjects and course codes
6. `students` — Student profiles linked to user accounts
7. `faculty` — Faculty profiles linked to user accounts
8. `enrollments` — Student class enrollments
9. `teaching_assignments` — Faculty course instruction mappings
10. `lectures` — Scheduled and conducted lecture sessions
11. `attendance_records` — Granular attendance marks (PRESENT, ABSENT)
12. `correction_requests` — Student attendance dispute tickets
13. `attendance_audit_logs` — Immutable audit trail of attendance alterations

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- MySQL Server 8.0+

---

### 1. Database Setup
Log into your MySQL server and execute the initialization scripts in sequence:

```bash
mysql -u root -p < database/01_create_database.sql
mysql -u root -p attendance_management < database/02_create_tables.sql
mysql -u root -p attendance_management < database/03_create_academic_tables.sql
mysql -u root -p attendance_management < database/04_create_relationship_tables.sql
mysql -u root -p attendance_management < database/05_create_attendance_tables.sql
mysql -u root -p attendance_management < database/06_insert_master_data.sql
mysql -u root -p attendance_management < database/07_insert_attendance_data.sql
mysql -u root -p attendance_management < database/08_insert_correction_requests.sql
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your MySQL credentials (DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT)

# Start FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend will be accessible at: `http://127.0.0.1:8000`  
Interactive OpenAPI documentation: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start Vite development server
npm run dev
```

Frontend application will be accessible at: `http://localhost:5173`

---

## Demo Accounts

For demonstration and prototype testing, the system provides one-click demo login buttons or manual username login:

| Role | Username | User ID | Permissions |
| :--- | :--- | :---: | :--- |
| **Administrator** | `admin` | `37` | Institutional master setup, user management, reports, lecture oversight |
| **Faculty Member** | `faculty1` | `38` | Course instruction, lecture scheduling, attendance marking, dispute review |
| **Faculty Member** | `faculty2` | `39` | Course instruction, lecture scheduling, attendance marking, dispute review |
| **Student** | `student01` | `40` | Personal attendance tracking, history log, correction request submission |
| **Student** | `student02` | `41` | Personal attendance tracking, history log, correction request submission |

---

## Testing & Quality Assurance

### Frontend Production Build
```bash
cd frontend
npm run build
```

### Backend Automated Test Suite
```bash
cd backend
PYTHONPATH=. .venv/bin/python tests/verify_phase_b7_full.py
```

---

## License

This project is licensed under the MIT License.
