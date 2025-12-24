-- Initial Schema Migration

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    service TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Intake Submissions
CREATE TABLE IF NOT EXISTS intake_submissions (
    id SERIAL PRIMARY KEY,
    form_type TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    data TEXT NOT NULL,
    files TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    is_confirmed BOOLEAN DEFAULT FALSE,
    confirmation_token TEXT UNIQUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP
);

-- Availability Config
CREATE TABLE IF NOT EXISTS availability_config (
    id SERIAL PRIMARY KEY,
    day_of_week INTEGER UNIQUE,
    slots TEXT DEFAULT '[]',
    is_enabled INTEGER DEFAULT 1
);

-- Availability Overrides
CREATE TABLE IF NOT EXISTS availability_overrides (
    id SERIAL PRIMARY KEY,
    date TEXT UNIQUE NOT NULL,
    slots TEXT DEFAULT '[]',
    is_enabled INTEGER DEFAULT 1
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_client BOOLEAN DEFAULT FALSE,
    verification_code TEXT
);

-- Clothing Categories
CREATE TABLE IF NOT EXISTS clothing_categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- Clothing Items
CREATE TABLE IF NOT EXISTS clothing_items (
    id SERIAL PRIMARY KEY,
    session_id TEXT,
    user_id INTEGER REFERENCES users(id),
    category_id INTEGER REFERENCES clothing_categories(id),
    image_path TEXT NOT NULL,
    color_tags TEXT[],
    style_tags TEXT[],
    season_tags TEXT[],
    brand TEXT,
    pattern TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Seed Categories
INSERT INTO clothing_categories (name) VALUES ('tops') ON CONFLICT (name) DO NOTHING;
INSERT INTO clothing_categories (name) VALUES ('bottoms') ON CONFLICT (name) DO NOTHING;
INSERT INTO clothing_categories (name) VALUES ('shoes') ON CONFLICT (name) DO NOTHING;
INSERT INTO clothing_categories (name) VALUES ('accessories') ON CONFLICT (name) DO NOTHING;
