const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection
// For Render/Supabase, use DATABASE_URL. For local, you'll need a local Postgres or we can keep it flexible.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Multer setup for file uploads (Note: In Render free tier, these will reset on every deploy)
const UPLOAD_ROOT = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_ROOT)) {
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_ROOT);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Initialize Tables
const initDb = async () => {
    try {
        await pool.query(`
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

            CREATE TABLE IF NOT EXISTS intake_submissions (
                id SERIAL PRIMARY KEY,
                form_type TEXT NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                data TEXT NOT NULL,
                files TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS availability_config (
                id SERIAL PRIMARY KEY,
                day_of_week INTEGER UNIQUE,
                slots TEXT DEFAULT '[]',
                is_enabled INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
        `);

        // Defaults
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
        if (userCheck.rows.length === 0) {
            const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'adria2025', 10);
            await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['admin', hash]);
        }

        const availCheck = await pool.query('SELECT COUNT(*) FROM availability_config');
        if (parseInt(availCheck.rows[0].count) === 0) {
            const defaultSlots = JSON.stringify(["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"]);
            for (let i = 0; i < 7; i++) {
                const enabled = (i > 0 && i < 6) ? 1 : 0;
                const slots = enabled ? defaultSlots : '[]';
                await pool.query('INSERT INTO availability_config (day_of_week, slots, is_enabled) VALUES ($1, $2, $3)', [i, slots, enabled]);
            }
        }
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};
initDb();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'adria-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) next();
    else res.status(401).json({ error: 'Unauthorized' });
};

// API Endpoints
app.post('/api/appointments', async (req, res) => {
    const { name, email, date, time, service, message } = req.body;
    try {
        const existing = await pool.query('SELECT id FROM appointments WHERE date = $1 AND time = $2 AND status != $3', [date, time, 'cancelled']);
        if (existing.rows.length > 0) return res.status(400).json({ error: 'Already booked.' });

        await pool.query('INSERT INTO appointments (name, email, date, time, service, message) VALUES ($1, $2, $3, $4, $5, $6)', [name, email, date, time, service, message]);
        res.status(201).json({ message: 'Success!' });
    } catch (err) { res.status(500).json({ error: 'DB Error' }); }
});

app.post('/api/intake', upload.array('photos', 5), async (req, res) => {
    try {
        const { form_type, name, email, ...formData } = req.body;
        const filenames = req.files ? req.files.map(f => f.filename) : [];
        await pool.query('INSERT INTO intake_submissions (form_type, name, email, data, files) VALUES ($1, $2, $3, $4, $5)', [form_type, name, email, JSON.stringify(formData), JSON.stringify(filenames)]);
        res.status(201).json({ message: 'Success!' });
    } catch (err) { res.status(500).json({ error: 'DB Error' }); }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (user.rows[0] && bcrypt.compareSync(password, user.rows[0].password)) {
        req.session.userId = user.rows[0].id;
        res.json({ success: true });
    } else res.status(401).json({ error: 'Fail' });
});

app.post('/api/logout', (req, res) => { req.session.destroy(); res.json({ success: true }); });

app.get('/api/appointments', isAuthenticated, async (req, res) => {
    const data = await pool.query('SELECT * FROM appointments ORDER BY created_at DESC');
    res.json(data.rows);
});

app.get('/api/available-slots', async (req, res) => {
    const { date } = req.query;
    const dayOfWeek = new Date(date).getUTCDay();
    const config = await pool.query('SELECT * FROM availability_config WHERE day_of_week = $1', [dayOfWeek]);
    if (!config.rows[0] || !config.rows[0].is_enabled) return res.json([]);

    const allSlots = JSON.parse(config.rows[0].slots);
    const booked = await pool.query('SELECT time FROM appointments WHERE date = $1 AND status != $2', [date, 'cancelled']);
    const bookedTimes = booked.rows.map(b => b.time);
    res.json(allSlots.filter(s => !bookedTimes.includes(s)));
});

app.get('/api/availability', isAuthenticated, async (req, res) => {
    const data = await pool.query('SELECT * FROM availability_config ORDER BY day_of_week ASC');
    res.json(data.rows.map(c => ({ ...c, slots: JSON.parse(c.slots) })));
});

app.post('/api/availability', isAuthenticated, async (req, res) => {
    const { day_of_week, slots, is_enabled } = req.body;
    await pool.query('UPDATE availability_config SET slots = $1, is_enabled = $2 WHERE day_of_week = $3', [JSON.stringify(slots), is_enabled ? 1 : 0, day_of_week]);
    res.json({ success: true });
});

app.get('/api/intake', isAuthenticated, async (req, res) => {
    const data = await pool.query('SELECT * FROM intake_submissions ORDER BY created_at DESC');
    res.json(data.rows);
});

app.patch('/api/appointments/:id', isAuthenticated, async (req, res) => {
    await pool.query('UPDATE appointments SET status = $1 WHERE id = $2', [req.body.status, req.params.id]);
    res.json({ success: true });
});

app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(UPLOAD_ROOT));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.listen(port, () => console.log(`Run: http://localhost:${port}`));
