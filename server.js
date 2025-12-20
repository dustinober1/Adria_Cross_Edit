const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Database setup
const db = new Database('appointments.db');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    service TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'adria-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Auth check middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Initialize admin user if none exists
const initAdmin = () => {
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    if (!row) {
        const password = process.env.ADMIN_PASSWORD || 'adria2025';
        const hash = bcrypt.hashSync(password, 10);
        db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', hash);
        console.log('Admin user created with default password.');
    }
};
initAdmin();

// API Endpoints

// Public: Book an appointment
app.post('/api/appointments', (req, res) => {
    const { name, email, date, time, service, message } = req.body;

    if (!name || !email || !date || !time) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for double booking
    const existing = db.prepare('SELECT id FROM appointments WHERE date = ? AND time = ? AND status != "cancelled"').get(date, time);
    if (existing) {
        return res.status(400).json({ error: 'This slot is already booked. Please choose another time.' });
    }

    try {
        const stmt = db.prepare('INSERT INTO appointments (name, email, date, time, service, message) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run(name, email, date, time, service, message);
        res.status(201).json({ message: 'Appointment requested successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.userId = user.id;
        res.json({ success: true, message: 'Logged in' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Admin: Get all appointments
app.get('/api/appointments', isAuthenticated, (req, res) => {
    const appointments = db.prepare('SELECT * FROM appointments ORDER BY date ASC, time ASC').all();
    res.json(appointments);
});

// Admin: Update appointment status
app.patch('/api/appointments/:id', isAuthenticated, (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    try {
        db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve admin page (protected by frontend check too)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
