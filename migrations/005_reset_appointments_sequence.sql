-- Reset appointments primary key sequence to fix duplicate key errors
-- This ensures the next ID is higher than any existing ID
SELECT setval(
    pg_get_serial_sequence('appointments', 'id'),
    COALESCE((SELECT MAX(id) FROM appointments), 0) + 1,
    false
);
