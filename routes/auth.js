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
        
        // Redirect to intended page or home
        const returnTo = req.session.returnTo || '/';
        delete req.session.returnTo;
        res.redirect(returnTo);
    }
);

// GET /auth/apple
// Initiates the Sign In with Apple flow
router.get('/apple', passport.authenticate('apple'));

// POST /auth/apple/callback
// Handles the callback from Apple
router.post('/apple/callback', 
    passport.authenticate('apple', { failureRedirect: '/?login=failed' }),
    (req, res) => {
        // Successful authentication
        logger.info(`User ${req.user.email || req.user.username} logged in via Apple`);
        
        const returnTo = req.session.returnTo || '/';
        delete req.session.returnTo;
        res.redirect(returnTo);
    }
);

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
    } else if (req.session && req.session.userId) {
        // Legacy session support
        res.json({
            authenticated: true,
            user: {
                id: req.session.userId,
                role: 'client' // Default assumption for now
            },
            isLegacy: true
        });
    } else {
        res.json({ authenticated: false });
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
