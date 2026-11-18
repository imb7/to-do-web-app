const TaskModel = require('../models/taskModel');

/**
 * Dashboard Summary Controller
 * GET /api/dashboard/summary
 */
async function getSummary(req, res, next) {
  try {
    const userId = req.user.id;
    const summary = await TaskModel.getDashboardSummary(userId);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          username: req.user.username
        },
        summary
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSummary
};
