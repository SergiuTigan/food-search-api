#!/usr/bin/env node

/**
 * Generate Secure Password Script
 * Utility to generate secure passwords for admin accounts
 *
 * Usage:
 *   node scripts/generate-password.js [length]
 *   npm run generate-password [-- length]
 */

const { generateSecurePassword, validatePasswordStrength } = require('../src/utils/password');

// Get length from command line argument
const length = parseInt(process.argv[2]) || 16;

if (length < 8) {
  console.error('❌ Password length must be at least 8 characters');
  process.exit(1);
}

console.log('\n🔐 Generating secure password...\n');

// Generate password
const password = generateSecurePassword(length);

// Validate strength
const validation = validatePasswordStrength(password);

console.log('Generated Password:', password);
console.log('Length:', password.length, 'characters');
console.log('Strength:', validation.strength.toUpperCase());
console.log('Score:', validation.score);
console.log('\n✅ Add this password to your .env file:');
console.log(`ADMIN_PASSWORD=${password}\n`);

if (validation.feedback.length > 0) {
  console.log('💡 Suggestions:');
  validation.feedback.forEach(feedback => console.log(`  - ${feedback}`));
  console.log();
}

console.log('⚠️  Keep this password secure and never commit it to version control!\n');
