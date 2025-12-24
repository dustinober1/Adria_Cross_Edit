const express = require('express');
const passport = require('passport');
const router = express.Router();
const logger = require('../logger');

// GET /auth/google
// Initiates the Google OAuth 2.0 flow
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// GET /auth/google/callback
// Handles the callback from Google
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/?login=failed' }),
    (req, res) => {
        // Successful authentication
        logger.info(`User ${req.user.email} logged in via Google`);
        
        // Redirect to member portal or intended page
        const returnTo = req.session.returnTo || '/member-portal.html';
        delete req.session.returnTo;
        res.redirect(returnTo);
    }
);

// GET /auth/apple
// Initiates the Sign In with Apple flow
router.get('/apple', (req, res, next) => {
    try {
        // Check if strategy is registered
        const isConfigured = passport._strategies && passport._strategies.apple;
        
        if (isConfigured) {
            passport.authenticate('apple')(req, res, next);
        } else {
            logger.error('Apple Auth Error: Strategy "apple" is not configured in passport._strategies');
            res.status(501).json({ 
                error: 'Configuration Error', 
                message: 'Apple Sign-In is not fully configured on this server. Please contact the administrator.' 
            });
        }
    } catch (err) {
        logger.error('Apple Auth Route Error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});

// POST /auth/apple/callback
// Handles the callback from Apple
router.post('/apple/callback', (req, res, next) => {
    passport.authenticate('apple', (err, user, info) => {
        if (err) {
            logger.error('Apple Auth Callback Error:', err);
            return res.redirect('/?login=failed&reason=error');
        }
        if (!user) {
            logger.warn('Apple Auth Callback: No user returned', { info });
            return res.redirect('/?login=failed&reason=no_user');
        }
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                logger.error('Apple Auth Login Error:', loginErr);
                return next(loginErr);
            }
            logger.info(`User ${user.email || user.username} logged in via Apple`);
            const returnTo = req.session.returnTo || '/member-portal.html';
            delete req.session.returnTo;
            res.redirect(returnTo);
        });
    })(req, res, next);
});

// GET /api/auth/status
// Returns current authentication status for the frontend
router.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: {
                id: req.user.id,
                displayName: req.user.displayName,
                profilePicture: req.user.profilePicture,
                role: req.user.role,
                provider: req.user.provider
            }
        });
    } else {
        res.json({ 
            authenticated: false,
            // Diagnostic info
            strategies: Object.keys(passport._strategies || {})
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
