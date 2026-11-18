const { pool } = require('../config/db');

class UserModel {
  /**
   * Find a user by username
   */
  static async findByUsername(username) {
    const query = `
      SELECT id, username, password_hash, created_at, updated_at
      FROM users
      WHERE username = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [username]);
    return rows[0] || null;
  }

  /**
   * Find a user by ID
   */
  static async findById(id) {
    const query = `
      SELECT id, username, created_at, updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  /**
   * Create a new user
   */
  static async create({ username, passwordHash }) {
    const query = `
      INSERT INTO users (username, password_hash)
      VALUES (?, ?)
    `;
    const [result] = await pool.execute(query, [username, passwordHash]);
    return {
      id: result.insertId,
      username
    };
  }
}

module.exports = UserModel;
