const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables if not already loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'todo_user',
  password: process.env.DB_PASSWORD || 'todo_password',
  database: process.env.DB_NAME || 'todo_application',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  timezone: '+00:00', // Ensure UTC timezone for stored and retrieved timestamps
  dateStrings: true   // Returns date/timestamps as ISO strings instead of local Date objects
};

const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('[Database] Connection failed:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection
};
