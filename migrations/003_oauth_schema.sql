-- Migration: 003_oauth_schema.sql
-- Description: Add columns for OAuth support to users table and create oauth_tokens table

-- Up Migration
-- Add OAuth columns to users table
ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN provider TEXT; -- 'google', 'apple', or 'local'
ALTER TABLE users ADD COLUMN provider_id TEXT;
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN profile_picture TEXT;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client'; -- 'client' or 'admin'
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create oauth_tokens table
CREATE TABLE oauth_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'google' or 'apple'
    access_token TEXT,
    refresh_token TEXT,
    token_type TEXT,
    expires_at TIMESTAMP,
    scope TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Down Migration (commented out for safety, standard practice is to separate down migrations if needed)
-- DROP TABLE oauth_tokens;
-- ALTER TABLE users DROP COLUMN email;
-- ALTER TABLE users DROP COLUMN provider;
-- ALTER TABLE users DROP COLUMN provider_id;
-- ALTER TABLE users DROP COLUMN display_name;
-- ALTER TABLE users DROP COLUMN profile_picture;
-- ALTER TABLE users DROP COLUMN email_verified;
-- ALTER TABLE users DROP COLUMN role;
-- ALTER TABLE users DROP COLUMN created_at;
