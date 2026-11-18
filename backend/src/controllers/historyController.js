const TaskModel = require('../models/taskModel');

/**
 * Historical Tasks Controller
 * All historical data is queried directly from MySQL with proper user scoping and indexes.
 */

/**
 * Daily Historical Tasks
 * GET /api/tasks/history/daily?date=YYYY-MM-DD
 */
async function getDailyHistory(req, res, next) {
  try {
    const { date } = req.query;
    const userId = req.user.id;

    const tasks = await TaskModel.getDailyHistory(userId, date);

    const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
    const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;

    return res.status(200).json({
      success: true,
      data: {
        filter: 'daily',
        date,
        total: tasks.length,
        pending: pendingCount,
        completed: completedCount,
        tasks
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Monthly Historical Tasks
 * GET /api/tasks/history/monthly?month=MM&year=YYYY
 */
async function getMonthlyHistory(req, res, next) {
  try {
    const month = req.validatedMonth;
    const year = req.validatedYear;
    const userId = req.user.id;

    const tasks = await TaskModel.getMonthlyHistory(userId, year, month);

    // Group tasks by creation date (YYYY-MM-DD)
    const groupedByDate = {};
    for (const task of tasks) {
      const dateKey = task.created_at ? task.created_at.split('T')[0].split(' ')[0] : 'unknown';
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(task);
    }

    const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
    const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;

    return res.status(200).json({
      success: true,
      data: {
        filter: 'monthly',
        month,
        year,
        total: tasks.length,
        pending: pendingCount,
        completed: completedCount,
        groupedByDate,
        tasks
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Date Range Historical Tasks
 * GET /api/tasks/history/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
async function getRangeHistory(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    const tasks = await TaskModel.getRangeHistory(userId, startDate, endDate);

    // Group tasks by creation date
    const groupedByDate = {};
    for (const task of tasks) {
      const dateKey = task.created_at ? task.created_at.split('T')[0].split(' ')[0] : 'unknown';
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(task);
    }

    const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
    const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;

    return res.status(200).json({
      success: true,
      data: {
        filter: 'range',
        startDate,
        endDate,
        total: tasks.length,
        pending: pendingCount,
        completed: completedCount,
        groupedByDate,
        tasks
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDailyHistory,
  getMonthlyHistory,
  getRangeHistory
};
