/**
 * Database Initialization Script
 * Reads schema.sql and applies tables, indexes, and constraints.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
  timezone: '+00:00'
};

const DB_NAME = process.env.DB_NAME || 'todo_application';

async function initializeDatabase() {
  console.log(`[db-init] Connecting to MySQL at ${config.host}:${config.port} as ${config.user}...`);

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('[db-init] Connected successfully.');

    console.log(`[db-init] Ensuring database "${DB_NAME}" exists...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.changeUser({ database: DB_NAME });

    const schemaPath = path.resolve(__dirname, 'schema.sql');
    console.log(`[db-init] Reading schema from ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('[db-init] Executing schema SQL statements...');
    await connection.query(schemaSql);

    console.log('[db-init] Database initialized successfully!');
  } catch (error) {
    console.error('[db-init] Error initializing database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
