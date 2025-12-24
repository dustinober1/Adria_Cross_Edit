/**
 * Adria Cross Edit - Email Test Script
 * Use this to verify your SMTP settings in .env
 */
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testConnection() {
    console.log('--- Email Connection Test ---');
    console.log('Sending from:', process.env.EMAIL_USER);
    console.log('Server:', process.env.EMAIL_HOST, ':', process.env.EMAIL_PORT);

    if (!process.env.EMAIL_PASS) {
        console.error('ERROR: EMAIL_PASS is missing in your .env file!');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT == 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        // 1. Verify connection configuration
        console.log('Checking connection configuration...');
        await transporter.verify();
        console.log('✅ Connection is valid!');

        // 2. Send a test email
        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || `"Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to yourself
            subject: '📧 Adria Cross Edit: Email System Test',
            text: 'If you are reading this, your Nodemailer setup is working perfectly!',
            html: '<h3>Success!</h3><p>Your Nodemailer setup is working perfectly on <b>Adria Cross Edit</b>.</p>'
        });

        console.log('✅ Message sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info) || 'N/A');
    } catch (error) {
        console.error('❌ Test Failed!');
        console.error('Error Details:', error.message);

        if (error.message.includes('Invalid login')) {
            console.log('\nTIP: Double check your App Password. Remember it should be 16 characters with no spaces.');
        } else if (error.message.includes('ETIMEDOUT')) {
            console.log('\nTIP: Connection timed out. Try changing EMAIL_PORT to 465 or ensure your firewall allows outgoing SMTP.');
        }
    }
}

testConnection();
