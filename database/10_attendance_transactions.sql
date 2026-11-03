USE attendance_management;

-- Get the first pending correction request
SET @approval_request_id = (
    SELECT MIN(request_id)
    FROM correction_requests
    WHERE request_status = 'PENDING'
);

-- Get the faculty user's ID
SET @reviewer_id = (
    SELECT user_id
    FROM users
    WHERE username = 'faculty1'
);

START TRANSACTION;

-- Lock and retrieve the correction request
SELECT
    attendance_id,
    requested_status
INTO
    @attendance_id,
    @new_status
FROM correction_requests
WHERE request_id = @approval_request_id
AND request_status = 'PENDING'
FOR UPDATE;

-- Lock and retrieve the original attendance status
SELECT status
INTO @old_status
FROM attendance_records
WHERE attendance_id = @attendance_id
FOR UPDATE;

-- Update the attendance record
UPDATE attendance_records
SET
    status = @new_status,
    marked_by = @reviewer_id,
    marked_at = CURRENT_TIMESTAMP
WHERE attendance_id = @attendance_id;

-- Approve the correction request
UPDATE correction_requests
SET
    request_status = 'APPROVED',
    reviewed_by = @reviewer_id,
    reviewed_at = CURRENT_TIMESTAMP,
    review_remarks = 'Approved after faculty verification.'
WHERE request_id = @approval_request_id;

-- Record the attendance change in the audit log
INSERT INTO attendance_audit_logs (
    attendance_id,
    old_status,
    new_status,
    changed_by,
    change_reason
)
SELECT
    @attendance_id,
    @old_status,
    @new_status,
    @reviewer_id,
    reason
FROM correction_requests
WHERE request_id = @approval_request_id;

COMMIT;

-- Select the next pending request
SET @rejection_request_id = (
    SELECT MIN(request_id)
    FROM correction_requests
    WHERE request_status = 'PENDING'
);

START TRANSACTION;

UPDATE correction_requests
SET
    request_status = 'REJECTED',
    reviewed_by = @reviewer_id,
    reviewed_at = CURRENT_TIMESTAMP,
    review_remarks = 'Rejected after faculty verification.'
WHERE request_id = @rejection_request_id
AND request_status = 'PENDING';

COMMIT;