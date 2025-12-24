// middleware/auth.js

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    // Fallback for legacy session-based auth (if mixed usage continues)
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized', message: 'Please log in to continue.' });
};

const isAdmin = (req, res, next) => {
    // Check Passport user
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
    if ((req.user && (req.user.role === 'client' || req.user.role === 'admin')) || 
        (req.session && (req.session.isClient || req.session.userId))) {
        return next();
    }
    res.status(403).json({ error: 'Forbidden', message: 'Client access required.' });
};

// Middleware for frontend page redirects (not JSON APIs)
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated() || req.session.userId) {
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
