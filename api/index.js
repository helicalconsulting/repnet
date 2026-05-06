import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/subscribe', async (req, res) => {
  const { name, email, countryCode, phone } = req.body;

  try {
    const rawPass = process.env.SMTP_PASS;
    const cleanPass = rawPass ? rawPass.replace(/["\s]/g, '') : '';
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: cleanPass
      }
    });

    const mailOptions = {
      from: `"Repnex AI" <${process.env.SMTP_USER}>`,
      to: 'jai@helical.consulting, keshav@helical.consulting, helicalconsulting@gmail.com',
      subject: '🔥 New Early Bird Subscriber - Repnex AI',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #0055FF;">New Early Bird Subscriber Details</h2>
          <hr />
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${countryCode} ${phone}</p>
          <br />
          <p style="font-size: 12px; color: #666;">This is an automated notification from your Repnex Landing Page.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('SMTP Error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

let waitlistCount = 142;

app.get('/api/waitlist/count', (req, res) => {
  res.status(200).json({ count: waitlistCount });
});

app.post('/api/waitlist', async (req, res) => {
  const { email, company, erp_system } = req.body;

  try {
    const rawPass = process.env.SMTP_PASS;
    const cleanPass = rawPass ? rawPass.replace(/["\s]/g, '') : '';
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: cleanPass
      }
    });

    const mailOptions = {
      from: `"Repnex AI" <${process.env.SMTP_USER}>`,
      to: 'jai@helical.consulting, keshav@helical.consulting, helicalconsulting@gmail.com',
      subject: '✨ New Waitlist Signup - Repnex AI',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #0055FF;">New Waitlist Signup</h2>
          <hr />
          <p><strong>Work Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company || 'N/A'}</p>
          <p><strong>ERP System:</strong> ${erp_system || 'N/A'}</p>
          <br />
          <p style="font-size: 12px; color: #666;">This is an automated notification from your Repnex Waitlist Form.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Waitlist signup successful' });
  } catch (error) {
    console.error('Waitlist SMTP Error:', error);
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
});

// Export the app for Vercel
export default app;
