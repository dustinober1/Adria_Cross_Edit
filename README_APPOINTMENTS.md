# Adria Cross Edit - Appointment System

This project has been upgraded with a custom appointment booking system.

## Features
- **Custom Booking Form**: Replaced Google Calendar with a branded, integrated form.
- **SQLite Database**: Appointments are stored in `appointments.db`.
- **Admin Dashboard**: Password-protected area to view and manage requests.
- **Double-Booking Protection**: Prevent simultaneous bookings for the same slot.

## How to Run Locally
1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. Access the site: `http://localhost:3000`
4. Access the Admin Dashboard: `http://localhost:3000/admin` (Default: admin / adria2025)

## Deployment Notes
- This site now requires a Node.js environment.
- Ensure `appointments.db` is in a writable directory.
- Update `.env` with a secure `SESSION_SECRET` and `ADMIN_PASSWORD`.

## Files Added/Modified
- `server.js`: The Express & SQLite backend.
- `admin.html`: The owner's management interface.
- `contact.html`: Updated with the new booking form.
- `package.json`: Updated with dependencies and start script.
- `.env`: Configuration for secrets and credentials.
- `appointments.db`: Local database file (created on first run).
