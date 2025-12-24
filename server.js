const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3');
const helmet = require('helmet');
const logger = require('./logger');
const Joi = require('joi');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { runMigrations } = require('./scripts/migrate');

// ============================================
// Square SDK Configuration
// ============================================
const { Client, Environment } = require('square');

let squareClient = null;
let paymentsApi = null;
let invoicesApi = null;
let customersApi = null;

if (process.env.SQUARE_ACCESS_TOKEN) {
    squareClient = new Client({
        accessToken: process.env.SQUARE_ACCESS_TOKEN,
        environment: process.env.SQUARE_ENVIRONMENT === 'production'
            ? Environment.Production
            : Environment.Sandbox
    });
    paymentsApi = squareClient.paymentsApi;
    invoicesApi = squareClient.invoicesApi;
    customersApi = squareClient.customersApi;
    logger.info(`Square SDK initialized in ${process.env.SQUARE_ENVIRONMENT || 'sandbox'} mode`);
} else {
    logger.warn('SQUARE_ACCESS_TOKEN not set. Payment features will be disabled.');
}

const app = express();
const port = process.env.PORT || 3000;
app.set('trust proxy', 1);

// ============================================
// API Documentation (Swagger)
// ============================================
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Adria Cross Edit API',
            version: '1.0.0',
            description: 'API documentation for the Adria Cross Edit full-stack application',
        },
        servers: [
            {
                url: process.env.BASE_URL || `http://localhost:${port}`,
                description: 'Current Server',
            },
        ],
    },
    apis: ['./server.js'], // Files containing annotations
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Security: Enforce Environment Variables
if (!process.env.DATABASE_URL) {
    logger.error('CRITICAL: DATABASE_URL is missing. DB features will fail.');
}
if (!process.env.SESSION_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        logger.error('CRITICAL: SESSION_SECRET is missing in production. Exiting.');
        process.exit(1);
    }
    logger.warn('WARNING: SESSION_SECRET is missing. Using insecure default for development.');
}
if (!process.env.ADMIN_PASSWORD) {
    if (process.env.NODE_ENV === 'production') {
        logger.error('CRITICAL: ADMIN_PASSWORD is missing in production. Exiting.');
        process.exit(1);
    }
    logger.warn('CRITICAL: ADMIN_PASSWORD not set. Admin login will use insecure default until set.');
}

let pool;
let db;

// Initialize database based on DATABASE_URL
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('sqlite:')) {
    // SQLite configuration
    const sqlite = require('sqlite');
    const { open } = require('sqlite');

    const dbPath = process.env.DATABASE_URL.replace('sqlite:', '');
    let db;

    // Create wrapper pool-like interface for SQLite
    pool = {
        query: async (sql, params = []) => {
            try {
                if (!db) {
                    throw new Error('Database not initialized');
                }
                if (sql.trim().toLowerCase().startsWith('select')) {
                    const result = await db.all(sql, params);
                    return { rows: result };
                } else {
                    await db.run(sql, params);
                    return { rows: [] };
                }
            } catch (error) {
                throw error;
            }
        }
    };

    // Initialize SQLite database
    async function initSqliteDb() {
        try {
            db = await open({
                filename: dbPath,
                driver: sqlite3.Database
            });

            // Run central migrations
            await runMigrations(pool);

            // Create default admin user if not exists
            const adminCheck = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
            if (!adminCheck) {
                const password = process.env.ADMIN_PASSWORD || 'adria2025';
                const hash = bcrypt.hashSync(password, 10);
                await db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hash]);
            }

            logger.info('SQLite database initialized successfully');
        } catch (err) {
            logger.error('Error initializing SQLite database:', err);
        }
    }

    // Initialize SQLite database immediately
    initSqliteDb();
} else {
    // PostgreSQL configuration
    const { Pool } = require('pg');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
    });
}

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

// Initialize Tables (PostgreSQL)
const initDb = async () => {
    try {
        await runMigrations(pool);

        // Defaults
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
        if (userCheck.rows.length === 0) {
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
        logger.error('Error initializing database:', err);
    }
};

// Only initialize PostgreSQL if not using SQLite
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('sqlite:')) {
    initDb();
}

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

// Helper function to generate confirmation token
const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const sendEmail = async (to, subject, html, retries = 3) => {
    if (!process.env.EMAIL_HOST) {
        logger.warn('Email not configured (EMAIL_HOST missing). Skipping email.');
        return;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM || '"Adria Cross" <hello@adriacrossedit.com>',
                to,
                subject,
                html
            });
            logger.info(`Email sent to ${to}`);
            return; // Success
        } catch (error) {
            logger.error(`Attempt ${attempt} failed to send email to ${to}:`, error);
            if (attempt === retries) {
                logger.error(`Failed to send email to ${to} after ${retries} attempts.`);
            } else {
                // Wait before retrying (exponential backoff: 1s, 2s, 4s...)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
            }
        }
    }
};

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://js.squareupsandbox.com", "https://js.squareup.com", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://use.fontawesome.com"],
            imgSrc: ["'self'", "data:", "https://www.google-analytics.com", "https://*.cdninstagram.com", "https://*.fbcdn.net"],
            connectSrc: ["'self'", "https://www.google-analytics.com", "https://stats.g.doubleclick.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://use.fontawesome.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'", "https://www.instagram.com"],
        },
    },
}));

// HTTPS Redirect in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(`https://${req.headers.host}${req.url}`);
        }
        next();
    });
}

app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: '10kb' })); // Limit JSON size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-only-insecure-secret',
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

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date(), env: process.env.NODE_ENV || 'development' });
});

// API Endpoints

// Newsletter subscription endpoint
/**
 * @openapi
 * /api/newsletter:
 *   post:
 *     summary: Subscribe to the newsletter
 *     tags: [Newsletter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       201:
 *         description: Subscription successful, confirmation email sent
 *       400:
 *         description: Invalid input
 */
app.post('/api/newsletter', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { error: 'Too many subscription attempts. Please try again later.' }
}), async (req, res) => {
    const schema = Joi.object({
        email: Joi.string().email().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { email } = req.body;

    try {
        const token = generateToken();

        await pool.query(
            'INSERT INTO newsletter_subscriptions (email, confirmation_token) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET confirmation_token = $2, is_confirmed = FALSE',
            [email, token]
        );

        // Send confirmation email
        const confirmUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/confirm-newsletter?token=${token}&email=${encodeURIComponent(email)}`;

        const emailHtml = `
            <h3>Confirm Your Newsletter Subscription</h3>
            <p>Hi there!</p>
            <p>Thank you for subscribing to Adria Cross's style tips newsletter. Please confirm your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 2rem 0;">
                <a href="${confirmUrl}" style="background: linear-gradient(135deg, #d4a574 0%, #c19a5d 100%); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Confirm Subscription</a>
            </div>
            <p>If you didn't request this subscription, you can safely ignore this email.</p>
            <p>Best,<br>Adria Cross</p>
        `;

        await sendEmail(email, 'Please Confirm Your Newsletter Subscription', emailHtml);

        res.status(201).json({
            success: true,
            message: 'Please check your email to confirm your subscription.'
        });

    } catch (err) {
        logger.error('Newsletter subscription error:', err);
        res.status(500).json({ error: 'Failed to subscribe. Please try again.' });
    }
});

// Newsletter confirmation endpoint
app.get('/confirm-newsletter', async (req, res) => {
    const { token, email } = req.query;

    if (!token || !email) {
        return res.status(400).send('Invalid confirmation link.');
    }

    try {
        const result = await pool.query(
            'UPDATE newsletter_subscriptions SET is_confirmed = TRUE, confirmed_at = CURRENT_TIMESTAMP WHERE email = $1 AND confirmation_token = $2 AND is_confirmed = FALSE RETURNING id',
            [email, token]
        );

        if (result.rows.length === 0) {
            return res.status(400).send('Invalid or expired confirmation link.');
        }

        // Send welcome email
        const welcomeHtml = `
            <h3>Welcome to the Adria Cross Newsletter!</h3>
            <p>Hi there,</p>
            <p>You're now subscribed! Get ready for exclusive wardrobe tips, seasonal trends, and special offers delivered straight to your inbox.</p>
            <p>Here's what to expect:</p>
            <ul>
                <li>✨ Weekly style tips and inspiration</li>
                <li>👗 Seasonal wardrobe guides</li>
                <li>🎨 Color trend alerts</li>
                <li>🎁 Exclusive offers for subscribers</li>
            </ul>
            <p>Can't wait to help you transform your wardrobe!</p>
            <p>Best,<br>Adria Cross</p>
        `;

        await sendEmail(email, 'Welcome to Adria Cross Newsletter!', welcomeHtml);

        // Redirect to homepage with success message
        res.redirect('/index.html?newsletter=confirmed');

    } catch (err) {
        console.error('Newsletter confirmation error:', err);
        res.status(500).send('Confirmation failed. Please try again.');
    }
});

app.post('/api/appointments', appointmentLimiter, async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().required(),
        date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
        time: Joi.string().required(),
        service: Joi.string().allow(''),
        message: Joi.string().allow('')
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, date, time, service, message } = req.body;

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
        ]).catch(err => logger.error('Email sending failed', err));

        res.status(201).json({ message: 'Success! Confirmation email sent.' });
    } catch (err) {
        logger.error('Appointment Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
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
    const schema = Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

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
        logger.error('Login error:', err);
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

// ============================================
// Clothing Matcher - Database Initialization
// ============================================
const initClothingMatcherDb = async () => {
    try {
        // Extend users table for client status
        await pool.query(`
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_client BOOLEAN DEFAULT FALSE;
                `);

        await pool.query(`
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code TEXT;
                `);

        // Create clothing categories
        await pool.query(`
                    CREATE TABLE IF NOT EXISTS clothing_categories (
                        id SERIAL PRIMARY KEY,
                        name TEXT UNIQUE NOT NULL
                    );
                `);

        // Create clothing items table
        await pool.query(`
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
                `);

        // Insert default categories
        const categoryCheck = await pool.query('SELECT COUNT(*) FROM clothing_categories');
        if (parseInt(categoryCheck.rows[0].count) === 0) {
            await pool.query(`
                        INSERT INTO clothing_categories (name) VALUES 
                        ('tops'), ('bottoms'), ('shoes'), ('accessories');
                    `);
        }

        console.log('Clothing matcher database initialized successfully');
    } catch (err) {
        console.error('Error initializing clothing matcher database:', err);
    }
};

// Initialize clothing matcher database
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('sqlite:')) {
    // SQLite already initialized above
} else {
    initClothingMatcherDb();
}

// ============================================
// Clothing Matcher Helper Functions
// ============================================
const checkClientStatus = async (userId) => {
    if (!userId) return false;
    const result = await pool.query('SELECT is_client FROM users WHERE id = $1', [userId]);
    return result.rows[0]?.is_client || false;
};

const checkUploadLimit = async (categoryId, userId = null, sessionId = null) => {
    const isClient = await checkClientStatus(userId);
    if (isClient) return { allowed: true, used: 0, limit: 'unlimited' };

    const countResult = await pool.query(`
                SELECT COUNT(*) as count FROM clothing_items 
                WHERE category_id = $1 
                AND (user_id = $2 OR session_id = $3)
                AND (expires_at IS NULL OR expires_at > datetime('now'))
            `, [categoryId, userId, sessionId]);

    // Handle both PostgreSQL (countResult.rows[0].count) and SQLite wrappers
    const countRow = countResult.rows[0];
    const used = parseInt(countRow?.count || countRow?.['COUNT(*)'] || 0);
    return {
        allowed: used < 2,
        used: used,
        limit: 2
    };
};

const generateSessionId = () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const calculateMatchScore = (item1, item2) => {
    let score = 0;

    // Color compatibility (40% weight)
    if (item1.color_tags && item2.color_tags) {
        const commonColors = item1.color_tags.filter(color =>
            item2.color_tags.includes(color)
        );
        score += (commonColors.length / Math.max(item1.color_tags.length, item2.color_tags.length)) * 40;
    }

    // Style compatibility (30% weight)
    if (item1.style_tags && item2.style_tags) {
        const commonStyles = item1.style_tags.filter(style =>
            item2.style_tags.includes(style)
        );
        score += (commonStyles.length / Math.max(item1.style_tags.length, item2.style_tags.length)) * 30;
    }

    // Pattern mixing rules (20% weight)
    if (item1.pattern && item2.pattern) {
        if (item1.pattern === 'solid' && item2.pattern !== 'solid') score += 20;
        else if (item2.pattern === 'solid' && item1.pattern !== 'solid') score += 20;
        else if (item1.pattern === item2.pattern && item1.pattern !== 'solid') score -= 10;
        else score += 10;
    }

    // Season compatibility (10% weight)
    if (item1.season_tags && item2.season_tags) {
        const commonSeasons = item1.season_tags.filter(season =>
            item2.season_tags.includes(season)
        );
        score += (commonSeasons.length / Math.max(item1.season_tags.length, item2.season_tags.length)) * 10;
    }

    return Math.min(100, Math.max(0, score));
};

// ============================================
// Clothing Matcher API Endpoints
// ============================================

// Client verification
app.post('/api/clothing/verify-client', async (req, res) => {
    try {
        const { email, verification_code } = req.body;

        const user = await pool.query(
            'SELECT id FROM users WHERE username = $1 AND verification_code = $2 AND is_client = TRUE',
            [email, verification_code]
        );

        if (user.rows.length > 0) {
            req.session.userId = user.rows[0].id;
            req.session.isClient = true;

            // Clear verification code after use
            await pool.query(
                'UPDATE users SET verification_code = NULL WHERE id = $1',
                [user.rows[0].id]
            );

            res.json({ success: true, isClient: true });
        } else {
            res.status(400).json({ error: 'Invalid verification code' });
        }
    } catch (err) {
        console.error('Verification error:', err);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Request verification code
app.post('/api/clothing/request-verification', async (req, res) => {
    try {
        const { email } = req.body;

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Update user with verification code
        await pool.query(
            'UPDATE users SET verification_code = $1 WHERE username = $2',
            [code, email]
        );

        // Send verification email
        const emailHtml = `<h3>Clothing Matcher Access</h3><p>Your verification code is: <strong>${code}</strong></p><p>Enter this code to unlock unlimited uploads and premium features.</p>`;
        await sendEmail(email, 'Your Clothing Matcher Verification Code', emailHtml);

        res.json({ success: true, message: 'Verification code sent to your email' });
    } catch (err) {
        console.error('Request verification error:', err);
        res.status(500).json({ error: 'Failed to send verification code' });
    }
});

// Upload clothing item
app.post('/api/clothing/upload', upload.single('image'), async (req, res) => {
    try {
        const { category_id, color_tags, style_tags, season_tags, brand, pattern } = req.body;
        const userId = req.session.userId || null;

        // Generate or get session ID for non-authenticated users
        let sessionId = req.session.sessionId;
        if (!userId && !sessionId) {
            sessionId = generateSessionId();
            req.session.sessionId = sessionId;
        }

        // Check upload limits
        const limitCheck = await checkUploadLimit(category_id, userId, sessionId);
        if (!limitCheck.allowed) {
            return res.status(400).json({
                error: 'Upload limit reached',
                used: limitCheck.used,
                limit: limitCheck.limit
            });
        }

        // Process tags
        const colors = color_tags ? color_tags.split(',').map(t => t.trim()).filter(t => t) : [];
        const styles = style_tags ? style_tags.split(',').map(t => t.trim()).filter(t => t) : [];
        const seasons = season_tags ? season_tags.split(',').map(t => t.trim()).filter(t => t) : [];

        // Set expiry for session items (1 week)
        const expiresAt = userId ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const result = await pool.query(`
                    INSERT INTO clothing_items 
                    (session_id, user_id, category_id, image_path, color_tags, style_tags, season_tags, brand, pattern, expires_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING *
                `, [sessionId, userId, category_id, req.file.filename, colors, styles, seasons, brand, pattern, expiresAt]);

        res.json({
            success: true,
            item: result.rows[0],
            limitStatus: limitCheck
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Get user's clothing items
app.get('/api/clothing/', async (req, res) => {
    try {
        const userId = req.session.userId || null;
        const sessionId = req.session.sessionId || null;
        const categoryId = req.query.category_id;

        let query = `
                    SELECT ci.*, cc.name as category_name 
                    FROM clothing_items ci 
                    JOIN clothing_categories cc ON ci.category_id = cc.id 
                    WHERE (ci.user_id = $1 OR ci.session_id = $2)
                    AND (ci.expires_at IS NULL OR ci.expires_at > datetime('now'))
                `;
        let params = [userId, sessionId];

        if (categoryId) {
            query += ' AND ci.category_id = $3';
            params.push(categoryId);
        }

        query += ' ORDER BY ci.created_at DESC';

        const result = await pool.query(query, params);
        res.json({ items: result.rows });
    } catch (err) {
        console.error('Get clothing error:', err);
        res.status(500).json({ error: 'Failed to retrieve clothing' });
    }
});

// Check upload limits
app.get('/api/clothing/check-limit', async (req, res) => {
    try {
        const userId = req.session.userId || null;
        const sessionId = req.session.sessionId || null;

        const categories = await pool.query('SELECT * FROM clothing_categories');
        const limits = {};

        for (const category of categories.rows) {
            limits[category.name] = await checkUploadLimit(category.id, userId, sessionId);
        }

        res.json({
            isClient: userId ? await checkClientStatus(userId) : false,
            limits
        });
    } catch (err) {
        console.error('Check limit error:', err);
        res.status(500).json({ error: 'Failed to check limits' });
    }
});

// Alias for robustness
app.get('/api/clothing/limits', async (req, res) => {
    // Re-use logic from check-limit
    try {
        const userId = req.session.userId || null;
        const sessionId = req.session.sessionId || null;
        const categories = await pool.query('SELECT * FROM clothing_categories');
        const limits = {};
        for (const category of categories.rows) {
            limits[category.name] = await checkUploadLimit(category.id, userId, sessionId);
        }
        res.json({
            isClient: userId ? await checkClientStatus(userId) : false,
            limits
        });
    } catch (err) {
        console.error('Check limit error (alias):', err);
        res.status(500).json({ error: 'Failed to check limits' });
    }
});

// Get clothing categories
app.get('/api/clothing/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clothing_categories ORDER BY name');
        res.json({ categories: result.rows });
    } catch (err) {
        console.error('Get categories error:', err);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

// Get matching items
app.get('/api/matches', async (req, res) => {
    try {
        const userId = req.session.userId || null;
        const sessionId = req.session.sessionId || null;
        const excludeId = req.query.exclude_id;

        // Get user's items
        const itemsQuery = `
                    SELECT * FROM clothing_items 
                    WHERE (user_id = $1 OR session_id = $2)
                    AND (expires_at IS NULL OR expires_at > datetime('now'))
                `;
        const itemsResult = await pool.query(itemsQuery, [userId, sessionId]);
        const userItems = itemsResult.rows;

        if (userItems.length < 2) {
            return res.json({ match: null, message: 'Upload more items to get matches' });
        }

        // Find a match (exclude current item if specified)
        const availableItems = excludeId
            ? userItems.filter(item => item.id !== parseInt(excludeId))
            : userItems;

        if (availableItems.length < 1) {
            return res.json({ match: null, message: 'No more items to match' });
        }

        // Simple matching: find items with different categories for variety
        const currentItem = excludeId
            ? userItems.find(item => item.id === parseInt(excludeId))
            : availableItems[Math.floor(Math.random() * availableItems.length)];

        const potentialMatches = availableItems.filter(item =>
            item.id !== currentItem.id &&
            item.category_id !== currentItem.category_id
        );

        if (potentialMatches.length === 0) {
            // Fallback: same category if no different categories available
            potentialMatches.push(...availableItems.filter(item => item.id !== currentItem.id));
        }

        if (potentialMatches.length > 0) {
            // Calculate match scores and pick best one
            const scoredMatches = potentialMatches.map(item => ({
                item: item,
                score: calculateMatchScore(currentItem, item)
            }));

            scoredMatches.sort((a, b) => b.score - a.score);
            const bestMatch = scoredMatches[0];

            res.json({
                current_item: currentItem,
                match: bestMatch.item,
                score: bestMatch.score
            });
        } else {
            res.json({ match: null, message: 'No matches available' });
        }
    } catch (err) {
        console.error('Match error:', err);
        res.status(500).json({ error: 'Failed to find match' });
    }
});

// Delete clothing item
app.delete('/api/clothing/:id', async (req, res) => {
    try {
        const userId = req.session.userId || null;
        const sessionId = req.session.sessionId || null;
        const itemId = req.params.id;

        const result = await pool.query(`
                    DELETE FROM clothing_items 
                    WHERE id = $1 AND (user_id = $2 OR session_id = $3)
                    RETURNING image_path
                `, [itemId, userId, sessionId]);

        if (result.rows.length > 0) {
            // Delete file from filesystem
            const filePath = path.join(UPLOAD_ROOT, result.rows[0].image_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Item not found' });
        }
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// ============================================
// Blog Image Upload
// ============================================
const BLOG_UPLOAD_ROOT = path.join(__dirname, 'uploads', 'blog');
if (!fs.existsSync(BLOG_UPLOAD_ROOT)) {
    fs.mkdirSync(BLOG_UPLOAD_ROOT, { recursive: true });
}

const blogStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, BLOG_UPLOAD_ROOT);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const blogUpload = multer({
    storage: blogStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for blog images
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images (JPEG, PNG, WebP, GIF) are allowed!'));
    }
});

// Upload blog image endpoint
app.post('/api/blog/upload-image', isAuthenticated, blogUpload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const url = `/uploads/blog/${req.file.filename}`;
    res.json({
        success: true,
        url: url,
        filename: req.file.filename
    });
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
            <div class="nav-logo"><a href="../index.html" class="has-logo"><img src="../images/icon-152x152.png" class="logo-image"><span class="logo-text">Adria Cross</span></a></div>
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

// ============================================
// Square Payment & Invoice Endpoints
// ============================================

// Get Square Application ID (for frontend SDK initialization)
app.get('/api/square/config', (req, res) => {
    if (!process.env.SQUARE_APPLICATION_ID) {
        return res.status(503).json({ error: 'Square not configured' });
    }
    res.json({
        applicationId: process.env.SQUARE_APPLICATION_ID,
        locationId: process.env.SQUARE_LOCATION_ID,
        environment: process.env.SQUARE_ENVIRONMENT || 'sandbox'
    });
});

// Process a payment
app.post('/api/payments/create', async (req, res) => {
    if (!paymentsApi) {
        return res.status(503).json({ error: 'Payment processing not available' });
    }

    try {
        const { sourceId, amount, currency, customerEmail, description } = req.body;

        if (!sourceId || !amount) {
            return res.status(400).json({ error: 'Missing required fields: sourceId and amount' });
        }

        const idempotencyKey = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const paymentResult = await paymentsApi.createPayment({
            sourceId: sourceId,
            idempotencyKey: idempotencyKey,
            amountMoney: {
                amount: BigInt(Math.round(amount * 100)), // Convert to cents
                currency: currency || 'USD'
            },
            locationId: process.env.SQUARE_LOCATION_ID,
            note: description || 'Adria Cross Style Consultation',
            buyerEmailAddress: customerEmail
        });

        // Send confirmation email
        if (customerEmail) {
            const emailHtml = `
                <h2>Payment Confirmation</h2>
                <p>Thank you for your payment!</p>
                <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
                <p><strong>Description:</strong> ${description || 'Style Consultation'}</p>
                <p><strong>Transaction ID:</strong> ${paymentResult.result.payment.id}</p>
                <p>We look forward to working with you!</p>
                <p>Best,<br>Adria Cross</p>
            `;
            sendEmail(customerEmail, 'Payment Confirmation - Adria Cross', emailHtml)
                .catch(err => console.error('Payment confirmation email failed:', err));
        }

        res.json({
            success: true,
            paymentId: paymentResult.result.payment.id,
            status: paymentResult.result.payment.status
        });

    } catch (err) {
        console.error('Payment Error:', err);
        res.status(500).json({
            error: 'Payment failed',
            details: err.result?.errors || err.message
        });
    }
});

// Create and send an invoice
app.post('/api/invoices/create', isAuthenticated, async (req, res) => {
    if (!invoicesApi || !customersApi) {
        return res.status(503).json({ error: 'Invoice creation not available' });
    }

    try {
        const { customerEmail, customerName, amount, description, dueDate } = req.body;

        if (!customerEmail || !amount || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create or find customer
        let customerId;
        try {
            const searchResult = await customersApi.searchCustomers({
                query: {
                    filter: {
                        emailAddress: { exact: customerEmail }
                    }
                }
            });

            if (searchResult.result.customers && searchResult.result.customers.length > 0) {
                customerId = searchResult.result.customers[0].id;
            } else {
                const createResult = await customersApi.createCustomer({
                    emailAddress: customerEmail,
                    givenName: customerName || 'Client'
                });
                customerId = createResult.result.customer.id;
            }
        } catch (customerErr) {
            console.error('Customer creation error:', customerErr);
            return res.status(500).json({ error: 'Failed to create customer' });
        }

        const idempotencyKey = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create the invoice
        const invoiceResult = await invoicesApi.createInvoice({
            invoice: {
                locationId: process.env.SQUARE_LOCATION_ID,
                primaryRecipient: { customerId: customerId },
                paymentRequests: [{
                    requestType: 'BALANCE',
                    dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    automaticPaymentSource: 'NONE'
                }],
                invoiceNumber: `ACE-${Date.now()}`,
                title: 'Style Consultation Services',
                description: description,
                scheduledAt: new Date().toISOString()
            },
            idempotencyKey: idempotencyKey
        });

        const invoiceId = invoiceResult.result.invoice.id;
        const invoiceVersion = invoiceResult.result.invoice.version;

        // Publish (send) the invoice
        await invoicesApi.publishInvoice(invoiceId, {
            version: invoiceVersion,
            idempotencyKey: `pub_${idempotencyKey}`
        });

        res.json({
            success: true,
            invoiceId: invoiceId,
            invoiceNumber: invoiceResult.result.invoice.invoiceNumber,
            status: 'SENT'
        });

    } catch (err) {
        console.error('Invoice Error:', err);
        res.status(500).json({
            error: 'Invoice creation failed',
            details: err.result?.errors || err.message
        });
    }
});

// List invoices (admin only)
app.get('/api/invoices', isAuthenticated, async (req, res) => {
    if (!invoicesApi) {
        return res.status(503).json({ error: 'Invoice listing not available' });
    }

    try {
        const result = await invoicesApi.listInvoices({
            locationId: process.env.SQUARE_LOCATION_ID,
            limit: 50
        });

        const invoices = (result.result.invoices || []).map(inv => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            title: inv.title,
            description: inv.description,
            status: inv.status,
            dueDate: inv.paymentRequests?.[0]?.dueDate,
            createdAt: inv.createdAt,
            publicUrl: inv.publicUrl
        }));

        res.json({ invoices });

    } catch (err) {
        logger.error('List Invoices Error:', err);
        res.status(500).json({ error: 'Failed to list invoices' });
    }
});

/**
 * @openapi
 * /api/square/webhook:
 *   post:
 *     summary: Handle Square webhook notifications
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook received
 */
app.post('/api/square/webhook', (req, res) => {
    // Square webhook signatures should be verified in production
    const event = req.body;
    logger.info(`Received Square Webhook: ${event.type}`, { eventId: event.id });

    // Process specific events (payment.updated, invoice.payment_made, etc.)
    // For now, just acknowledge receipt
    res.sendStatus(200);
});

// Ensure session for clothing matcher
app.use('/clothing-matcher', (req, res) => {
    if (!req.session.userId) {
        req.session.userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('Created anonymous session for clothing matcher:', req.session.userId);
    }
    next();
});

// Blog redirect route
app.get('/blog', (req, res) => {
    res.redirect('/blog/index.html');
});

// Clothing Matcher routes (must come before static files)
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/clothing-matcher', (req, res) => res.sendFile(path.join(__dirname, 'clothing-matcher', 'index.html')));
app.get('/clothing-matcher/', (req, res) => res.sendFile(path.join(__dirname, 'clothing-matcher', 'index.html')));

// Serve static files for clothing-matcher
app.use('/clothing-matcher', express.static(path.join(__dirname, 'clothing-matcher')));

app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(UPLOAD_ROOT));

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(`${err.message}\n${err.stack}`);
    res.status(500).json({ error: 'Internal Server Error' }); // Don't expose stacks in response
});

if (require.main === module) {
    app.listen(port, () => logger.info(`Run: http://localhost:${port}`));
}

module.exports = app;
