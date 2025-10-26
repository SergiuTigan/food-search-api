const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'food-search.db');

// Admin credentials
const adminEmail = 'sergiu.tigan@devhub.tech';
const expectedPassword = 'asd123ASD';

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('✓ Connected to database');
});

// Check admin user
db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, row) => {
  if (err) {
    console.error('Error querying user:', err);
    db.close();
    process.exit(1);
  }

  if (!row) {
    console.log('⚠ Admin user not found!');
    db.close();
    process.exit(1);
  }

  console.log('✓ Admin user found:');
  console.log('  Email:', row.email);
  console.log('  Is Admin:', row.is_admin);
  console.log('  Password Hash:', row.password);

  // Test the password
  const passwordMatch = bcrypt.compareSync(expectedPassword, row.password);
  console.log('\n✓ Password verification:');
  console.log('  Expected password:', expectedPassword);
  console.log('  Password matches:', passwordMatch ? 'YES ✓' : 'NO ✗');

  db.close();
  process.exit(0);
});
