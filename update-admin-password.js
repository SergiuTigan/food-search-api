const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'food-search.db');

// Admin credentials
const adminEmail = 'sergiu.tigan@devhub.tech';
const newPassword = 'asd123ASD';

// Hash the new password
const hashedPassword = bcrypt.hashSync(newPassword, 10);

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('✓ Connected to database');
});

// Update admin password
db.run(
  'UPDATE users SET password = ? WHERE email = ?',
  [hashedPassword, adminEmail],
  function(err) {
    if (err) {
      console.error('Error updating password:', err);
      process.exit(1);
    }

    if (this.changes === 0) {
      console.log('⚠ Warning: No user found with email:', adminEmail);
    } else {
      console.log('✓ Admin password updated successfully');
      console.log(`  Email: ${adminEmail}`);
      console.log(`  New password: ${newPassword}`);
    }

    // Close database
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
      process.exit(0);
    });
  }
);
