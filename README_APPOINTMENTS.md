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

## Deployment to Render.com
1. **Push to GitHub**: Ensure your latest code is pushed to your repository.
2. **Create a Web Service**: In Render, click **New +** > **Blueprint**.
3. **Connect GitHub**: Select your repository. 
4. **Deploy**: Render will use the `render.yaml` file to set up your Node.js server and a persistent 1GB disk for your database and photos.
   - *Note*: Persistent disks require a paid Render plan (Starter or higher). If you want a free tier without persistence (database resets on restart), you can remove the `disk` section from `render.yaml`.

## Files Added/Modified
- `server.js`: The Express & SQLite backend.
- `admin.html`: The owner's management interface.
- `contact.html`: Updated with the new booking form.
- `package.json`: Updated with dependencies and start script.
- `.env`: Configuration for secrets and credentials.
- `appointments.db`: Local database file (created on first run).
