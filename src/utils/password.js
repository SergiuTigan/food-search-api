const crypto = require('crypto');

/**
 * Password Utilities
 * Helpers for generating and validating secure passwords
 */

/**
 * Generate a secure random password
 * @param {number} length - Password length (default: 16)
 * @param {Object} options - Password options
 * @param {boolean} options.includeUppercase - Include uppercase letters (default: true)
 * @param {boolean} options.includeLowercase - Include lowercase letters (default: true)
 * @param {boolean} options.includeNumbers - Include numbers (default: true)
 * @param {boolean} options.includeSymbols - Include symbols (default: true)
 * @returns {string} Generated password
 */
function generateSecurePassword(length = 16, options = {}) {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true
  } = options;

  let charset = '';
  let requiredChars = [];

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (includeUppercase) {
    charset += uppercase;
    requiredChars.push(uppercase[Math.floor(Math.random() * uppercase.length)]);
  }
  if (includeLowercase) {
    charset += lowercase;
    requiredChars.push(lowercase[Math.floor(Math.random() * lowercase.length)]);
  }
  if (includeNumbers) {
    charset += numbers;
    requiredChars.push(numbers[Math.floor(Math.random() * numbers.length)]);
  }
  if (includeSymbols) {
    charset += symbols;
    requiredChars.push(symbols[Math.floor(Math.random() * symbols.length)]);
  }

  if (!charset) {
    throw new Error('At least one character type must be included');
  }

  // Generate remaining characters
  const remainingLength = length - requiredChars.length;
  const randomChars = Array.from(
    crypto.randomBytes(remainingLength),
    byte => charset[byte % charset.length]
  );

  // Combine and shuffle
  const allChars = [...requiredChars, ...randomChars];
  return shuffleArray(allChars).join('');
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with score and feedback
 */
function validatePasswordStrength(password) {
  const result = {
    isValid: false,
    score: 0,
    feedback: []
  };

  if (!password) {
    result.feedback.push('Password is required');
    return result;
  }

  // Length check
  if (password.length < 8) {
    result.feedback.push('Password must be at least 8 characters long');
  } else if (password.length >= 8 && password.length < 12) {
    result.score += 1;
    result.feedback.push('Consider using a longer password (12+ characters)');
  } else if (password.length >= 12) {
    result.score += 2;
  }

  // Complexity checks
  if (/[a-z]/.test(password)) {
    result.score += 1;
  } else {
    result.feedback.push('Add lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    result.score += 1;
  } else {
    result.feedback.push('Add uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    result.score += 1;
  } else {
    result.feedback.push('Add numbers');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    result.score += 1;
  } else {
    result.feedback.push('Add special characters');
  }

  // Common password patterns
  const commonPatterns = [
    /^password/i,
    /^admin/i,
    /^123456/,
    /^qwerty/i,
    /^letmein/i,
    /^welcome/i
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    result.score -= 2;
    result.feedback.push('Avoid common password patterns');
  }

  // Sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    result.score -= 1;
    result.feedback.push('Avoid sequential characters');
  }

  // Repeated characters
  if (/(.)\1{2,}/.test(password)) {
    result.score -= 1;
    result.feedback.push('Avoid repeated characters');
  }

  // Determine validity
  result.isValid = result.score >= 4;

  // Add strength description
  if (result.score >= 6) {
    result.strength = 'strong';
  } else if (result.score >= 4) {
    result.strength = 'medium';
  } else {
    result.strength = 'weak';
  }

  return result;
}

/**
 * Generate a cryptographically secure random token
 * @param {number} bytes - Number of bytes (default: 32)
 * @returns {string} Hex-encoded token
 */
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = {
  generateSecurePassword,
  validatePasswordStrength,
  generateToken
};
