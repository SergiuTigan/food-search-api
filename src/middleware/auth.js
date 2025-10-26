/**
 * Authentication Middleware
 * Provides JWT-based authentication and authorization (with session fallback)
 */

const jwt = require('jsonwebtoken');

/**
 * Verify user is authenticated (JWT or Session)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function isAuthenticated(req, res, next) {
  // First try JWT authentication
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'food-search-jwt-secret-2024-change-this-in-production'
      );
      req.user = decoded;
      return next();
    } catch (error) {
      console.log('JWT verification failed:', error.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  // Fallback to session authentication
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  res.status(401).json({ error: 'Not authenticated' });
}

/**
 * Verify user has admin privileges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function isAdmin(req, res, next) {
  // First authenticate the user (JWT or session)
  const token = req.headers.authorization?.replace('Bearer ', '');
  let user = null;

  if (token) {
    try {
      user = jwt.verify(
        token,
        process.env.JWT_SECRET || 'food-search-jwt-secret-2024-change-this-in-production'
      );
      req.user = user;
    } catch (error) {
      console.log('JWT verification failed:', error.message);
    }
  }

  // Fallback to session
  if (!user && req.session && req.session.user) {
    user = req.session.user;
    req.user = user;
  }

  console.log('🔐 Admin check:', {
    hasUser: !!user,
    userEmail: user?.email,
    isAdmin: user?.is_admin,
    authMethod: token ? 'JWT' : 'Session'
  });

  if (user && user.is_admin) {
    console.log('✓ Admin access granted');
    next();
  } else {
    console.log('✗ Admin access denied');
    res.status(403).json({
      error: 'Admin access required',
      debug: {
        authenticated: !!user,
        is_admin: user?.is_admin
      }
    });
  }
}

/**
 * Optional authentication - doesn't fail if not authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function optionalAuth(req, res, next) {
  // Just pass through, authentication is optional
  next();
}

module.exports = {
  isAuthenticated,
  isAdmin,
  optionalAuth
};
