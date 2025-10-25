/**
 * Authentication Middleware
 * Provides session-based authentication and authorization
 */

/**
 * Verify user is authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

/**
 * Verify user has admin privileges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function isAdmin(req, res, next) {
  console.log('🔐 Admin check:', {
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    userEmail: req.session?.user?.email,
    isAdmin: req.session?.user?.is_admin,
    sessionID: req.sessionID
  });

  if (req.session && req.session.user && req.session.user.is_admin) {
    console.log('✓ Admin access granted');
    next();
  } else {
    console.log('✗ Admin access denied');
    res.status(403).json({
      error: 'Admin access required',
      debug: {
        authenticated: !!req.session?.user,
        is_admin: req.session?.user?.is_admin
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
