const { pool } = require('../config/db');

class TaskModel {
  /**
   * Create a new task
   */
  static async create({ userId, title, description, dueDate }) {
    const query = `
      INSERT INTO tasks (user_id, title, description, due_date, status)
      VALUES (?, ?, ?, ?, 'PENDING')
    `;
    const [result] = await pool.execute(query, [
      userId,
      title,
      description || null,
      dueDate || null
    ]);

    return this.findByIdAndUser(result.insertId, userId);
  }

  /**
   * Find a single task by ID and verify user ownership
   */
  static async findByIdAndUser(id, userId) {
    const query = `
      SELECT id, user_id, title, description, status, due_date, created_at, updated_at, completed_at
      FROM tasks
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id, userId]);
    return rows[0] || null;
  }

  /**
   * Get all tasks for a user with optional filtering and search
   */
  static async getTasksByUser(userId, { status, search, sortBy = 'created_at', order = 'DESC' } = {}) {
    const validSortFields = ['created_at', 'due_date', 'title', 'status', 'updated_at'];
    const validOrders = ['ASC', 'DESC'];

    const sortColumn = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

    let query = `
      SELECT id, user_id, title, description, status, due_date, created_at, updated_at, completed_at
      FROM tasks
      WHERE user_id = ?
    `;
    const params = [userId];

    if (status && (status === 'PENDING' || status === 'COMPLETED')) {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (search && search.trim()) {
      query += ` AND (title LIKE ? OR description LIKE ?)`;
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ` ORDER BY ${sortColumn} ${sortDirection}`;

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  /**
   * Update task title, description, and due_date
   */
  static async update(id, userId, { title, description, dueDate }) {
    // Only update fields that are provided
    const fields = [];
    const params = [];

    if (title !== undefined) {
      fields.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      params.push(description);
    }
    if (dueDate !== undefined) {
      fields.push('due_date = ?');
      params.push(dueDate);
    }

    if (fields.length === 0) {
      return this.findByIdAndUser(id, userId);
    }

    params.push(id, userId);
    const query = `
      UPDATE tasks
      SET ${fields.join(', ')}
      WHERE id = ? AND user_id = ?
    `;

    const [result] = await pool.execute(query, params);
    if (result.affectedRows === 0) {
      return null;
    }

    return this.findByIdAndUser(id, userId);
  }

  /**
   * Delete task by ID and user ownership
   */
  static async delete(id, userId) {
    const query = `
      DELETE FROM tasks
      WHERE id = ? AND user_id = ?
    `;
    const [result] = await pool.execute(query, [id, userId]);
    return result.affectedRows > 0;
  }

  /**
   * Update task status: PENDING or COMPLETED
   * Automatically sets or clears completed_at timestamp
   */
  static async setStatus(id, userId, status) {
    let query;
    if (status === 'COMPLETED') {
      query = `
        UPDATE tasks
        SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `;
    } else {
      query = `
        UPDATE tasks
        SET status = 'PENDING', completed_at = NULL
        WHERE id = ? AND user_id = ?
      `;
    }

    const [result] = await pool.execute(query, [id, userId]);
    if (result.affectedRows === 0) {
      return null;
    }

    return this.findByIdAndUser(id, userId);
  }

  /**
   * Daily Historical Report: Tasks created on a specific date (YYYY-MM-DD)
   */
  static async getDailyHistory(userId, dateString) {
    const query = `
      SELECT id, user_id, title, description, status, due_date, created_at, updated_at, completed_at
      FROM tasks
      WHERE user_id = ?
        AND created_at >= CONCAT(?, ' 00:00:00')
        AND created_at <= CONCAT(?, ' 23:59:59')
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.execute(query, [userId, dateString, dateString]);
    return rows;
  }

  /**
   * Monthly Historical Report: Tasks created in a specific month and year
   */
  static async getMonthlyHistory(userId, year, month) {
    // Zero pad month for date calculation
    const paddedMonth = String(month).padStart(2, '0');
    // Calculate start and end date for that month
    const startDate = `${year}-${paddedMonth}-01 00:00:00`;
    // Last day of month
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const endDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')} 23:59:59`;

    const query = `
      SELECT id, user_id, title, description, status, due_date, created_at, updated_at, completed_at
      FROM tasks
      WHERE user_id = ?
        AND created_at >= ?
        AND created_at <= ?
      ORDER BY created_at ASC
    `;
    const [rows] = await pool.execute(query, [userId, startDate, endDate]);
    return rows;
  }

  /**
   * Range Historical Report: Tasks created within a date range
   */
  static async getRangeHistory(userId, startDate, endDate) {
    const query = `
      SELECT id, user_id, title, description, status, due_date, created_at, updated_at, completed_at
      FROM tasks
      WHERE user_id = ?
        AND created_at >= CONCAT(?, ' 00:00:00')
        AND created_at <= CONCAT(?, ' 23:59:59')
      ORDER BY created_at ASC
    `;
    const [rows] = await pool.execute(query, [userId, startDate, endDate]);
    return rows;
  }

  /**
   * Dashboard Summary for authenticated user
   */
  static async getDashboardSummary(userId) {
    // 1. Aggregates
    const statsQuery = `
      SELECT
        COUNT(*) AS total_tasks,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS pending_tasks,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_tasks,
        COUNT(CASE WHEN due_date = CURRENT_DATE() AND status = 'PENDING' THEN 1 END) AS due_today
      FROM tasks
      WHERE user_id = ?
    `;
    const [statsRows] = await pool.execute(statsQuery, [userId]);
    const stats = statsRows[0] || {
      total_tasks: 0,
      pending_tasks: 0,
      completed_tasks: 0,
      due_today: 0
    };

    const total = parseInt(stats.total_tasks, 10) || 0;
    const completed = parseInt(stats.completed_tasks, 10) || 0;
    const pending = parseInt(stats.pending_tasks, 10) || 0;
    const dueToday = parseInt(stats.due_today, 10) || 0;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 2. Recent Tasks (up to 5 most recently created)
    const recentQuery = `
      SELECT id, user_id, title, description, status, due_date, created_at, updated_at, completed_at
      FROM tasks
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const [recentTasks] = await pool.execute(recentQuery, [userId]);

    return {
      totalTasks: total,
      pendingTasks: pending,
      completedTasks: completed,
      dueToday: dueToday,
      completionPercentage,
      recentTasks
    };
  }
}

module.exports = TaskModel;
