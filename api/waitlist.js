import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, company, erp_system } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
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
          <p style="font-size: 12px; color: #666;">Automated notification from Repnex Waitlist Form.</p>
        </div>
      `,
    });

    return res.status(200).json({ message: 'Waitlist signup successful' });
  } catch (error) {
    console.error('Waitlist SMTP Error:', error.message, error.code);
    return res.status(500).json({ error: 'Failed to join waitlist', details: error.message });
  }
}
