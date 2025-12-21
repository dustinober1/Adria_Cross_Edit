# Adria Cross Edit - Appointment & Admin System

This project is a full-stack web application with a professional booking system and owner dashboard.

## Features
- **Custom Booking Form**: Branded appointment selection.
- **Dynamic Availability**: Owner can manage their weekly schedule from the dashboard.
- **Color Analysis Intake**: Multi-step intake form with photo upload support.
- **Admin Portal**: Password-protected area to view appointments, manage intake forms, and edit the schedule.
- **PostgreSQL Database**: Persistent storage via Neon.tech or Supabase.
- **Dockerized**: Containerized for 100% environment consistency.

## How to Run Locally (Docker)
1. Ensure Docker Desktop is running.
2. Build the image: `docker build -t adria-site .`
3. Run the container:
   ```bash
   docker run -p 3000:3000 -e DATABASE_URL="your_neon_url" adria-site
   ```
4. Access at `http://localhost:3000`

## Deployment to Render.com (Free Tier)
1. **Push to GitHub**: All necessary `Dockerfile` and `render.yaml` files are already in the repo.
2. **Create a Blueprint**: In Render, click **New +** > **Blueprint**.
3. **Connect Repository**: Select this GitHub repository.
4. **Environment Variable**: Add your `DATABASE_URL` from Neon.tech in the Render dashboard.
5. **Deploy**: Render will build the Docker container and host it for free.

## Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript.
- **Backend**: Node.js, Express.
- **Database**: PostgreSQL (via Neon).
- **Hosting**: Render.com (Docker Environment).
