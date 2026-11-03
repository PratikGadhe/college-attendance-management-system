USE attendance_management;

START TRANSACTION;

-- Insert 2 sample pending correction requests
-- Select only existing ABSENT attendance records.

INSERT INTO correction_requests (
    attendance_id,
    student_id,
    requested_status,
    reason,
    request_status
)
SELECT
    attendance_id,
    student_id,
    'PRESENT',
    'I was present in this lecture, but I was mistakenly marked absent.',
    'PENDING'
FROM attendance_records
WHERE status = 'ABSENT'
ORDER BY attendance_id
LIMIT 2;

COMMIT;