import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.MONGODB_DB || 'repnet';

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);
  cachedDb = db;
  return db;
}

// Routes
app.post('/api/subscribe', async (req, res) => {
  const { name, email, countryCode, phone } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    // 1. Save to MongoDB
    try {
      const db = await connectToDatabase();
      await db.collection('subscribers').updateOne(
        { email: email.trim().toLowerCase() },
        {
          $set: {
            name: name?.trim() || '',
            countryCode: countryCode || '',
            phone: phone || '',
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
    } catch (dbError) {
      console.error('Database connection or save error in subscribe:', dbError.message);
    }

    // 2. Attempt to send Email (Non-fatal)
    try {
      const SMTP_USER = (process.env.SMTP_USER || '').trim();
      const SMTP_PASS = (process.env.SMTP_PASS || '').replace(/["\s]/g, '');
      const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
      const SMTP_TO = (process.env.SMTP_TO || 'jai@helical.consulting,keshav@helical.consulting,helicalconsulting@gmail.com')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      if (SMTP_USER && SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
          }
        });

        const mailOptions = {
          from: `"Repnex AI" <${SMTP_USER}>`,
          to: SMTP_TO,
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
      }
    } catch (emailError) {
      console.error('SMTP Subscription Email Error (non-fatal):', emailError);
    }

    res.status(200).json({ message: 'Email saved successfully' });
  } catch (error) {
    console.error('Unhandled error in subscribe handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

let waitlistCount = 142;

app.get('/api/waitlist/count', (req, res) => {
  res.status(200).json({ count: waitlistCount });
});

app.post('/api/waitlist', async (req, res) => {
  const { email, company, erp_system } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    // 1. Save to MongoDB
    try {
      const db = await connectToDatabase();
      await db.collection('waitlist').updateOne(
        { email: email.trim().toLowerCase() },
        {
          $set: {
            company: company?.trim() || '',
            erp_system: erp_system || '',
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
    } catch (dbError) {
      console.error('Database connection or save error in waitlist:', dbError.message);
    }

    // 2. Attempt to send Email (Non-fatal)
    try {
      const SMTP_USER = (process.env.SMTP_USER || '').trim();
      const SMTP_PASS = (process.env.SMTP_PASS || '').replace(/["\s]/g, '');
      const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
      const SMTP_TO = (process.env.SMTP_TO || 'jai@helical.consulting,keshav@helical.consulting,helicalconsulting@gmail.com')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      if (SMTP_USER && SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
          }
        });

        const mailOptions = {
          from: `"Repnex AI" <${SMTP_USER}>`,
          to: SMTP_TO,
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
      }
    } catch (emailError) {
      console.error('SMTP Waitlist Email Error (non-fatal):', emailError);
    }

    waitlistCount += 1;
    res.status(200).json({ message: 'Waitlist signup successful' });
  } catch (error) {
    console.error('Unhandled error in waitlist handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export the app for Vercel
export default app;

