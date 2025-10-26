const databaseService = require('../services/database.service');
const { validateEmail } = require('../utils/validators');

/**
 * Users Controller
 * Handles user management operations
 */
class UsersController {
  /**
   * Get list of employee names
   * @route GET /api/users/employees
   */
  async getEmployees(req, res) {
    try {
      const employees = await databaseService.getEmployeeNames();
      res.json({ employees });
    } catch (error) {
      console.error('Get employees error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Set employee name for current user
   * @route POST /api/users/me/employee-name
   */
  async setEmployeeName(req, res) {
    try {
      const { employee_name } = req.body;

      if (!employee_name) {
        return res.status(400).json({ error: 'Numele angajatului este obligatoriu' });
      }

      // Verify employee name exists in current menu
      const employees = await databaseService.getEmployeeNames();
      if (!employees.includes(employee_name)) {
        return res.status(400).json({ error: 'Numele nu există în meniul curent' });
      }

      // Get user ID from either JWT or session
      const userId = req.user.id;

      await databaseService.updateUserEmployeeName(userId, employee_name);

      // Update session if exists (for backward compatibility)
      if (req.session && req.session.user) {
        req.session.user.employee_name = employee_name;
      }

      res.json({ success: true, message: 'Nume asignat cu succes' });
    } catch (error) {
      console.error('Update employee name error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get all employee names (for autocomplete)
   * @route GET /api/users/employees/names
   */
  async getEmployeeNames(req, res) {
    try {
      const users = await databaseService.getAllUsers();
      const employeeNames = users
        .map(user => user.employee_name)
        .filter(name => name && name.trim())
        .sort();
      res.json({ names: employeeNames });
    } catch (error) {
      console.error('Get employee names error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Create new user (admin only)
   * @route POST /api/users
   */
  async createUser(req, res) {
    try {
      const { email, password, is_admin } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email și parola sunt obligatorii' });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({
          error: 'Email-ul trebuie să fie @devhub.tech, @titans.net sau @solidstake.com'
        });
      }

      await databaseService.createUser(email, password, is_admin ? 1 : 0);
      res.json({ success: true, message: 'Utilizator creat cu succes' });
    } catch (error) {
      console.error('Create user error:', error);
      if (error.message && error.message.includes('Invalid email domain')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: 'Email-ul există deja' });
      }
    }
  }

  /**
   * Get all users (admin only)
   * @route GET /api/users
   */
  async getAllUsers(req, res) {
    try {
      const users = await databaseService.getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = new UsersController();
