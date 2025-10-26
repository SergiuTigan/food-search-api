require('dotenv').config();

console.log('=== Email Environment Variables ===');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? `${process.env.EMAIL_PASSWORD.substring(0, 5)}...` : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('\n=== Email Password Length ===');
console.log('Password length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0);
console.log('First char:', process.env.EMAIL_PASSWORD ?  process.env.EMAIL_PASSWORD[0] : '');
console.log('Last char:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD[process.env.EMAIL_PASSWORD.length - 1] : '');
