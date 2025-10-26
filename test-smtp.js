require('dotenv').config();
const nodemailer = require('nodemailer');

const emailPort = parseInt(process.env.EMAIL_PORT || '587');

console.log('=== Testing SMTP Connection ===');
console.log('Host:', process.env.EMAIL_HOST);
console.log('Port:', emailPort);
console.log('User:', process.env.EMAIL_USER);
console.log('Secure:', emailPort === 465);
console.log('STARTTLS:', emailPort === 587);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'mail.dobby.devhub.tech',
  port: emailPort,
  secure: emailPort === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

console.log('\nAttempting to verify connection...\n');

transporter.verify()
  .then(() => {
    console.log('✓ SUCCESS! Email server is ready to send messages');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ FAILED! Email configuration error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  });
