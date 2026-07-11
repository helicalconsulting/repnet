import nodemailer from 'nodemailer';
import { MongoClient } from 'mongodb';

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

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, countryCode, phone } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

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
            pass: SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Repnex AI" <${SMTP_USER}>`,
          to: SMTP_TO,
          subject: '🔥 New Early Bird Subscriber - Repnex AI',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
              <h2 style="color: #0055FF;">New Early Bird Subscriber</h2>
              <hr />
              <p><strong>Name:</strong> ${name || 'N/A'}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${countryCode || ''} ${phone || 'N/A'}</p>
              <br />
              <p style="font-size: 12px; color: #666;">Automated notification from Repnex Landing Page.</p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error('Subscribe SMTP Error (non-fatal):', emailError.message, emailError.code);
    }

    return res.status(200).json({ message: 'Email saved successfully' });
  } catch (error) {
    console.error('Unhandled error in subscribe handler:', error.message);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

