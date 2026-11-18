const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');
const { validateTaskInput } = require('../middleware/validation');

// All task routes require authentication
router.use(authenticateToken);

// CRUD routes
router.post('/', validateTaskInput, taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', validateTaskInput, taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Status toggle routes
router.patch('/:id/complete', taskController.markTaskCompleted);
router.patch('/:id/pending', taskController.markTaskPending);

module.exports = router;
