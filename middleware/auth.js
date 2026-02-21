// middleware/auth.js

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'adria-cross-edit-mobile-secret-dev';

// Helper to decode token and set req.user if a valid token is present
const applyToken = (req) => {
    if (req.user) return; // Already set by Passport or previous middleware

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded; // Set user info from token
        } catch (err) {
            // Invalid token, do nothing, let existing auth methods handle failure
        }
    }
};

const isAuthenticated = (req, res, next) => {
    applyToken(req);

    // 1. Check if token successfully populated req.user
    if (req.user) {
        return next();
    }

    // 2. Check standard web authentication (Passport)
    if (req.isAuthenticated()) {
        return next();
    }

    // 3. Fallback for legacy session-based auth (if mixed usage continues)
    // Only allow if userId is numeric (anonymous session IDs are strings like "anon_...")
    if (req.session && typeof req.session.userId === 'number' && req.session.userId) {
        return next();
    }

    res.status(401).json({ error: 'Unauthorized', message: 'Please log in to continue.' });
};


const isAdmin = (req, res, next) => {
    applyToken(req);

    // Check Passport/JWT user
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    // Check legacy session
    // This requires fetching the user from DB if not fully stored in session, 
    // but typically we trust req.user populated by Passport deserialization
    if (req.session && req.session.userId) {
        // Warning: This assumes legacy session implies admin for specific paths or needs DB check
        // For strict admin routes, we should verify against DB or session role
        // Assuming legacy setup checked password match for 'admin' user
        // We'll trust the Passport 'role' field primarily now.
    }

    // Strict check:
    if ((req.user && req.user.role === 'admin') || (req.session && req.session.isAdmin)) { // Assuming we add isAdmin to legacy login session
        return next();
    }

    // Additional check for legacy admin user by ID (usually ID 1 or username 'admin')
    // Ideally, we move fully to role-based.

    res.status(403).json({ error: 'Forbidden', message: 'Admin access required.' });
};

const isClient = (req, res, next) => {
    applyToken(req);

    if ((req.user && (req.user.role === 'client' || req.user.role === 'admin')) ||
        (req.session && (req.session.isClient || (typeof req.session.userId === 'number' && req.session.userId)))) {
        return next();
    }
    res.status(403).json({ error: 'Forbidden', message: 'Client access required.' });
};

// Middleware for frontend page redirects (not JSON APIs)
const ensureAuthenticated = (req, res, next) => {
    applyToken(req);

    if (req.user || req.isAuthenticated() || (typeof req.session?.userId === 'number' && req.session.userId)) {
        return next();
    }
    // Store original URL to redirect back after login
    req.session.returnTo = req.originalUrl;
    res.redirect('/?login=required');
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isClient,
    ensureAuthenticated
};
