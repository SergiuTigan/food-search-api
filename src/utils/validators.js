/**
 * Validation Utilities
 */

/**
 * Validate email domain
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email domain is allowed
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Get allowed domains from environment or use defaults
  const allowedDomainsStr = process.env.ALLOWED_EMAIL_DOMAINS || '@devhub.tech,@titans.net,@solidstake.com';
  const allowedDomains = allowedDomainsStr.split(',').map(d => d.trim());

  const emailLower = email.toLowerCase().trim();
  const hasValidDomain = allowedDomains.some(domain => emailLower.endsWith(domain));

  if (!hasValidDomain) {
    return false;
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailLower);
}

/**
 * Extract name from email
 * @param {string} email - Email address
 * @returns {string|null} Formatted name or null
 */
function extractNameFromEmail(email) {
  if (!email) return null;

  const emailLower = email.toLowerCase().trim();
  const localPart = emailLower.split('@')[0];

  // Split by dots and capitalize each part
  const parts = localPart.split('.');
  const capitalizedParts = parts.map(part => {
    if (!part) return '';
    return part.charAt(0).toUpperCase() + part.slice(1);
  });

  return capitalizedParts.join(' ');
}

/**
 * Reverse name order (e.g., "Alexandru Ghetu" <-> "Ghetu Alexandru")
 * @param {string} name - Name to reverse
 * @returns {string|null} Reversed name or null
 */
function reverseNameOrder(name) {
  if (!name) return null;
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;

  // For two-part names, simply swap them
  if (parts.length === 2) {
    return `${parts[1]} ${parts[0]}`;
  }

  // For multi-part names, swap first and rest
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return `${lastName} ${firstName}`;
}

/**
 * Parse period from filename (e.g., "FOOD 13-17.xlsx" -> "13-17")
 * @param {string} filename - Filename to parse
 * @returns {string|null} Period or null
 */
function parsePeriodFromFilename(filename) {
  if (!filename) return null;

  // Remove file extension
  const nameWithoutExt = filename.replace(/\.(xlsx|xls|csv)$/i, '');

  // Match "13-17" or "20-24" pattern
  const periodPattern = /(\d{1,2})\s*-\s*(\d{1,2})/;
  const match = nameWithoutExt.match(periodPattern);

  if (match) {
    return `${match[1]}-${match[2]}`;
  }

  return null;
}

/**
 * Parse month and year from filename (e.g., "FOOD 13-17.10.2025" or "FOOD 13-17 OCT")
 * @param {string} filename - Filename to parse
 * @returns {Object|null} Object with month and year, or null
 */
function parseMonthYearFromFilename(filename) {
  if (!filename) return null;

  const nameWithoutExt = filename.replace(/\.(xlsx|xls|csv)$/i, '');

  // Try to match numeric format: "13-17.10.2025" or "13-17.10"
  const numericPattern = /\d{1,2}\s*-\s*\d{1,2}[\s.]+(\d{1,2})(?:\.(\d{4}))?/;
  const numericMatch = nameWithoutExt.match(numericPattern);
  if (numericMatch) {
    const month = parseInt(numericMatch[1]) - 1; // Convert to 0-indexed
    const year = numericMatch[2] ? parseInt(numericMatch[2]) : new Date().getFullYear();
    return { month, year };
  }

  // Try to match month abbreviation: "OCT", "NOV", "DEC", etc.
  const monthNames = {
    'JAN': 0, 'JANUARY': 0,
    'FEB': 1, 'FEBRUARY': 1,
    'MAR': 2, 'MARCH': 2,
    'APR': 3, 'APRIL': 3,
    'MAY': 4,
    'JUN': 5, 'JUNE': 5,
    'JUL': 6, 'JULY': 6,
    'AUG': 7, 'AUGUST': 7,
    'SEP': 8, 'SEPT': 8, 'SEPTEMBER': 8,
    'OCT': 9, 'OCTOBER': 9,
    'NOV': 10, 'NOVEMBER': 10,
    'DEC': 11, 'DECEMBER': 11
  };

  const monthPattern = /\b(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUNE?|JULY?|AUG(?:UST)?|SEPT?(?:EMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\b/i;
  const monthMatch = nameWithoutExt.match(monthPattern);
  if (monthMatch) {
    const monthName = monthMatch[1].toUpperCase();
    const month = monthNames[monthName];

    // Try to find a year in the filename
    const yearPattern = /\b(20\d{2})\b/;
    const yearMatch = nameWithoutExt.match(yearPattern);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    return { month, year };
  }

  return null;
}

/**
 * Calculate file hash from buffer
 * @param {Buffer} buffer - File buffer
 * @returns {string} MD5 hash
 */
function calculateFileHash(buffer) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * Validate day of week
 * @param {string} day - Day name
 * @returns {boolean} True if valid day
 */
function isValidDay(day) {
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  return validDays.includes(day.toLowerCase());
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string
 * @returns {boolean} True if valid date format
 */
function isValidDate(date) {
  if (!date) return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

module.exports = {
  validateEmail,
  extractNameFromEmail,
  reverseNameOrder,
  parsePeriodFromFilename,
  parseMonthYearFromFilename,
  calculateFileHash,
  isValidDay,
  isValidDate
};
