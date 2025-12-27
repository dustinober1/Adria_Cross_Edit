-- Add proposed times column to appointments table
-- Note: SQLite doesn't support IF NOT EXISTS on ALTER TABLE in older versions
-- This migration is safe to run even if column already exists (will error if already exists, which is ok)
CREATE TABLE IF NOT EXISTS appointments_new (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    service TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    proposed_times TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO appointments_new SELECT id, name, email, date, time, service, message, status, NULL, created_at FROM appointments;
DROP TABLE appointments;
ALTER TABLE appointments_new RENAME TO appointments;
