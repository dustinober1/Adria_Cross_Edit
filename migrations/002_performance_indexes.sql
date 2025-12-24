-- Database Performance Optimization: Indexing

-- Index for appointment lookups by date and time (common for checking availability)
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(date, time);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON appointments(email);

-- Index for newsletter subscription lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);

-- Index for availability overrides
CREATE INDEX IF NOT EXISTS idx_availability_overrides_date ON availability_overrides(date);

-- Index for clothing matcher performance
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_session ON clothing_items(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_clothing_items_category ON clothing_items(category_id);
CREATE INDEX IF NOT EXISTS idx_clothing_items_expiry ON clothing_items(expires_at);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
