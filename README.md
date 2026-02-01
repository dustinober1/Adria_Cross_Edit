# Legacy Static Site

This directory contains the original static HTML/CSS/JavaScript site that was live before the transformation to a full-stack application.

## Contents
- All HTML pages (index, about, services, contact, blog, etc.)
- CSS stylesheets
- JavaScript files
- Nginx configuration
- Docker files for static site deployment

# Adria Cross Edit — Personal styling & content site

This repository contains the application powering Adria Cross Edit: a small full-stack site that serves a public landing and blog, a clothing-matcher tool, user authentication and member portal, appointment scheduling, and payment integration.

Key pieces
- Public pages and blog: static pages and blog posts live under the repository root and `blog/`.
- Clothing matcher: an interactive client-side tool is in `clothing-matcher/`.
- Authentication: session- and OAuth-based auth using Passport (see `config/passport.js` and `routes/auth.js`).
- Member experience: `member-portal.html`, intake form, and protected routes for signed-in users.
- Appointments & payments: DB migrations in `migrations/` support appointments; `payments.js` and Square SDK integration handle payments.
- Server: Express-based server in `server.js` serves the site and APIs.

Local development
1. Install dependencies:

```bash
npm install
```

2. Configure environment: copy or create an environment file and provide DB and auth credentials (the app uses `dotenv` and `ctx_config.json` for some settings).

3. Run the app:

```bash
npm start
```

Useful scripts
- `npm start`: starts `server.js`.
- `npm run check-links`: run the link-checker script in `scripts/link-checker.js`.
- `npm test`: run tests (Jest).

Notes for maintainers
- DB: migrations are SQL files in `migrations/`; the project can use SQLite or Postgres depending on environment.
- Assets: static assets live in `css/`, `js/`, and `images/`.
- Deployment: there are Docker and Procfile hints for containerized deployment (see `Dockerfile` and `Procfile`).

If you'd like, I can expand this README with a full environment variable list, deployment steps, or a quick-start section for contributors.
