const TaskModel = require('../models/taskModel');

/**
 * Create a new task
 * POST /api/tasks
 */
async function createTask(req, res, next) {
  try {
    const { title, description, due_date } = req.body;
    const userId = req.user.id;

    const task = await TaskModel.create({
      userId,
      title,
      description,
      dueDate: due_date
    });

    return res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all tasks for authenticated user
 * GET /api/tasks
 */
async function getTasks(req, res, next) {
  try {
    const userId = req.user.id;
    const { status, search, sortBy, order } = req.query;

    const tasks = await TaskModel.getTasksByUser(userId, {
      status,
      search,
      sortBy,
      order
    });

    return res.status(200).json({
      success: true,
      data: {
        tasks,
        count: tasks.length
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single task by ID
 * GET /api/tasks/:id
 */
async function getTaskById(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format.'
      });
    }

    const task = await TaskModel.findByIdAndUser(taskId, req.user.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      data: { task }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing task
 * PUT /api/tasks/:id
 */
async function updateTask(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format.'
      });
    }

    const { title, description, due_date } = req.body;

    const updatedTask = await TaskModel.update(taskId, req.user.id, {
      title,
      description,
      dueDate: due_date
    });

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: { task: updatedTask }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
async function deleteTask(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format.'
      });
    }

    const deleted = await TaskModel.delete(taskId, req.user.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a task as completed
 * PATCH /api/tasks/:id/complete
 */
async function markTaskCompleted(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format.'
      });
    }

    const task = await TaskModel.setStatus(taskId, req.user.id, 'COMPLETED');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task marked as completed.',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a completed task as pending again
 * PATCH /api/tasks/:id/pending
 */
async function markTaskPending(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format.'
      });
    }

    const task = await TaskModel.setStatus(taskId, req.user.id, 'PENDING');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task marked as pending.',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  markTaskCompleted,
  markTaskPending
};
