-- Migration: 007_add_blog_images_table.sql
-- Description: Add table to store blog images in database

-- The migration runner will handle conversion for SQLite (SERIAL->AUTOINCREMENT, TIMESTAMP->DATETIME, BYTEA->BLOB)

CREATE TABLE IF NOT EXISTS blog_images (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    image_data BYTEA NOT NULL,  -- Will be converted to BLOB for SQLite
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    alt_text TEXT DEFAULT ''
);

-- Create an index on upload_date for faster querying of recent images
CREATE INDEX IF NOT EXISTS idx_blog_images_upload_date ON blog_images(upload_date);