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

## Deployment to Render.com (Free Tier)
1. **Prepare Database**: Create a free account at [Supabase.com](https://supabase.com) or [Neon.tech](https://neon.tech).
2. **Get Connection String**: Copy your database connection string (it will start with `postgresql://...`).
3. **Push to GitHub**: Ensure your latest code is pushed.
4. **Create a Web Service**: In Render, click **New +** > **Blueprint**.
5. **Connect GitHub**: Select your repository.
6. **Configure Variables**: When prompted, paste your connection string into the `DATABASE_URL` field.
7. **Deploy**: Render will set up the server for free. Your data will stay in the cloud database even if Render restarts.

*Note: In the free tier, client photos in the `uploads` folder will still reset on every restart. For permanent photo storage, we can later add a cloud storage service like Cloudinary.*

## Files Added/Modified
- `server.js`: The Express & SQLite backend.
- `admin.html`: The owner's management interface.
- `contact.html`: Updated with the new booking form.
- `package.json`: Updated with dependencies and start script.
- `.env`: Configuration for secrets and credentials.
- `appointments.db`: Local database file (created on first run).
