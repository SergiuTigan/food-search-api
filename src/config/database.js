const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Database Configuration and Connection Manager
 */
class Database {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../food-search.db');
  }

  /**
   * Initialize database connection
   */
  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database:', this.dbPath);
          this.db.run('PRAGMA foreign_keys = ON');
          resolve(this.db);
        }
      });
    });
  }

  /**
   * Run a query that doesn't return data (INSERT, UPDATE, DELETE)
   */
  run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  /**
   * Get a single row
   */
  get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Get all rows
   */
  all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * SQL template function for compatibility
   */
  async sql(strings, ...values) {
    let query = '';
    let params = [];

    for (let i = 0; i < strings.length; i++) {
      query += strings[i];
      if (i < values.length) {
        params.push(values[i]);
        query += '?';
      }
    }

    const trimmedQuery = query.trim().toUpperCase();

    if (trimmedQuery.startsWith('SELECT')) {
      const rows = await this.all(query, params);
      return { rows: rows || [] };
    } else if (trimmedQuery.startsWith('INSERT') ||
               trimmedQuery.startsWith('UPDATE') ||
               trimmedQuery.startsWith('DELETE')) {
      await this.run(query, params);
      return { rows: [] };
    } else {
      await this.run(query, params);
      return { rows: [] };
    }
  }

  /**
   * Close database connection
   */
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Export singleton instance
const database = new Database();
module.exports = database;
