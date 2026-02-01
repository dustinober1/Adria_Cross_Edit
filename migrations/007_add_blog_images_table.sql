-- Migration: 007_add_blog_images_table.sql
-- Description: Add table to store blog images in database

CREATE TABLE IF NOT EXISTS blog_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    image_data BLOB NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    alt_text TEXT DEFAULT ''
);

-- Create an index on upload_date for faster querying of recent images
CREATE INDEX IF NOT EXISTS idx_blog_images_upload_date ON blog_images(upload_date);