-- Migration: 004_oauth_password_nullable.sql
-- Description: Make password column nullable to support OAuth users who don't have passwords
-- OAuth users (Google, Apple, etc.) authenticate via their provider and don't need local passwords

-- PostgreSQL: ALTER COLUMN to drop NOT NULL constraint
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Add a comment explaining the nullable password
COMMENT ON COLUMN users.password IS 'Password hash for local auth users. NULL for OAuth users who authenticate via provider.';
