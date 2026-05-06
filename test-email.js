import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const cleanPass = (process.env.SMTP_PASS || 'cishyizfyoqehjhk').replace(/["\s]/g, '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'helicalconsulting@gmail.com',
    pass: cleanPass
  }
});

const mailOptions = {
  from: '"Repnex AI Test" <' + (process.env.SMTP_USER || 'helicalconsulting@gmail.com') + '>',
  to: 'jai@helical.consulting, keshav@helical.consulting, helicalconsulting@gmail.com',
  subject: '🚀 SMTP Test - Repnex AI',
  text: 'This is a test email to verify SMTP configuration from the server script.'
};

console.log('-------------------------------------------');
console.log('Starting SMTP test...');
console.log('User:', process.env.SMTP_USER || 'helicalconsulting@gmail.com');
console.log('Password length:', cleanPass.length);
console.log('-------------------------------------------');

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('❌ SMTP Test Failed!');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    if (error.response) console.error('Server Response:', error.response);
  } else {
    console.log('✅ SMTP Test Succeeded!');
    console.log('Response:', info.response);
  }
  console.log('-------------------------------------------');
});
