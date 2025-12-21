# Implementation Plan: Backend Email Integration

**Objective**: automated email notifications for Appointment Requests and Intake Form submissions.

## Technology Stack
- **Library**: `nodemailer` (Standard Node.js library for sending emails).
- **Transport**: SMTP (compatible with Gmail, Outlook, SendGrid, Mailgun, AWS SES, etc.).

## 1. Environment Setup
We need to configure the email provider credentials securely.

**New Environment Variables (`.env`):**
```bash
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-password-or-app-key
EMAIL_FROM="Adria Cross <hello@adriacrossedit.com>"
ADMIN_EMAIL="hello@adriacrossedit.com"
```

## 2. Backend Implementation (`server.js`)

### A. Install Dependencies
Run: `npm install nodemailer`

### B. Configure Transporter
Setup the Nodemailer transporter using the environment variables.

### C. Create Email Templates
Create simple HTML templates for:
1.  **Admin Notification** (New Booking/Intake): "You have a new request from [Name]..."
2.  **User Confirmation** (Appointment): "Thanks for requesting a slot. We will confirm shortly..."
3.  **User Confirmation** (Intake): "Thanks for submitting your profile..."

### D. Update API Endpoints

#### `POST /api/appointments`
- After successfully inserting into DB:
    - Send **Admin Notification** with booking details.
    - Send **User Confirmation** to `req.body.email`.
- Ensure the API response is sent even if email fails (log email errors silently or return a warning).

#### `POST /api/intake`
- After successfully inserting into DB:
    - Send **Admin Notification** with summary.
    - Send **User Confirmation** to `req.body.email`.

## 3. Frontend Updates
- Update success messages in `contact.html` and `intake-form.html` to explicitly mention: "A confirmation email has been sent."

## 4. Testing
- Use a tool like [Ethereal Email](https://ethereal.email/) (fake SMTP) or a real Gmail account with App Password for testing.
