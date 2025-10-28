const bcrypt = require('bcrypt');
const database = require('../config/database');
const { validateEmail, extractNameFromEmail, reverseNameOrder } = require('../utils/validators');

/**
 * Database Service
 * Handles all database operations for the application
 */
class DatabaseService {
  constructor() {
    this.db = database;
  }

  /**
   * Initialize database tables and default data
   */
  async initialize() {
    try {
      await this.db.connect();
      await this._createTables();
      await this._createDefaultAdmin();
      console.log('✓ Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   * @private
   */
  async _createTables() {
    // Users table
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        is_admin INTEGER DEFAULT 0,
        employee_name TEXT,
        is_active INTEGER DEFAULT 1
      )
    `);

    // Meals table
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_name TEXT NOT NULL,
        division TEXT,
        week_start_date TEXT NOT NULL,
        period TEXT,
        source_file TEXT,
        monday TEXT,
        tuesday TEXT,
        wednesday TEXT,
        thursday TEXT,
        friday TEXT,
        UNIQUE(employee_name, week_start_date)
      )
    `);

    // Meal options table
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS meal_options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_start_date TEXT NOT NULL,
        period TEXT,
        source_file TEXT,
        category TEXT NOT NULL,
        monday TEXT,
        tuesday TEXT,
        wednesday TEXT,
        thursday TEXT,
        friday TEXT,
        UNIQUE(week_start_date, category)
      )
    `);

    // Meal selections table
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS meal_selections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        week_start_date TEXT NOT NULL,
        monday TEXT,
        tuesday TEXT,
        wednesday TEXT,
        thursday TEXT,
        friday TEXT,
        is_locked INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, week_start_date)
      )
    `);

    // Add is_locked column to existing meal_selections table if it doesn't exist
    try {
      await this.db.run(`ALTER TABLE meal_selections ADD COLUMN is_locked INTEGER DEFAULT 0`);
    } catch (error) {
      // Column already exists, ignore error
      if (!error.message.includes('duplicate column name')) {
        console.error('Error adding is_locked column:', error);
      }
    }

    // Upload history table
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS upload_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        file_hash TEXT NOT NULL,
        upload_type TEXT NOT NULL,
        period TEXT,
        week_start_date TEXT,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        row_count INTEGER,
        UNIQUE(file_hash)
      )
    `);

    // Meal reviews table
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS meal_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        meal_name TEXT NOT NULL,
        review_text TEXT NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        week_start_date TEXT NOT NULL,
        day_of_week TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, meal_name, week_start_date, day_of_week)
      )
    `);

    // Week settings table (for lock/unlock functionality)
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS week_settings (
        week_start_date TEXT PRIMARY KEY,
        is_locked INTEGER DEFAULT 0,
        locked_at TIMESTAMP,
        unlocked_users TEXT DEFAULT '[]'
      )
    `);

    // Unlock requests table (for users requesting to unlock their selections)
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS unlock_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        week_start_date TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        processed_by INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (processed_by) REFERENCES users(id)
      )
    `);

    // Create a unique index only for pending requests (allows multiple approved/rejected in history)
    try {
      await this.db.run(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_request
        ON unlock_requests(user_id, week_start_date)
        WHERE status = 'pending'
      `);
    } catch (error) {
      // Index might already exist, ignore error
      if (!error.message || !error.message.includes('already exists')) {
        console.error('Error creating unique index:', error);
      }
    }

    // User invitations table
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS user_invitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        invitation_token TEXT UNIQUE NOT NULL,
        is_admin INTEGER DEFAULT 0,
        invited_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (invited_by) REFERENCES users(id)
      )
    `);

    // Create index on token for fast lookup
    try {
      await this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_invitation_token
        ON user_invitations(invitation_token)
      `);
    } catch (error) {
      if (!error.message || !error.message.includes('already exists')) {
        console.error('Error creating invitation token index:', error);
      }
    }

    // Meal transfers table (when users pass their meal to colleagues)
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS meal_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user_id INTEGER NOT NULL,
        week_start_date TEXT NOT NULL,
        day_of_week TEXT NOT NULL,
        meal_details TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        claimed_by_user_id INTEGER,
        claimed_at TIMESTAMP,
        status TEXT DEFAULT 'available',
        UNIQUE(from_user_id, week_start_date, day_of_week),
        CHECK(status IN ('available', 'claimed')),
        FOREIGN KEY (from_user_id) REFERENCES users(id),
        FOREIGN KEY (claimed_by_user_id) REFERENCES users(id)
      )
    `);

    // Menu copies table (track when users copy another user's complete menu for a day)
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS menu_copies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        copied_from_user_id INTEGER NOT NULL,
        week_start_date TEXT NOT NULL,
        day_of_week TEXT NOT NULL,
        menu_details TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, week_start_date, day_of_week),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (copied_from_user_id) REFERENCES users(id)
      )
    `);
  }

  /**
   * Create default admin user
   * @private
   */
  async _createDefaultAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'sergiu.tigan@devhub.tech';
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check if admin already exists
    const existingAdmin = await this.db.get(
      'SELECT * FROM users WHERE email = ?',
      [adminEmail]
    );

    if (!existingAdmin) {
      // Only create admin if password is provided in environment
      if (!adminPassword) {
        console.warn('⚠️  ADMIN_PASSWORD not set in environment variables.');
        console.warn('⚠️  Please set ADMIN_PASSWORD in .env to create default admin user.');
        console.warn('⚠️  You can create admin users manually or via registration.');
        return;
      }

      // Validate password strength
      if (adminPassword.length < 8) {
        console.error('❌ ADMIN_PASSWORD must be at least 8 characters long');
        return;
      }

      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      await this.db.run(
        'INSERT INTO users (email, password, is_admin) VALUES (?, ?, ?)',
        [adminEmail, hashedPassword, 1]
      );
      console.log(`✓ Default admin user created (email: ${adminEmail})`);
      console.log('⚠️  Please change the admin password after first login!');
    }
  }

  // ===== USER OPERATIONS =====

  /**
   * Create a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {number} isAdmin - Admin status (0 or 1)
   * @param {number} isActive - Active status (0 or 1)
   */
  async createUser(email, password, isAdmin = 0, isActive = 1) {
    if (!validateEmail(email)) {
      throw new Error('Invalid email domain');
    }

    const emailLower = email.toLowerCase().trim();
    const hashedPassword = password ? bcrypt.hashSync(password, 10) : null;

    await this.db.run(
      'INSERT INTO users (email, password, is_admin, is_active) VALUES (?, ?, ?, ?)',
      [emailLower, hashedPassword, isAdmin, isActive]
    );
  }

  /**
   * Create an inactive user (for imported employee names)
   * @param {string} employeeName - Employee name
   */
  async createInactiveUser(employeeName) {
    const nameParts = employeeName.toLowerCase().split(' ').filter(p => p);
    const dummyEmail = nameParts.join('.') + '@placeholder.com';

    try {
      await this.db.run(
        'INSERT INTO users (email, password, is_admin, employee_name, is_active) VALUES (?, ?, ?, ?, ?)',
        [dummyEmail, null, 0, employeeName, 0]
      );
      return dummyEmail;
    } catch (error) {
      if (error.message && error.message.includes('UNIQUE constraint')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Activate an inactive user
   * @param {string} email - User email
   * @param {string} password - New password
   */
  async activateUser(email, password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    await this.db.run(
      'UPDATE users SET password = ?, is_active = 1 WHERE email = ?',
      [hashedPassword, email]
    );
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>}
   */
  async getUserByEmail(email) {
    const emailLower = email.toLowerCase().trim();
    return await this.db.get('SELECT * FROM users WHERE email = ?', [emailLower]);
  }

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async getUserById(userId) {
    return await this.db.get('SELECT * FROM users WHERE id = ?', [userId]);
  }

  /**
   * Verify password
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password
   * @returns {boolean}
   */
  verifyPassword(password, hashedPassword) {
    return bcrypt.compareSync(password, hashedPassword);
  }

  /**
   * Update user employee name
   * @param {number} userId - User ID
   * @param {string} employeeName - Employee name
   */
  async updateUserEmployeeName(userId, employeeName) {
    await this.db.run('UPDATE users SET employee_name = ? WHERE id = ?', [employeeName, userId]);
  }

  /**
   * Get all users (non-admin)
   * @returns {Promise<Array>}
   */
  async getAllUsers() {
    return await this.db.all(`
      SELECT id, email, employee_name, is_admin, is_active
      FROM users
      WHERE is_admin = 0
      ORDER BY employee_name, email
    `);
  }

  async getTotalEmployeesCount() {
    const result = await this.db.get(`
      SELECT COUNT(*) as count
      FROM users
      WHERE is_admin = 0 AND is_active = 1
    `);
    return result.count || 0;
  }

  // ===== MEAL OPTIONS OPERATIONS =====

  /**
   * Save meal options
   * @param {Array} optionsData - Array of meal option objects
   * @param {string} period - Week period
   * @param {string} sourceFile - Source filename
   */
  async saveMealOptions(optionsData, period = null, sourceFile = null) {
    if (optionsData.length > 0) {
      const weekStartDate = optionsData[0].week_start_date;
      await this.db.run('DELETE FROM meal_options WHERE week_start_date = ?', [weekStartDate]);
    }

    for (const option of optionsData) {
      await this.db.run(
        `INSERT INTO meal_options (week_start_date, period, source_file, category, monday, tuesday, wednesday, thursday, friday)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          option.week_start_date,
          period || option.period || '',
          sourceFile || option.source_file || '',
          option.category,
          option.monday || '',
          option.tuesday || '',
          option.wednesday || '',
          option.thursday || '',
          option.friday || ''
        ]
      );
    }
  }

  /**
   * Get meal options for a week
   * @param {string} weekStartDate - Week start date
   * @returns {Promise<Array>}
   */
  async getMealOptions(weekStartDate) {
    return await this.db.all(
      'SELECT * FROM meal_options WHERE week_start_date = ? ORDER BY category',
      [weekStartDate]
    );
  }

  /**
   * Get latest meal options week
   * @returns {Promise<string|null>}
   */
  async getLatestMealOptionsWeek() {
    const result = await this.db.get(
      'SELECT DISTINCT week_start_date FROM meal_options ORDER BY week_start_date DESC LIMIT 1'
    );
    return result ? result.week_start_date : null;
  }

  /**
   * Get employee names from current menu
   * @param {string} weekStartDate - Week start date (optional)
   * @returns {Promise<Array>}
   */
  async getEmployeeNames(weekStartDate = null) {
    let week = weekStartDate || await this.getLatestWeek();
    if (!week) return [];

    const rows = await this.db.all(
      'SELECT DISTINCT employee_name FROM meals WHERE week_start_date = ? ORDER BY employee_name',
      [week]
    );

    return rows.map(row => row.employee_name);
  }

  /**
   * Find matching employee in current menu
   * @param {string} email - User email
   * @returns {Promise<string|null>}
   */
  async findMatchingEmployee(email) {
    try {
      const extractedName = extractNameFromEmail(email);
      if (!extractedName) return null;

      const employees = await this.getEmployeeNames();

      // Try exact match
      let match = employees.find(emp => emp.toLowerCase() === extractedName.toLowerCase());
      if (match) return match;

      // Try reversed name
      const reversedName = reverseNameOrder(extractedName);
      match = employees.find(emp => emp.toLowerCase() === reversedName.toLowerCase());
      if (match) return match;

      // Try partial match
      match = employees.find(emp => emp.toLowerCase().includes(extractedName.toLowerCase()));
      if (match) return match;

      return null;
    } catch (error) {
      console.error('Error finding matching employee:', error);
      return null;
    }
  }

  // ===== MEAL SELECTIONS OPERATIONS =====

  /**
   * Save meal selection for a user
   * @param {number} userId - User ID
   * @param {string} weekStartDate - Week start date
   * @param {Object} selections - Meal selections by day
   */
  async saveMealSelection(userId, weekStartDate, selections) {
    await this.db.run(
      `INSERT INTO meal_selections (user_id, week_start_date, monday, tuesday, wednesday, thursday, friday, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, week_start_date)
       DO UPDATE SET
         monday = ?,
         tuesday = ?,
         wednesday = ?,
         thursday = ?,
         friday = ?,
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        weekStartDate,
        selections.monday || '',
        selections.tuesday || '',
        selections.wednesday || '',
        selections.thursday || '',
        selections.friday || '',
        selections.monday || '',
        selections.tuesday || '',
        selections.wednesday || '',
        selections.thursday || '',
        selections.friday || ''
      ]
    );
  }

  /**
   * Get meal selection for a user
   * @param {number} userId - User ID
   * @param {string} weekStartDate - Week start date
   * @returns {Promise<Object|null>}
   */
  async getMealSelection(userId, weekStartDate) {
    return await this.db.get(
      'SELECT * FROM meal_selections WHERE user_id = ? AND week_start_date = ?',
      [userId, weekStartDate]
    );
  }

  /**
   * Get all meal selections for a week
   * @param {string} weekStartDate - Week start date
   * @returns {Promise<Array>}
   */
  async getAllMealSelections(weekStartDate) {
    return await this.db.all(
      `SELECT ms.*, u.email, u.employee_name
       FROM meal_selections ms
       JOIN users u ON ms.user_id = u.id
       WHERE ms.week_start_date = ?
       ORDER BY u.employee_name`,
      [weekStartDate]
    );
  }

  /**
   * Get user meal history
   * @param {number} userId - User ID
   * @returns {Promise<Array>}
   */
  async getUserMealHistory(userId) {
    const user = await this.getUserById(userId);
    if (!user) return [];

    const userSelections = await this.db.all(
      `SELECT ms.*, mo.period
       FROM meal_selections ms
       LEFT JOIN meal_options mo ON ms.week_start_date = mo.week_start_date
       WHERE ms.user_id = ?
       ORDER BY ms.week_start_date DESC`,
      [userId]
    );

    let mealRecords = [];
    if (user.employee_name) {
      mealRecords = await this.db.all(
        'SELECT * FROM meals WHERE employee_name = ? ORDER BY week_start_date DESC',
        [user.employee_name]
      );
    }

    const combined = [];
    const seenWeeks = new Set();

    userSelections.forEach(sel => {
      if (!seenWeeks.has(sel.week_start_date)) {
        combined.push({
          week_start_date: sel.week_start_date,
          period: sel.period,
          monday: sel.monday,
          tuesday: sel.tuesday,
          wednesday: sel.wednesday,
          thursday: sel.thursday,
          friday: sel.friday,
          source: 'selection'
        });
        seenWeeks.add(sel.week_start_date);
      }
    });

    mealRecords.forEach(meal => {
      if (!seenWeeks.has(meal.week_start_date)) {
        combined.push({
          week_start_date: meal.week_start_date,
          period: meal.period,
          monday: meal.monday,
          tuesday: meal.tuesday,
          wednesday: meal.wednesday,
          thursday: meal.thursday,
          friday: meal.friday,
          source: 'imported'
        });
        seenWeeks.add(meal.week_start_date);
      }
    });

    return combined;
  }

  // ===== MEALS OPERATIONS =====

  /**
   * Save meals (imported data)
   * @param {Array} mealsData - Array of meal objects
   * @param {boolean} clearExisting - Clear existing meals for the week
   * @param {string} period - Week period
   * @param {string} sourceFile - Source filename
   */
  async saveMeals(mealsData, clearExisting = false, period = null, sourceFile = null) {
    if (clearExisting && mealsData.length > 0) {
      const weekStartDate = mealsData[0].week_start_date;
      await this.db.run('DELETE FROM meals WHERE week_start_date = ?', [weekStartDate]);
    }

    for (const meal of mealsData) {
      await this.db.run(
        `INSERT INTO meals (employee_name, division, week_start_date, period, source_file, monday, tuesday, wednesday, thursday, friday)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (employee_name, week_start_date)
         DO UPDATE SET
           division = ?,
           period = ?,
           source_file = ?,
           monday = ?,
           tuesday = ?,
           wednesday = ?,
           thursday = ?,
           friday = ?`,
        [
          meal.employee_name,
          meal.division || '',
          meal.week_start_date,
          period || meal.period || '',
          sourceFile || meal.source_file || '',
          meal.monday || '',
          meal.tuesday || '',
          meal.wednesday || '',
          meal.thursday || '',
          meal.friday || '',
          meal.division || '',
          period || meal.period || '',
          sourceFile || meal.source_file || '',
          meal.monday || '',
          meal.tuesday || '',
          meal.wednesday || '',
          meal.thursday || '',
          meal.friday || ''
        ]
      );
    }
  }

  /**
   * Get all meals for a week
   * @param {string} weekStartDate - Week start date
   * @returns {Promise<Array>}
   */
  async getAllMeals(weekStartDate) {
    return await this.db.all('SELECT * FROM meals WHERE week_start_date = ?', [weekStartDate]);
  }

  /**
   * Get latest week with meal data
   * @returns {Promise<string|null>}
   */
  async getLatestWeek() {
    const result = await this.db.get(
      'SELECT DISTINCT week_start_date FROM meals ORDER BY week_start_date DESC LIMIT 1'
    );
    return result ? result.week_start_date : null;
  }

  /**
   * Get all available weeks
   * @returns {Promise<Array>}
   */
  async getAllWeeks() {
    const mealWeeks = await this.db.all(
      'SELECT DISTINCT week_start_date FROM meals ORDER BY week_start_date DESC'
    );
    const optionWeeks = await this.db.all(
      'SELECT DISTINCT week_start_date FROM meal_options ORDER BY week_start_date DESC'
    );
    const selectionWeeks = await this.db.all(
      'SELECT DISTINCT week_start_date FROM meal_selections ORDER BY week_start_date DESC'
    );

    const allWeeks = new Set();
    mealWeeks.forEach(w => allWeeks.add(w.week_start_date));
    optionWeeks.forEach(w => allWeeks.add(w.week_start_date));
    selectionWeeks.forEach(w => allWeeks.add(w.week_start_date));

    return Array.from(allWeeks).sort().reverse();
  }

  /**
   * Delete all data for a specific week
   * @param {string} weekStartDate - Week start date
   */
  async deleteWeekData(weekStartDate) {
    await this.db.run('DELETE FROM meal_reviews WHERE week_start_date = ?', [weekStartDate]);
    await this.db.run('DELETE FROM meal_selections WHERE week_start_date = ?', [weekStartDate]);
    await this.db.run('DELETE FROM meals WHERE week_start_date = ?', [weekStartDate]);
    await this.db.run('DELETE FROM meal_options WHERE week_start_date = ?', [weekStartDate]);
    await this.db.run('DELETE FROM upload_history WHERE week_start_date = ?', [weekStartDate]);
  }

  // ===== UPLOAD HISTORY OPERATIONS =====

  /**
   * Check if upload exists
   * @param {string} fileHash - File hash
   * @returns {Promise<Object|null>}
   */
  async checkUploadExists(fileHash) {
    return await this.db.get('SELECT * FROM upload_history WHERE file_hash = ?', [fileHash]);
  }

  /**
   * Check if period exists
   * @param {string} period - Week period
   * @param {string} uploadType - Upload type
   * @returns {Promise<Object|null>}
   */
  async checkPeriodExists(period, uploadType) {
    if (!period) return null;

    return await this.db.get(
      `SELECT * FROM upload_history
       WHERE period = ? AND upload_type = ?
       ORDER BY upload_date DESC
       LIMIT 1`,
      [period, uploadType]
    );
  }

  /**
   * Save upload history
   * @param {string} filename - Filename
   * @param {string} fileHash - File hash
   * @param {string} uploadType - Upload type
   * @param {string} period - Week period
   * @param {string} weekStartDate - Week start date
   * @param {number} rowCount - Number of rows processed
   */
  async saveUploadHistory(filename, fileHash, uploadType, period, weekStartDate, rowCount) {
    try {
      await this.db.run(
        'INSERT INTO upload_history (filename, file_hash, upload_type, period, week_start_date, row_count) VALUES (?, ?, ?, ?, ?, ?)',
        [filename, fileHash, uploadType, period, weekStartDate, rowCount]
      );
    } catch (error) {
      if (!error.message || !error.message.includes('UNIQUE constraint')) {
        throw error;
      }
    }
  }

  // ===== MEAL REVIEWS OPERATIONS =====

  /**
   * Save meal review
   * @param {number} userId - User ID
   * @param {string} mealName - Meal name
   * @param {string} reviewText - Review text
   * @param {number} rating - Rating (1-5)
   * @param {string} weekStartDate - Week start date
   * @param {string} dayOfWeek - Day of week
   */
  async saveMealReview(userId, mealName, reviewText, rating, weekStartDate, dayOfWeek) {
    const wordCount = reviewText.trim().split(/\s+/).length;
    if (wordCount > 500) {
      throw new Error('Review-ul poate conține maxim 500 de cuvinte');
    }

    await this.db.run(
      `INSERT INTO meal_reviews (user_id, meal_name, review_text, rating, week_start_date, day_of_week, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, meal_name, week_start_date, day_of_week)
       DO UPDATE SET
         review_text = ?,
         rating = ?,
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId, mealName, reviewText, rating, weekStartDate, dayOfWeek,
        reviewText, rating
      ]
    );
  }

  /**
   * Get meal review by user
   * @param {number} userId - User ID
   * @param {string} mealName - Meal name
   * @param {string} weekStartDate - Week start date
   * @param {string} dayOfWeek - Day of week
   * @returns {Promise<Object|null>}
   */
  async getMealReview(userId, mealName, weekStartDate, dayOfWeek) {
    return await this.db.get(
      'SELECT * FROM meal_reviews WHERE user_id = ? AND meal_name = ? AND week_start_date = ? AND day_of_week = ?',
      [userId, mealName, weekStartDate, dayOfWeek]
    );
  }

  /**
   * Get all reviews for a meal
   * @param {string} mealName - Meal name
   * @param {string} weekStartDate - Week start date
   * @param {string} dayOfWeek - Day of week
   * @returns {Promise<Array>}
   */
  async getMealReviews(mealName, weekStartDate, dayOfWeek) {
    return await this.db.all(
      `SELECT mr.*, u.email, u.employee_name
       FROM meal_reviews mr
       JOIN users u ON mr.user_id = u.id
       WHERE mr.meal_name = ? AND mr.week_start_date = ? AND mr.day_of_week = ?
       ORDER BY mr.created_at DESC`,
      [mealName, weekStartDate, dayOfWeek]
    );
  }

  /**
   * Get all reviews by user
   * @param {number} userId - User ID
   * @returns {Promise<Array>}
   */
  async getUserReviews(userId) {
    return await this.db.all(
      'SELECT * FROM meal_reviews WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  }

  /**
   * Get recent reviews for a meal
   * @param {string} mealName - Meal name
   * @returns {Promise<Array>}
   */
  async getRecentMealReviews(mealName) {
    const recentReviewers = await this.db.all(
      `SELECT DISTINCT user_id
       FROM meal_reviews
       WHERE meal_name = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [mealName]
    );

    if (recentReviewers.length === 0) return [];

    const userIds = recentReviewers.map(r => r.user_id);
    const placeholders = userIds.map(() => '?').join(',');

    return await this.db.all(
      `SELECT mr.*, u.email, u.employee_name
       FROM meal_reviews mr
       JOIN users u ON mr.user_id = u.id
       WHERE mr.meal_name = ? AND mr.user_id IN (${placeholders})
       ORDER BY mr.created_at DESC
       LIMIT 3`,
      [mealName, ...userIds]
    );
  }

  /**
   * Get recent reviews for a meal with user prioritization
   * Returns up to 5 reviews: user's reviews first, then others
   * @param {string} mealName - Meal name
   * @param {number} userId - Current user ID
   * @returns {Promise<Array>}
   */
  async getPrioritizedMealReviews(mealName, userId) {
    // Get user's reviews first
    const userReviews = await this.db.all(
      `SELECT mr.*, u.email, u.employee_name
       FROM meal_reviews mr
       JOIN users u ON mr.user_id = u.id
       WHERE mr.meal_name = ? AND mr.user_id = ?
       ORDER BY mr.created_at DESC`,
      [mealName, userId]
    );

    // Calculate how many more reviews we need
    const remainingSlots = 5 - userReviews.length;

    if (remainingSlots <= 0) {
      // User has 5 or more reviews, return only user's reviews (limited to 5)
      return userReviews.slice(0, 5);
    }

    // Get reviews from other users
    const otherReviews = await this.db.all(
      `SELECT mr.*, u.email, u.employee_name
       FROM meal_reviews mr
       JOIN users u ON mr.user_id = u.id
       WHERE mr.meal_name = ? AND mr.user_id != ?
       ORDER BY mr.created_at DESC
       LIMIT ?`,
      [mealName, userId, remainingSlots]
    );

    // Combine: user's reviews first, then others
    return [...userReviews, ...otherReviews];
  }

  // ===== WEEK LOCK OPERATIONS =====

  /**
   * Get week settings
   * @param {string} weekStartDate - Week start date
   * @returns {Promise<Object|null>}
   */
  async getWeekSettings(weekStartDate) {
    return await this.db.get(
      'SELECT * FROM week_settings WHERE week_start_date = ?',
      [weekStartDate]
    );
  }

  /**
   * Lock a week
   * @param {string} weekStartDate - Week start date
   */
  async lockWeek(weekStartDate) {
    await this.db.run(
      `INSERT INTO week_settings (week_start_date, is_locked, locked_at, unlocked_users)
       VALUES (?, 1, CURRENT_TIMESTAMP, '[]')
       ON CONFLICT (week_start_date)
       DO UPDATE SET
         is_locked = 1,
         locked_at = CURRENT_TIMESTAMP,
         unlocked_users = '[]'`,
      [weekStartDate]
    );
  }

  /**
   * Unlock a week
   * @param {string} weekStartDate - Week start date
   */
  async unlockWeek(weekStartDate) {
    await this.db.run(
      `INSERT INTO week_settings (week_start_date, is_locked, locked_at, unlocked_users)
       VALUES (?, 0, NULL, '[]')
       ON CONFLICT (week_start_date)
       DO UPDATE SET
         is_locked = 0,
         locked_at = NULL,
         unlocked_users = '[]'`,
      [weekStartDate]
    );
  }

  /**
   * Grant unlock permission to a specific user for a week
   * @param {string} weekStartDate - Week start date
   * @param {number} userId - User ID to grant unlock permission
   */
  async grantUserUnlock(weekStartDate, userId) {
    const settings = await this.getWeekSettings(weekStartDate);

    if (!settings) {
      // Create settings if they don't exist
      await this.db.run(
        'INSERT INTO week_settings (week_start_date, is_locked, unlocked_users) VALUES (?, 0, ?)',
        [weekStartDate, JSON.stringify([userId])]
      );
    } else {
      const unlockedUsers = JSON.parse(settings.unlocked_users || '[]');
      if (!unlockedUsers.includes(userId)) {
        unlockedUsers.push(userId);
        await this.db.run(
          'UPDATE week_settings SET unlocked_users = ? WHERE week_start_date = ?',
          [JSON.stringify(unlockedUsers), weekStartDate]
        );
      }
    }
  }

  /**
   * Revoke unlock permission from a specific user for a week
   * @param {string} weekStartDate - Week start date
   * @param {number} userId - User ID to revoke unlock permission
   */
  async revokeUserUnlock(weekStartDate, userId) {
    const settings = await this.getWeekSettings(weekStartDate);

    if (settings) {
      const unlockedUsers = JSON.parse(settings.unlocked_users || '[]');
      const filteredUsers = unlockedUsers.filter(id => id !== userId);
      await this.db.run(
        'UPDATE week_settings SET unlocked_users = ? WHERE week_start_date = ?',
        [JSON.stringify(filteredUsers), weekStartDate]
      );
    }
  }

  /**
   * Check if a week is locked for a specific user
   * @param {string} weekStartDate - Week start date
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if locked for this user
   */
  async isWeekLockedForUser(weekStartDate, userId) {
    // Check if current date is before week start date
    // If yes, week should be unlocked (people can make selections for future weeks)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for comparison

    const weekStart = new Date(weekStartDate);
    weekStart.setHours(0, 0, 0, 0);

    // If we're before the week starts, it's always unlocked
    if (today < weekStart) {
      return false;
    }

    const settings = await this.getWeekSettings(weekStartDate);

    if (!settings || !settings.is_locked) {
      return false;
    }

    // Check if user has unlock permission
    const unlockedUsers = JSON.parse(settings.unlocked_users || '[]');
    return !unlockedUsers.includes(userId);
  }

  /**
   * Unlock Request Methods
   */

  /**
   * Create an unlock request
   * @param {number} userId - User ID
   * @param {string} weekStartDate - Week start date
   * @returns {Promise<object>} Created request
   */
  async createUnlockRequest(userId, weekStartDate) {
    // First, check if there's already a pending request
    const existingRequest = await this.db.get(
      'SELECT * FROM unlock_requests WHERE user_id = ? AND week_start_date = ? AND status = ?',
      [userId, weekStartDate, 'pending']
    );

    if (existingRequest) {
      return existingRequest;
    }

    // Create new request
    const result = await this.db.run(
      'INSERT INTO unlock_requests (user_id, week_start_date, status) VALUES (?, ?, ?)',
      [userId, weekStartDate, 'pending']
    );

    return {
      id: result.lastID,
      user_id: userId,
      week_start_date: weekStartDate,
      status: 'pending'
    };
  }

  /**
   * Get all pending unlock requests
   * @returns {Promise<Array>} List of pending requests with user info
   */
  async getPendingUnlockRequests() {
    return await this.db.all(`
      SELECT ur.*, u.email, u.employee_name
      FROM unlock_requests ur
      JOIN users u ON ur.user_id = u.id
      WHERE ur.status = 'pending'
      ORDER BY ur.requested_at DESC
    `);
  }

  /**
   * Check if user has a pending unlock request
   * @param {number} userId - User ID
   * @param {string} weekStartDate - Week start date
   * @returns {Promise<boolean>} True if user has a pending request
   */
  async hasPendingUnlockRequest(userId, weekStartDate) {
    const request = await this.db.get(
      'SELECT id FROM unlock_requests WHERE user_id = ? AND week_start_date = ? AND status = ?',
      [userId, weekStartDate, 'pending']
    );
    return !!request;
  }

  /**
   * Approve unlock request
   * @param {number} requestId - Request ID
   * @param {number} adminId - Admin user ID who approved
   * @returns {Promise<void>}
   */
  async approveUnlockRequest(requestId, adminId) {
    // Get the request details
    const request = await this.db.get(
      'SELECT * FROM unlock_requests WHERE id = ?',
      [requestId]
    );

    if (!request) {
      throw new Error('Request not found');
    }

    // Unlock the user's selection
    await this.db.run(
      'UPDATE meal_selections SET is_locked = 0 WHERE user_id = ? AND week_start_date = ?',
      [request.user_id, request.week_start_date]
    );

    // If the week is admin-locked, also grant the user unlock permission for the week
    const weekSettings = await this.getWeekSettings(request.week_start_date);
    if (weekSettings && weekSettings.is_locked) {
      await this.grantUserUnlock(request.week_start_date, request.user_id);
    }

    // Update the request status
    await this.db.run(
      'UPDATE unlock_requests SET status = ?, processed_at = CURRENT_TIMESTAMP, processed_by = ? WHERE id = ?',
      ['approved', adminId, requestId]
    );
  }

  /**
   * Reject unlock request
   * @param {number} requestId - Request ID
   * @param {number} adminId - Admin user ID who rejected
   * @returns {Promise<void>}
   */
  async rejectUnlockRequest(requestId, adminId) {
    await this.db.run(
      'UPDATE unlock_requests SET status = ?, processed_at = CURRENT_TIMESTAMP, processed_by = ? WHERE id = ?',
      ['rejected', adminId, requestId]
    );
  }

  /**
   * User Self-Lock Methods
   */

  /**
   * Lock user's own meal selection
   * @param {number} userId - User ID
   * @param {string} weekStartDate - Week start date
   * @returns {Promise<void>}
   */
  async lockUserSelection(userId, weekStartDate) {
    await this.db.run(
      'UPDATE meal_selections SET is_locked = 1 WHERE user_id = ? AND week_start_date = ?',
      [userId, weekStartDate]
    );
  }

  /**
   * Unlock user's own meal selection
   * @param {number} userId - User ID
   * @param {string} weekStartDate - Week start date
   * @returns {Promise<void>}
   */
  async unlockUserSelection(userId, weekStartDate) {
    await this.db.run(
      'UPDATE meal_selections SET is_locked = 0 WHERE user_id = ? AND week_start_date = ?',
      [userId, weekStartDate]
    );
  }

  /**
   * Check if user's selection is self-locked
   * @param {number} userId - User ID
   * @param {string} weekStartDate - Week start date
   * @returns {Promise<boolean>} True if user's selection is locked
   */
  async isUserSelectionLocked(userId, weekStartDate) {
    const result = await this.db.get(
      'SELECT is_locked FROM meal_selections WHERE user_id = ? AND week_start_date = ?',
      [userId, weekStartDate]
    );
    return result ? result.is_locked === 1 : false;
  }

  // ===== USER INVITATION OPERATIONS =====

  /**
   * Create user invitation
   * @param {string} email - User email to invite
   * @param {boolean} isAdmin - Whether user should be admin
   * @param {number} invitedBy - ID of user creating the invitation
   * @param {string} token - Invitation token
   * @param {number} expiresInHours - Token expiration in hours (default: 48)
   * @returns {Promise<object>} Created invitation
   */
  async createInvitation(email, isAdmin, invitedBy, token, expiresInHours = 48) {
    const emailLower = email.toLowerCase().trim();
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

    const result = await this.db.run(
      `INSERT INTO user_invitations (email, invitation_token, is_admin, invited_by, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [emailLower, token, isAdmin ? 1 : 0, invitedBy, expiresAt]
    );

    return {
      id: result.lastID,
      email: emailLower,
      invitation_token: token,
      is_admin: isAdmin ? 1 : 0,
      invited_by: invitedBy,
      expires_at: expiresAt
    };
  }

  /**
   * Get invitation by token
   * @param {string} token - Invitation token
   * @returns {Promise<object|null>} Invitation details
   */
  async getInvitationByToken(token) {
    return await this.db.get(
      'SELECT * FROM user_invitations WHERE invitation_token = ?',
      [token]
    );
  }

  /**
   * Validate invitation token
   * @param {string} token - Invitation token
   * @returns {Promise<object>} Validation result with invitation details
   */
  async validateInvitation(token) {
    const invitation = await this.getInvitationByToken(token);

    if (!invitation) {
      return { valid: false, error: 'Invalid invitation token' };
    }

    if (invitation.status !== 'pending') {
      return { valid: false, error: 'Invitation has already been used' };
    }

    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (now > expiresAt) {
      return { valid: false, error: 'Invitation has expired' };
    }

    // Check if user already exists
    const existingUser = await this.getUserByEmail(invitation.email);
    if (existingUser && existingUser.is_active === 1) {
      return { valid: false, error: 'User account already exists' };
    }

    return { valid: true, invitation };
  }

  /**
   * Mark invitation as used
   * @param {string} token - Invitation token
   * @returns {Promise<void>}
   */
  async markInvitationAsUsed(token) {
    await this.db.run(
      `UPDATE user_invitations
       SET status = 'used', used_at = CURRENT_TIMESTAMP
       WHERE invitation_token = ?`,
      [token]
    );
  }

  /**
   * Get pending invitations
   * @returns {Promise<Array>} List of pending invitations
   */
  async getPendingInvitations() {
    return await this.db.all(`
      SELECT i.*, u.email as invited_by_email
      FROM user_invitations i
      LEFT JOIN users u ON i.invited_by = u.id
      WHERE i.status = 'pending' AND datetime(i.expires_at) > datetime('now')
      ORDER BY i.created_at DESC
    `);
  }

  /**
   * Cancel invitation
   * @param {number} invitationId - Invitation ID
   * @returns {Promise<void>}
   */
  async cancelInvitation(invitationId) {
    await this.db.run(
      `UPDATE user_invitations
       SET status = 'cancelled'
       WHERE id = ?`,
      [invitationId]
    );
  }

  // ===== MEAL TRANSFER METHODS =====

  /**
   * Create a meal transfer (user passes meal to colleagues)
   */
  async createMealTransfer(fromUserId, weekStartDate, dayOfWeek, mealDetails) {
    console.log('📝 DB: Inserting meal transfer:', { fromUserId, weekStartDate, dayOfWeek, mealDetails });
    try {
      const result = await this.db.run(
        `INSERT INTO meal_transfers (from_user_id, week_start_date, day_of_week, meal_details, status)
         VALUES (?, ?, ?, ?, 'available')
         ON CONFLICT (from_user_id, week_start_date, day_of_week)
         DO UPDATE SET
           meal_details = excluded.meal_details,
           status = 'available',
           created_at = CURRENT_TIMESTAMP,
           claimed_by_user_id = NULL,
           claimed_at = NULL`,
        [fromUserId, weekStartDate, dayOfWeek, mealDetails]
      );
      console.log('✅ DB: Meal transfer inserted/updated, changes:', result.changes);
      return result;
    } catch (error) {
      console.error('❌ DB: Error inserting meal transfer:', error);
      throw error;
    }
  }

  /**
   * Get available meal transfers for a week
   */
  async getAvailableMealTransfers(weekStartDate) {
    return await this.db.all(
      `SELECT mt.*, u.email, u.employee_name
       FROM meal_transfers mt
       JOIN users u ON mt.from_user_id = u.id
       WHERE mt.week_start_date = ?
         AND mt.status = 'available'
       ORDER BY mt.created_at DESC`,
      [weekStartDate]
    );
  }

  /**
   * Claim a meal transfer
   */
  async claimMealTransfer(transferId, claimedByUserId) {
    await this.db.run(
      `UPDATE meal_transfers
       SET claimed_by_user_id = ?,
           claimed_at = CURRENT_TIMESTAMP,
           status = 'claimed'
       WHERE id = ? AND status = 'available'`,
      [claimedByUserId, transferId]
    );
  }

  /**
   * Cancel a meal transfer
   */
  async cancelMealTransfer(transferId, userId) {
    await this.db.run(
      `DELETE FROM meal_transfers
       WHERE id = ? AND from_user_id = ?`,
      [transferId, userId]
    );
  }

  /**
   * Get user's meal transfer for a specific day
   */
  async getUserMealTransfer(userId, weekStartDate, dayOfWeek) {
    return await this.db.get(
      `SELECT * FROM meal_transfers
       WHERE from_user_id = ?
         AND week_start_date = ?
         AND day_of_week = ?`,
      [userId, weekStartDate, dayOfWeek]
    );
  }

  /**
   * Get all passed meals for a user in a specific week
   */
  async getUserPassedMeals(userId, weekStartDate) {
    const transfers = await this.db.all(
      `SELECT day_of_week, status FROM meal_transfers
       WHERE from_user_id = ?
         AND week_start_date = ?`,
      [userId, weekStartDate]
    );

    // Convert to object format { monday: true, tuesday: false, etc. }
    const passedMeals = {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false
    };

    transfers.forEach(transfer => {
      passedMeals[transfer.day_of_week.toLowerCase()] = true;
    });

    return passedMeals;
  }

  // ===== MENU COPY METHODS =====

  /**
   * Get all user menus for a specific week
   */
  async getAllUserMenusForWeek(weekStartDate) {
    return await this.db.all(
      `SELECT ms.*, u.id as user_id, u.email, u.employee_name
       FROM meal_selections ms
       JOIN users u ON ms.user_id = u.id
       WHERE ms.week_start_date = ?
         AND u.is_active = 1
       ORDER BY u.employee_name`,
      [weekStartDate]
    );
  }

  /**
   * Copy a user's menu for a specific day
   */
  async copyUserMenu(userId, copiedFromUserId, weekStartDate, dayOfWeek, menuDetails) {
    // First, insert or update the menu copy record
    await this.db.run(
      `INSERT INTO menu_copies (user_id, copied_from_user_id, week_start_date, day_of_week, menu_details)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (user_id, week_start_date, day_of_week)
       DO UPDATE SET
         copied_from_user_id = excluded.copied_from_user_id,
         menu_details = excluded.menu_details,
         created_at = CURRENT_TIMESTAMP`,
      [userId, copiedFromUserId, weekStartDate, dayOfWeek, menuDetails]
    );

    // Then, update the user's meal selection for that day
    const dayCol = dayOfWeek.toLowerCase();
    const updateColumn = `${dayCol} = ?`;

    await this.db.run(
      `INSERT INTO meal_selections (user_id, week_start_date, ${dayCol}, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, week_start_date)
       DO UPDATE SET ${updateColumn}, updated_at = CURRENT_TIMESTAMP`,
      [userId, weekStartDate, menuDetails, menuDetails]
    );
  }

  /**
   * Get all menu copies for a specific day
   */
  async getMenuCopies(weekStartDate, dayOfWeek) {
    return await this.db.all(
      `SELECT mc.*,
              u.email, u.employee_name,
              uf.email as copied_from_email, uf.employee_name as copied_from_name
       FROM menu_copies mc
       JOIN users u ON mc.user_id = u.id
       JOIN users uf ON mc.copied_from_user_id = uf.id
       WHERE mc.week_start_date = ?
         AND mc.day_of_week = ?
       ORDER BY mc.created_at DESC`,
      [weekStartDate, dayOfWeek]
    );
  }

  /**
   * Get users who copied from a specific user
   */
  async getMenuCopiesForUser(copiedFromUserId, weekStartDate, dayOfWeek) {
    return await this.db.all(
      `SELECT mc.*, u.email, u.employee_name
       FROM menu_copies mc
       JOIN users u ON mc.user_id = u.id
       WHERE mc.copied_from_user_id = ?
         AND mc.week_start_date = ?
         AND mc.day_of_week = ?
       ORDER BY mc.created_at DESC`,
      [copiedFromUserId, weekStartDate, dayOfWeek]
    );
  }
}

// Export singleton instance
const databaseService = new DatabaseService();
module.exports = databaseService;
