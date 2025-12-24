# Implementation Plan

OAuth authentication integration using Google and Apple Sign-In to enable user registration and login for both clients and administrators.

This implementation adds social authentication capabilities to the existing Adria Cross styling platform, allowing users to create accounts and sign in using their Google or Apple credentials. The system will work alongside the existing password-based authentication, providing users with flexible login options. Collected user data (name, email, profile picture) will be stored in the database for personalization purposes. This enhancement improves user experience by reducing signup friction and provides secure, industry-standard authentication using Passport.js.

[Types]
User account and OAuth token data structures for authentication management.

### Database Schema Changes

**users table - New columns:**
- `email` (TEXT, UNIQUE, nullable) - Email address from OAuth provider
- `provider` (TEXT, nullable) - Auth provider: 'google', 'apple', or 'local'
- `provider_id` (TEXT, nullable) - Unique ID from OAuth provider
- `display_name` (TEXT, nullable) - Full name from provider
- `profile_picture` (TEXT, nullable) - URL to profile image
- `email_verified` (BOOLEAN, DEFAULT FALSE) - Whether email is verified
- `role` (TEXT, DEFAULT 'client') - User role: 'client' or 'admin'
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - Account creation timestamp

**oauth_tokens table - New table:**
- `id` (SERIAL, PRIMARY KEY)
- `user_id` (INTEGER, REFERENCES users(id) ON DELETE CASCADE)
- `provider` (TEXT, NOT NULL) - 'google' or 'apple'
- `access_token` (TEXT) - OAuth access token (encrypted)
- `refresh_token` (TEXT) - OAuth refresh token (encrypted)
- `token_type` (TEXT) - Type of token (e.g., 'Bearer')
- `expires_at` (TIMESTAMP) - Token expiration time
- `scope` (TEXT) - Granted permissions scope
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

**Session Object Structure:**
```typescript
{
  userId: number,           // User database ID
  username?: string,        // Username (for local auth)
  email?: string,           // Email (for OAuth)
  displayName?: string,      // Full name
  profilePicture?: string,    // Profile image URL
  provider: 'local' | 'google' | 'apple',
  role: 'client' | 'admin',
  isClient: boolean,
  createdAt: Date
}
```

[Files]
New and modified files for OAuth authentication implementation.

### New Files

- `config/passport.js` - Passport configuration with Google and Apple strategies, session serialization
- `middleware/auth.js` - Authentication middleware wrappers (isAuthenticated, isAdmin, isClient)
- `routes/auth.js` - OAuth callback routes and auth endpoints
- `migrations/003_oauth_schema.sql` - Database migration for OAuth tables and columns
- `views/auth-buttons.html` - Reusable OAuth login button component
- `js/auth.js` - Frontend OAuth integration and UI handling
- `.env.example` - Updated environment variable documentation

### Modified Files

- `server.js` - Integrate Passport middleware, auth routes, update session configuration
- `package.json` - Add dependencies: passport, passport-google-oauth20, passport-apple, cookie-parser
- `admin.html` - Add Google/Apple login buttons, update login form UI
- `index.html` - Add "Sign In with Google/Apple" buttons in header/footer
- `contact.html` - Add login option for authenticated appointments
- `clothing-matcher/index.html` - Add OAuth login for client verification

### Configuration Files

- Update `.gitignore` to ensure OAuth credentials remain secure (already exists)

[Functions]
Authentication functions for OAuth flow and session management.

### New Functions

**config/passport.js:**
- `configurePassport(app, pool)` - Initialize Passport with Google and Apple strategies
- `googleStrategy` - Passport Google OAuth 2.0 strategy configuration
- `appleStrategy` - Passport Apple Sign In strategy configuration
- `serializeUser` - Store user ID in session
- `deserializeUser` - Retrieve user from session

**middleware/auth.js:**
- `isAuthenticated(req, res, next)` - Verify user is logged in
- `isAdmin(req, res, next)` - Verify user has admin role
- `isClient(req, res, next)` - Verify user has client role
- `ensureAuthenticated` - Redirect-based auth guard for frontend routes

**routes/auth.js:**
- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - Handle Google OAuth callback
- `GET /auth/apple` - Initiate Apple Sign In flow
- `POST /auth/apple/callback` - Handle Apple Sign In callback
- `GET /api/auth/status` - Return current auth status (for frontend)
- `POST /api/auth/link-local` - Link OAuth account to existing local account
- `POST /api/auth/unlink` - Unlink OAuth provider

**js/auth.js (Frontend):**
- `initOAuthButtons()` - Initialize Google/Apple sign-in buttons
- `handleGoogleSignIn()` - Handle Google Sign-In popup/redirect
- `handleAppleSignIn()` - Handle Apple Sign-In popup/redirect
- `updateAuthUI()` - Update UI based on auth state
- `checkAuthStatus()` - Poll server for auth status changes

### Modified Functions

**server.js:**
- Update middleware order to include Passport initialization
- Replace existing `isAuthenticated` middleware with imported version
- Add OAuth route mounting
- Update session configuration to support Passport

**Existing endpoints affected:**
- `/api/login` - Keep existing, but add option to link OAuth later
- `/api/logout` - Clear both session and Passport session

[Classes]
No new classes required. Implementation uses functional programming with middleware pattern and Passport strategies.

[Dependencies]
OAuth authentication libraries and utilities.

### New npm packages

```
passport@^0.7.0              - Authentication middleware framework
passport-google-oauth20@^2.0.0  - Google OAuth 2.0 strategy
passport-apple@^2.0.1           - Apple Sign In strategy
cookie-parser@^1.4.6            - Cookie parsing for Passport sessions
crypto@^1.0.1 (built-in)        - For token encryption
```

### Environment Variables Required

```
GOOGLE_CLIENT_ID          - Google OAuth 2.0 Client ID
GOOGLE_CLIENT_SECRET      - Google OAuth 2.0 Client Secret
GOOGLE_CALLBACK_URL       - Full callback URL (e.g., https://example.com/auth/google/callback)
APPLE_CLIENT_ID          - Apple Services ID
APPLE_TEAM_ID            - Apple Developer Team ID
APPLE_KEY_ID             - Apple Sign In Key ID
APPLE_PRIVATE_KEY_PATH    - Path to Apple private key file (.p8)
APPLE_CALLBACK_URL        - Full callback URL
BASE_URL                 - Used for callback URL construction
SESSION_SECRET           - Existing (ensure secure value)
```

### Apple Sign In Prerequisites

- Apple Developer Program membership required
- Create "Sign in with Apple" service ID
- Generate private key for server-side verification
- Configure redirect URLs in Apple Developer console

[Testing]
Comprehensive testing strategy for OAuth authentication flows.

### Test Files

- `tests/auth.test.js` - OAuth flow tests (auth callback, session creation, role verification)

### Test Coverage

**Unit Tests:**
- Passport strategy configuration
- `findOrCreateUser` database operation
- Token encryption/decryption
- Role-based middleware

**Integration Tests:**
- Complete Google OAuth flow (initiate → callback → session)
- Complete Apple OAuth flow
- Link OAuth account to existing local account
- Unlink OAuth provider
- Session persistence across requests
- Role-based access control (admin vs client)

**Manual Testing Checklist:**
- [ ] Google Sign-In creates new user account
- [ ] Google Sign-In logs in existing user
- [ ] Apple Sign-In creates new user account (with email masking if hidden)
- [ ] Apple Sign-In logs in existing user
- [ ] Admin can sign in via Google/Apple if email matches admin
- [ ] Password login still works alongside OAuth
- [ ] Session persists correctly after OAuth login
- [ ] Logout clears both session and OAuth data
- [ ] Profile picture displays correctly from OAuth
- [ ] Error handling for failed OAuth attempts
- [ ] Redirect after login works correctly

### Browser Testing

- Chrome (latest)
- Safari (for Apple Sign-In native experience)
- Firefox (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

[Implementation Order]
Sequential implementation steps to ensure successful integration.

1. **Database Migration** - Create SQL migration file for OAuth schema changes
2. **Environment Setup** - Document required environment variables in `.env.example`
3. **Install Dependencies** - Add Passport and OAuth provider packages via npm
4. **Passport Configuration** - Create `config/passport.js` with Google and Apple strategies
5. **Authentication Middleware** - Create `middleware/auth.js` with role-based guards
6. **Auth Routes** - Implement `routes/auth.js` with OAuth endpoints
7. **Server Integration** - Update `server.js` to mount Passport and auth routes
8. **Frontend Components** - Create reusable OAuth button component (`views/auth-buttons.html`)
9. **Frontend JavaScript** - Implement OAuth handling in `js/auth.js`
10. **Update Admin Page** - Add Google/Apple login buttons to `admin.html`
11. **Update Public Pages** - Add login buttons to header/footer in `index.html`, `contact.html`
12. **Update Clothing Matcher** - Add OAuth option in `clothing-matcher/index.html`
13. **Testing** - Write and run test suite, perform manual testing
14. **Documentation** - Update README.md with OAuth setup instructions
15. **Deployment Preparation** - Configure OAuth app settings with production callback URLs
