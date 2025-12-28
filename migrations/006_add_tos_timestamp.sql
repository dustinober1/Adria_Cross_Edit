-- Migration: 006_add_tos_timestamp.sql
-- Description: Add TOS acceptance timestamp to users table
-- Created: 2025-12-27

-- Add column to track when user accepted Terms of Service
-- For new users only - existing users will have NULL values
ALTER TABLE users ADD COLUMN tos_accepted_at TIMESTAMP;
