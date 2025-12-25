const express = require('express');
const passport = require('passport');
const router = express.Router();
const logger = require('../logger');

// GET /auth/google
// Initiates the Google OAuth 2.0 flow
router.get('/google', (req, res, next) => {
    try {
        if (passport._strategies && passport._strategies.google) {
            passport.authenticate('google', {
                scope: ['profile', 'email']
            })(req, res, next);
        } else {
            logger.error('Google Auth Error: Strategy "google" is not configured.');
            res.status(501).json({
                error: 'Configuration Error',
                message: 'Google Sign-In is not configured on this server.'
            });
        }
    } catch (err) {
        logger.error('Google Auth Route Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /auth/google/callback
// Handles the callback from Google
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/?login=failed' }),
    (req, res) => {
        // Successful authentication
        const userEmail = req.user?.email || req.user?.id || 'unknown user';
        logger.info(`User ${userEmail} logged in via Google`);

        // Ensure session is saved before redirect
        req.session.save((err) => {
            if (err) {
                logger.error('Session save error after Google auth:', err);
            }
            // Redirect to member portal or intended page
            const returnTo = req.session.returnTo || '/member-portal.html';
            delete req.session.returnTo;
            res.redirect(returnTo);
        });
    }
);

// GET /api/auth/diagnostic
// Returns detailed diagnostic info about passport configuration
router.get('/api/auth/diagnostic', (req, res) => {
    res.json({
        hasPassport: !!passport,
        hasStrategies: !!passport._strategies,
        strategies: passport._strategies ? Object.keys(passport._strategies) : [],
        session: !!req.session,
        authenticated: req.isAuthenticated()
    });
});

// GET /api/auth/status
// Returns current authentication status for the frontend
router.get('/api/auth/status', async (req, res) => {
    // Check Passport authentication first
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email,
                displayName: req.user.displayName,
                profilePicture: req.user.profilePicture,
                role: req.user.role,
                provider: req.user.provider
            }
        });
    }
    // Fall back to session-based authentication (from /api/login)
    else if (req.session && req.session.userId) {
        try {
            // Import pool dynamically to avoid circular dependency
            const pool = require('../server').pool;
            const result = await pool.query('SELECT id, username, email, display_name, role FROM users WHERE id = $1', [req.session.userId]);
            if (result.rows.length > 0) {
                const user = result.rows[0];
                res.json({
                    authenticated: true,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        displayName: user.display_name,
                        role: user.role,
                        provider: 'local'
                    }
                });
            } else {
                res.json({ authenticated: false });
            }
        } catch (err) {
            logger.error('Auth status error:', err);
            res.json({ authenticated: false });
        }
    } else {
        res.json({
            authenticated: false,
            // Diagnostic info
            hasPassport: !!passport,
            hasStrategies: !!passport._strategies,
            strategies: passport._strategies ? Object.keys(passport._strategies) : []
        });
    }
});

// POST /api/auth/logout
// Logs out the user
router.post('/api/auth/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.session.destroy((err) => {
            if (err) {
                logger.error('Session destroy error:', err);
                return res.status(500).json({ error: 'Logout failed' });
            }
            res.clearCookie('connect.sid'); // Default session cookie name
            res.json({ success: true });
        });
    });
});

module.exports = router;
