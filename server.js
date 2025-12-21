const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;
app.set('trust proxy', 1);

// Security: Enforce Environment Variables
if (!process.env.DATABASE_URL) {
    console.warn('CRITICAL: DATABASE_URL is missing. DB features will fail.');
}
if (!process.env.SESSION_SECRET) {
    console.warn('WARNING: SESSION_SECRET is missing. Using insecure default.');
}
if (!process.env.ADMIN_PASSWORD) {
    console.warn('CRITICAL: ADMIN_PASSWORD not set. Admin login will use insecure default until set.');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Rate Limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

const appointmentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 appointments per hour
    message: { error: 'Too many requests. Please try again later.' }
});

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Basic DDOS protection
    message: { error: 'Too many requests from this IP.' }
});

app.use(globalLimiter);

// Multer setup with File Security
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
        cb(null, 'styledata-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images (JPEG, PNG, WebP) are allowed!'));
    }
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

            CREATE TABLE IF NOT EXISTS availability_overrides (
                id SERIAL PRIMARY KEY,
                date TEXT UNIQUE NOT NULL,
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
            // Priority: Env Var > Insecure default (only for dev, warn above)
            const password = process.env.ADMIN_PASSWORD || 'adria-dev-2025';
            const hash = bcrypt.hashSync(password, 10);
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

// ============================================
// Email Configuration
// ============================================
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    if (!process.env.EMAIL_HOST) {
        console.warn('Email not configured (EMAIL_HOST missing). Skipping email.');
        return;
    }
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Adria Cross" <hello@adriacrossedit.com>',
            to,
            subject,
            html
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Middleware
app.use(express.json({ limit: '10kb' })); // Limit JSON size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'insecure-default-key-adria-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) next();
    else res.status(401).json({ error: 'Unauthorized' });
};

// API Endpoints
app.post('/api/appointments', appointmentLimiter, async (req, res) => {
    const { name, email, date, time, service, message } = req.body;

    // Basic validation
    if (!name || !email || !date || !time) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const existing = await pool.query('SELECT id FROM appointments WHERE date = $1 AND time = $2 AND status != $3', [date, time, 'cancelled']);
        if (existing.rows.length > 0) return res.status(400).json({ error: 'Already booked.' });

        await pool.query('INSERT INTO appointments (name, email, date, time, service, message) VALUES ($1, $2, $3, $4, $5, $6)', [name, email, date, time, service, message]);

        // Send Confirmation Emails
        const adminHtml = `<h3>New Appointment Request</h3><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Date:</strong> ${date} at ${time}</p><p><strong>Service:</strong> ${service}</p><p><strong>Message:</strong> ${message}</p>`;
        const userHtml = `<h3>Appointment Request Received</h3><p>Hi ${name},</p><p>Thanks for requesting an appointment for <strong>${service}</strong> on ${date} at ${time}.</p><p>I will review your request and get back to you shortly to confirm.</p><p>Best,<br>Adria Cross</p>`;

        // Fire and forget email sending
        Promise.all([
            sendEmail(process.env.ADMIN_EMAIL || 'hello@adriacrossedit.com', `New Booking: ${name} - ${date}`, adminHtml),
            sendEmail(email, 'Appointment Request Received - Adria Cross', userHtml)
        ]).catch(err => console.error('Email sending failed', err));

        res.status(201).json({ message: 'Success! Confirmation email sent.' });
    } catch (err) { res.status(500).json({ error: 'DB Error' }); }
});

app.post('/api/intake', upload.array('photos', 5), async (req, res) => {
    try {
        const { form_type, name, email, ...formData } = req.body;
        if (!name || !email || !form_type) {
            return res.status(400).json({ error: 'Name, email, and form type are required.' });
        }
        const filenames = req.files ? req.files.map(f => f.filename) : [];
        await pool.query('INSERT INTO intake_submissions (form_type, name, email, data, files) VALUES ($1, $2, $3, $4, $5)', [form_type, name, email, JSON.stringify(formData), JSON.stringify(filenames)]);

        // Send Notification Emails
        const adminHtml = `<h3>New Intake Form Submission</h3><p><strong>Type:</strong> ${form_type}</p><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p>See admin panel for full details.</p>`;
        const userHtml = `<h3>Profile Received</h3><p>Hi ${name},</p><p>Thank you for submitting your style profile. I have received your information and photos.</p><p>I'll be in touch soon!</p><p>Best,<br>Adria Cross</p>`;

        Promise.all([
            sendEmail(process.env.ADMIN_EMAIL || 'hello@adriacrossedit.com', `New Intake: ${name} (${form_type})`, adminHtml),
            sendEmail(email, 'Style Profile Received - Adria Cross', userHtml)
        ]).catch(err => console.error('Email sending failed', err));

        res.status(201).json({ message: 'Success! Confirmation email sent.' });
    } catch (err) { res.status(500).json({ error: 'DB Error' }); }
});

app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (user.rows[0] && bcrypt.compareSync(password, user.rows[0].password)) {
            req.session.userId = user.rows[0].id;
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

app.post('/api/logout', (req, res) => { req.session.destroy(); res.json({ success: true }); });

app.get('/api/appointments', isAuthenticated, async (req, res) => {
    const data = await pool.query('SELECT * FROM appointments ORDER BY created_at DESC');
    res.json(data.rows);
});

app.get('/api/available-slots', async (req, res) => {
    const { date } = req.query;
    if (!date) return res.json([]);

    // Check for override (now the ONLY source of truth)
    const override = await pool.query('SELECT * FROM availability_overrides WHERE date = $1', [date]);
    let allSlots = [];
    let isEnabled = false; // Default to unavailable

    if (override.rows[0]) {
        allSlots = JSON.parse(override.rows[0].slots);
        isEnabled = override.rows[0].is_enabled === 1;
    }

    if (!isEnabled) return res.json([]);

    const booked = await pool.query('SELECT time FROM appointments WHERE date = $1 AND status != $2', [date, 'cancelled']);
    const bookedTimes = booked.rows.map(b => b.time);
    res.json(allSlots.filter(s => !bookedTimes.includes(s)));
});

app.get('/api/availability-overrides', isAuthenticated, async (req, res) => {
    const data = await pool.query('SELECT * FROM availability_overrides');
    res.json(data.rows.map(r => ({ ...r, slots: JSON.parse(r.slots) })));
});

app.post('/api/availability-overrides', isAuthenticated, async (req, res) => {
    const { date, slots, is_enabled } = req.body;
    await pool.query(
        'INSERT INTO availability_overrides (date, slots, is_enabled) VALUES ($1, $2, $3) ON CONFLICT (date) DO UPDATE SET slots = $2, is_enabled = $3',
        [date, JSON.stringify(slots), is_enabled ? 1 : 0]
    );
    res.json({ success: true });
});

app.delete('/api/availability-overrides/:date', isAuthenticated, async (req, res) => {
    await pool.query('DELETE FROM availability_overrides WHERE date = $1', [req.params.date]);
    res.json({ success: true });
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

// Create Blog Post
app.post('/api/blog', isAuthenticated, async (req, res) => {
    try {
        const { title, summary, content } = req.body;
        if (!title || !summary || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const filename = `${slug}.html`;
        const filePath = path.join(__dirname, 'blog', filename);
        const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // 1. Generate HTML Content
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Adria Cross Style Blog</title>
    <meta name="description" content="${summary}">
    <link rel="stylesheet" href="../css/landing.min.css">
    <style>
        .blog-post-header { text-align: center; margin-top: 8rem; margin-bottom: 3rem; padding: 0 1rem; }
        .blog-post-header h1 { color: #d4a574; font-size: 2.5rem; font-family: 'Montserrat', sans-serif; margin-bottom: 1rem; }
        .blog-meta { color: #888; font-size: 0.9rem; font-family: 'Montserrat', sans-serif; }
        .blog-content { max-width: 800px; margin: 0 auto 4rem auto; padding: 2rem; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(212, 165, 116, 0.08); font-family: 'Montserrat', sans-serif; line-height: 1.8; color: #444; }
        .blog-content h2, .blog-content h3 { color: #c19a5d; margin-top: 2rem; margin-bottom: 1rem; }
        .blog-content ul { margin-left: 1.5rem; margin-bottom: 1.5rem; }
        .back-link { display: block; margin: 2rem auto; text-align: center; font-weight: 600; color: #c19a5d; text-decoration: none; }
    </style>
</head>
<body>
    <nav class="top-nav">
        <div class="nav-container">
            <div class="nav-logo"><a href="../index.html" class="has-logo"><img src="../images/logo.webp" class="logo-image"><span class="logo-text">Adria Cross</span></a></div>
            <ul class="nav-menu">
                <li><a href="../index.html">Home</a></li>
                <li><a href="../about.html">About</a></li>
                <li><a href="../services.html">Services</a></li>
                <li><a href="../blog.html" class="active">Blog</a></li>
                <li><a href="../contact.html">Contact</a></li>
            </ul>
        </div>
    </nav>
    <main>
        <article>
            <div class="blog-post-header">
                <h1>${title}</h1>
                <p class="blog-meta">Published on ${dateStr} • By Adria Cross</p>
            </div>
            <div class="blog-content">
                ${content}
                <a href="../blog.html" class="back-link">← Back to Blog</a>
            </div>
        </article>
    </main>
    <footer class="site-footer"><div class="footer-bottom"><p class="footer-copyright">© 2025 Adria Cross. All rights reserved.</p></div></footer>
</body>
</html>`;

        fs.writeFileSync(filePath, htmlContent);

        // 2. Update Index (blog.html)
        const indexPath = path.join(__dirname, 'blog.html');
        let indexHtml = fs.readFileSync(indexPath, 'utf8');

        const newSummary = `
            <article class="blog-article">
                <h2><a href="blog/${filename}" style="text-decoration: none; color: inherit;">${title}</a></h2>
                <p class="blog-meta">Published on ${dateStr}</p>
                <p>${summary}</p>
                <a href="blog/${filename}" class="btn-cta btn-secondary-cta" style="padding: 0.5rem 1rem; font-size: 0.9rem; margin-top: 1rem; display: inline-block;">Read Article →</a>
            </article>`;

        // Insert after comment
        indexHtml = indexHtml.replace('<!-- Blog Article Summaries -->', '<!-- Blog Article Summaries -->\n' + newSummary);
        fs.writeFileSync(indexPath, indexHtml);

        // 3. Update Search Index
        const searchPath = path.join(__dirname, 'search.json');
        if (fs.existsSync(searchPath)) {
            const searchData = JSON.parse(fs.readFileSync(searchPath, 'utf8'));
            searchData.push({
                title: title,
                category: "Blog",
                url: `/blog/${filename}`,
                keywords: "blog, " + title.toLowerCase(),
                summary: summary
            });
            fs.writeFileSync(searchPath, JSON.stringify(searchData, null, 2));
        }

        res.status(201).json({ success: true, url: `/blog/${filename}` });

    } catch (err) {
        console.error('Blog Error:', err);
        res.status(500).json({ error: 'Failed to publish post.' });
    }
});

app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(UPLOAD_ROOT));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Something broke!' });
});

app.listen(port, () => console.log(`Run: http://localhost:${port}`));
