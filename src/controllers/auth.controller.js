const databaseService = require('../services/database.service');
const { validateEmail, extractNameFromEmail } = require('../utils/validators');
const { validatePasswordStrength } = require('../utils/password');
const jwt = require('jsonwebtoken');

/**
 * Authentication Controller
 * Handles user authentication and session management
 */
class AuthController {
  /**
   * Login user
   * @route POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email și parola sunt obligatorii' });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({
          error: 'Email-ul trebuie să fie @devhub.tech, @titans.net sau @solidstake.com'
        });
      }

      const user = await databaseService.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credențiale invalide' });
      }

      if (!databaseService.verifyPassword(password, user.password)) {
        return res.status(401).json({ error: 'Credențiale invalide' });
      }

      // Auto-set employee name from email if not set
      let employeeName = user.employee_name;
      if (!employeeName) {
        // Extract name directly from email (e.g., alex.ghetu@devhub.tech -> "Alex Ghetu")
        employeeName = extractNameFromEmail(email);
        if (employeeName) {
          await databaseService.updateUserEmployeeName(user.id, employeeName);
          console.log(`Auto-set employee name for ${email}: ${employeeName}`);
        }
      }

      // Generate JWT token
      const tokenPayload = {
        id: user.id,
        email: user.email,
        is_admin: Boolean(user.is_admin),
        employee_name: employeeName
      };

      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'food-search-jwt-secret-2024-change-this-in-production',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Also set session for backward compatibility
      req.session.user = tokenPayload;

      console.log('✓ User logged in:', {
        email: user.email,
        is_admin: Boolean(user.is_admin),
        token_generated: true
      });

      res.json({
        success: true,
        token,
        user: {
          email: user.email,
          is_admin: Boolean(user.is_admin),
          employee_name: employeeName
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Register new user
   * @route POST /api/auth/register
   */
  async register(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email și parola sunt obligatorii' });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({
          error: 'Email-ul trebuie să fie @devhub.tech, @titans.net sau @solidstake.com'
        });
      }

      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          error: 'Parola nu îndeplinește cerințele de securitate',
          details: passwordValidation.feedback.join('. ')
        });
      }

      // Extract expected employee name from email
      const expectedEmployeeName = extractNameFromEmail(email);

      // Check for inactive user with matching employee name
      const allUsers = await databaseService.getAllUsers();
      const inactiveUser = allUsers.find(u =>
        u.is_active === 0 &&
        u.employee_name &&
        u.employee_name.toLowerCase() === expectedEmployeeName.toLowerCase()
      );

      if (inactiveUser) {
        await databaseService.activateUser(inactiveUser.email, password);

        // Update email if different
        if (inactiveUser.email !== email.toLowerCase().trim()) {
          await databaseService.db.run(
            'UPDATE users SET email = ? WHERE id = ?',
            [email.toLowerCase().trim(), inactiveUser.id]
          );
        }

        console.log(`Activated inactive user: ${inactiveUser.employee_name} with email ${email}`);
        res.json({ success: true, message: 'Cont activat cu succes! Te poți autentifica acum.' });
      } else {
        // Create new user
        await databaseService.createUser(email, password, 0);

        // Auto-set employee name from email
        const autoEmployeeName = extractNameFromEmail(email);
        if (autoEmployeeName) {
          const newUser = await databaseService.getUserByEmail(email);
          if (newUser) {
            await databaseService.updateUserEmployeeName(newUser.id, autoEmployeeName);
            console.log(`Auto-set employee name for new user ${email}: ${autoEmployeeName}`);
          }
        }

        res.json({ success: true, message: 'Cont creat cu succes! Te poți autentifica acum.' });
      }
    } catch (error) {
      console.error('Register error:', error);
      if (error.message && error.message.includes('Invalid email domain')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: 'Email-ul există deja' });
      }
    }
  }

  /**
   * Logout user
   * @route POST /api/auth/logout
   */
  async logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.json({ success: true });
    });
  }

  /**
   * Get current user
   * @route GET /api/auth/me
   */
  async me(req, res) {
    try {
      const user = await databaseService.getUserById(req.user.id);
      res.json({
        user: {
          id: user.id,
          email: user.email,
          is_admin: user.is_admin,
          employee_name: user.employee_name
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = new AuthController();
