# Legacy Static Site

This directory contains the original static HTML/CSS/JavaScript site that was live before the transformation to a full-stack application.

## Contents
- All HTML pages (index, about, services, contact, blog, etc.)
- CSS stylesheets
- JavaScript files
- Nginx configuration
- Docker files for static site deployment

## Purpose
These files are preserved for:
1. Reference during the transformation process
2. Backup of the original working site
3. Ability to rollback if needed during development
4. Migration of content to the new CMS

## Deployment
The original static site is still deployable via Docker:

```bash
cd legacy-static-site
docker build -t adria-static-site -f ../Dockerfile .
docker run -p 8080:8080 adria-static-site
```

## Do Not Modify
These files should remain unchanged as a historical snapshot of the original site.
