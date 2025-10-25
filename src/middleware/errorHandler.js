/**
 * Global Error Handler Middleware
 */

/**
 * Handle errors and send appropriate response
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File size too large. Maximum size is 10MB'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: err.message
    });
  }

  // Database errors
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      error: 'Database constraint violation. Possible duplicate entry.'
    });
  }

  // Default server error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
}

/**
 * Handle 404 Not Found
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function notFound(req, res) {
  res.status(404).json({
    error: 'Route not found'
  });
}

module.exports = {
  errorHandler,
  notFound
};
