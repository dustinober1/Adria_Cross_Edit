const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

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

  CREATE TABLE IF NOT EXISTS intake_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_type TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    data TEXT NOT NULL, -- JSON string of form data
    files TEXT,        -- JSON string of filenames
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS availability_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER UNIQUE, -- 0 (Sunday) to 6 (Saturday)
    slots TEXT DEFAULT '[]',     -- JSON array of strings: ["09:00 AM", "10:00 AM"]
    is_enabled INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`);

// Initialize default availability if empty
const initAvailability = () => {
    const count = db.prepare('SELECT COUNT(*) as count FROM availability_config').get().count;
    if (count === 0) {
        const defaultSlots = JSON.stringify(["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"]);
        const stmt = db.prepare('INSERT INTO availability_config (day_of_week, slots, is_enabled) VALUES (?, ?, ?)');
        for (let i = 1; i <= 5; i++) { // Mon-Fri
            stmt.run(i, defaultSlots, 1);
        }
        // Weekends disabled by default
        stmt.run(0, '[]', 0);
        stmt.run(6, '[]', 0);
    }
};
initAvailability();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'adria-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Auth check middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Initialize admin user
const initAdmin = () => {
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    if (!row) {
        const password = process.env.ADMIN_PASSWORD || 'adria2025';
        const hash = bcrypt.hashSync(password, 10);
        db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', hash);
    }
};
initAdmin();

// API Endpoints

// Public: Book an appointment
app.post('/api/appointments', (req, res) => {
    const { name, email, date, time, service, message } = req.body;
    const existing = db.prepare('SELECT id FROM appointments WHERE date = ? AND time = ? AND status != "cancelled"').get(date, time);
    if (existing) {
        return res.status(400).json({ error: 'This slot is already booked.' });
    }
    try {
        db.prepare('INSERT INTO appointments (name, email, date, time, service, message) VALUES (?, ?, ?, ?, ?, ?)').run(name, email, date, time, service, message);
        res.status(201).json({ message: 'Appointment requested successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Public: Submit Intake Form
app.post('/api/intake', upload.array('photos', 5), (req, res) => {
    try {
        const { form_type, name, email, ...formData } = req.body;
        const filenames = req.files ? req.files.map(f => f.filename) : [];

        const stmt = db.prepare('INSERT INTO intake_submissions (form_type, name, email, data, files) VALUES (?, ?, ?, ?, ?)');
        stmt.run(form_type, name, email, JSON.stringify(formData), JSON.stringify(filenames));

        res.status(201).json({ message: 'Intake form submitted successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit form' });
    }
});

// Admin Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.userId = user.id;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Admin Data
app.get('/api/appointments', isAuthenticated, (req, res) => {
    const data = db.prepare('SELECT * FROM appointments ORDER BY created_at DESC').all();
    res.json(data);
});

// Public: Get available slots for a specific date
app.get('/api/available-slots', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const dayOfWeek = new Date(date).getUTCDay();
    const config = db.prepare('SELECT * FROM availability_config WHERE day_of_week = ?').get(dayOfWeek);

    if (!config || !config.is_enabled) {
        return res.json([]);
    }

    const allSlots = JSON.parse(config.slots);

    // Find which slots are already taken
    const booked = db.prepare('SELECT time FROM appointments WHERE date = ? AND status != "cancelled"').all(date);
    const bookedTimes = booked.map(b => b.time);

    const available = allSlots.filter(slot => !bookedTimes.includes(slot));
    res.json(available);
});

// Admin: Get availability config
app.get('/api/availability', isAuthenticated, (req, res) => {
    const config = db.prepare('SELECT * FROM availability_config ORDER BY day_of_week ASC').all();
    const formatted = config.map(c => ({
        ...c,
        slots: JSON.parse(c.slots)
    }));
    res.json(formatted);
});

// Admin: Update availability config
app.post('/api/availability', isAuthenticated, (req, res) => {
    const { day_of_week, slots, is_enabled } = req.body;
    try {
        const stmt = db.prepare('UPDATE availability_config SET slots = ?, is_enabled = ? WHERE day_of_week = ?');
        stmt.run(JSON.stringify(slots), is_enabled ? 1 : 0, day_of_week);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/intake', isAuthenticated, (req, res) => {
    const data = db.prepare('SELECT * FROM intake_submissions ORDER BY created_at DESC').all();
    res.json(data);
});

app.patch('/api/appointments/:id', isAuthenticated, (req, res) => {
    db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
    res.json({ success: true });
});

// Static files
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
