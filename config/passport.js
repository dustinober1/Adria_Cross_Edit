const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AppleStrategy = require('passport-apple');
const fs = require('fs');
const path = require('path');
const logger = require('../logger');

module.exports = function configurePassport(app, pool) {
    
    // Serialize user to session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
        try {
            const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
            if (result.rows.length > 0) {
                const user = result.rows[0];
                // Normalize user object for session
                const sessionUser = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    displayName: user.display_name,
                    profilePicture: user.profile_picture,
                    role: user.role,
                    isClient: user.role === 'client' || user.is_client, // Backwards compatibility
                    provider: user.provider
                };
                done(null, sessionUser);
            } else {
                done(new Error('User not found'), null);
            }
        } catch (err) {
            done(err, null);
        }
    });

    // Google Strategy
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                const googleId = profile.id;
                const displayName = profile.displayName;
                const photo = profile.photos[0]?.value;

                // Check if user exists
                let result = await pool.query('SELECT * FROM users WHERE email = $1 OR (provider = $2 AND provider_id = $3)', [email, 'google', googleId]);
                
                let user;
                if (result.rows.length > 0) {
                    // Update existing user with Google info if missing
                    user = result.rows[0];
                    if (!user.provider || user.provider !== 'google') {
                        await pool.query(
                            'UPDATE users SET provider = $1, provider_id = $2, display_name = COALESCE(display_name, $3), profile_picture = COALESCE(profile_picture, $4), email_verified = TRUE WHERE id = $5',
                            ['google', googleId, displayName, photo, user.id]
                        );
                    }
                } else {
                    // Create new user
                    // Use email as username if available, otherwise generate one
                    const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
                    
                    const insertResult = await pool.query(
                        'INSERT INTO users (username, email, provider, provider_id, display_name, profile_picture, email_verified, role) VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7) RETURNING *',
                        [username, email, 'google', googleId, displayName, photo, 'client']
                    );
                    user = insertResult.rows[0] || (insertResult.rows ? insertResult.rows[0] : null); // Handle different DB adapters
                    
                    // For better-sqlite3 wrapper which might not support RETURNING * fully in same way as pg
                    if (!user) {
                         const newUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
                         user = newUser.rows[0];
                    }
                }

                // Store tokens (Optional: implement oauth_tokens table logic here if needed for API access later)
                
                return done(null, user);

            } catch (err) {
                logger.error('Google Auth Error:', err);
                return done(err, null);
            }
        }));
        logger.info('Passport: Google Strategy configured');
    }

    // Apple Strategy
    if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY_PATH) {
        try {
            const privateKey = fs.readFileSync(path.resolve(process.env.APPLE_PRIVATE_KEY_PATH), 'utf8');
            passport.use(new AppleStrategy({
                clientID: process.env.APPLE_CLIENT_ID,
                teamID: process.env.APPLE_TEAM_ID,
                keyID: process.env.APPLE_KEY_ID,
                privateKeyString: privateKey,
                callbackURL: process.env.APPLE_CALLBACK_URL || '/auth/apple/callback',
                passReqToCallback: true
            }, async (req, accessToken, refreshToken, idToken, profile, done) => {
                try {
                    // Apple only returns name/email on first login, so we must handle that
                    const appleId = idToken.sub;
                    const email = idToken.email; // Requires scope: email
                    const displayName = profile && profile.name ? `${profile.name.firstName} ${profile.name.lastName}` : null;

                    // Logic similar to Google: Find or Create
                    // Note: Apple might hide email, providing a relay address
                    
                    let result = await pool.query('SELECT * FROM users WHERE provider = $1 AND provider_id = $2', ['apple', appleId]);
                    
                    if (result.rows.length === 0 && email) {
                        // Check by email if not found by provider ID (for linking)
                        result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
                    }

                    let user;
                    if (result.rows.length > 0) {
                        user = result.rows[0];
                        logger.info(`Apple Auth: Found existing user ${user.email || user.username}`);
                        if (!user.provider || user.provider !== 'apple') {
                            await pool.query('UPDATE users SET provider = $1, provider_id = $2 WHERE id = $3', ['apple', appleId, user.id]);
                        }
                    } else {
                        // Create new user
                        const username = email ? email.split('@')[0] : `apple_user_${Math.random().toString(36).substr(2, 5)}`;
                        logger.info(`Apple Auth: Creating new user with username ${username}`);
                        
                        try {
                            const insertResult = await pool.query(
                                'INSERT INTO users (username, email, provider, provider_id, display_name, email_verified, role) VALUES ($1, $2, $3, $4, $5, TRUE, $6) RETURNING *',
                                [username, email, 'apple', appleId, displayName, 'client']
                            );
                            user = insertResult.rows[0];
                        } catch (insertErr) {
                            logger.warn('Apple Auth: Insert with RETURNING failed, falling back to lookup');
                        }

                        if (!user) {
                             const newUser = await pool.query('SELECT * FROM users WHERE provider_id = $1', [appleId]);
                             user = newUser.rows[0];
                        }
                    }

                    if (!user) {
                        throw new Error('Failed to create or retrieve user after Apple authentication');
                    }

                    return done(null, user);

                } catch (err) {
                    logger.error('Apple Auth Error:', err);
                    return done(err, null);
                }
            }));
            logger.info('Passport: Apple Strategy configured');
        } catch (err) {
            logger.warn('Passport: Apple Strategy skipped (Key file missing or invalid)');
        }
    }

    // Initialize Passport
    app.use(passport.initialize());
    app.use(passport.session());
};
