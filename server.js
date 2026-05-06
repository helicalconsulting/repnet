import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/subscribe', async (req, res) => {
  const { name, email, countryCode, phone } = req.body;

  try {
    // Clean the password from environment (remove quotes and spaces)
    const rawPass = process.env.SMTP_PASS || 'cishyizfyoqehjhk';
    const cleanPass = rawPass.replace(/["\s]/g, '');
    
    console.log('Attempting SMTP with User:', process.env.SMTP_USER || 'helicalconsulting@gmail.com');
    console.log('Password clean length:', cleanPass.length);
    console.log('Raw password length:', rawPass.length);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'helicalconsulting@gmail.com',
        pass: cleanPass
      }
    });

    const mailOptions = {
      from: '"Repnex AI" <' + (process.env.SMTP_USER || 'noreply@repnex.ai') + '>',
      to: 'jai@helical.consulting, keshav@helical.consulting',
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

    // If using dummy ethereal, we won't actually send unless we create a test account
    if (!process.env.SMTP_USER) {
      console.log('Sending mock email (no SMTP_USER provided):', mailOptions);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.status(200).json({ message: 'Mock email sent successfully' });
    }

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Detailed SMTP Error:', error);
    res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message,
      code: error.code
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
